import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { COOKIE_PREFERENCE_KEY, preferenceExpiry, readCookiePreference, saveCookiePreference } from '../frontend/src/utils/cookiePreference';

test('cookie choices expire after six calendar months, including month ends and refusal', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => { values.delete(key); } };
  const now = Date.parse('2026-08-31T12:00:00Z');
  const expiry = Date.parse('2027-02-28T12:00:00Z');
  assert.equal(preferenceExpiry(now), expiry);
  for (const choice of ['accepted', 'refused'] as const) {
    saveCookiePreference(storage, choice, now);
    assert.equal(readCookiePreference(storage, expiry - 1), choice);
    assert.equal(readCookiePreference(storage, expiry), null);
  }
  values.set(COOKIE_PREFERENCE_KEY, 'accepted');
  assert.equal(readCookiePreference(storage, now), null);
  saveCookiePreference(storage, 'accepted', now + 1000);
  assert.equal(readCookiePreference(storage, now), null);
});

test('production serves crawlable legal pages, canonical URLs, sitemap and real 404 responses', async () => {
  const probe = createServer();
  await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = (probe.address() as { port: number }).port;
  await new Promise<void>(resolve => probe.close(() => resolve()));
  const child = spawn(process.execPath, ['frontend/dist/server.cjs'], { env: { ...process.env, NODE_ENV: 'production', PORT: String(port) }, stdio: ['ignore', 'ignore', 'pipe'] });
  let startupError = '';
  child.stderr.on('data', chunk => { startupError += String(chunk); });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) { if (child.exitCode !== null) break; try { if ((await fetch(base + '/')).ok) { ready = true; break; } } catch {} await delay(250); }
    assert.ok(ready, 'Express starts with the SSR legal components: ' + startupError);
    const home = await (await fetch(base + '/')).text();
    assert.match(home, /rel="canonical" href="https:\/\/laresidencenoema.com\/"/);
    const structured = JSON.parse(home.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
    assert.equal(structured['@graph'].find((node: any) => node['@type'] === 'ApartmentComplex').name, 'Résidence NOEMA');
    for (const pathname of ['politique-de-confidentialite', 'mentions-legales', 'politique-des-cookies']) {
      const response = await fetch(`${base}/${pathname}/`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, new RegExp(`rel="canonical" href="https://laresidencenoema.com/${pathname}/"`));
      assert.doesNotMatch(html, /À COMPLÉTER|officielle à confirmer/);
      assert.match(html, /<h1/);
      if (pathname !== 'politique-des-cookies') assert.match(html, /BPM 721 Cidex 03/);
      const scriptPath = html.match(/<script[^>]+src="([^"]+)"/)![1];
      assert.ok(scriptPath.startsWith('/assets/'), 'Assets are absolute on nested pages');
      assert.equal((await fetch(base + scriptPath)).status, 200);
      const redirect = await fetch(`${base}/${pathname}?source=test`, { redirect: 'manual' });
      assert.equal(redirect.status, 301);
      assert.equal(redirect.headers.get('location'), `/${pathname}/?source=test`);
    }
    const map = await fetch(base + '/sitemap.xml');
    assert.match(map.headers.get('content-type')!, /xml/);
    assert.equal(((await map.text()).match(/<loc>/g) || []).length, 4);
    assert.match(await (await fetch(base + '/robots.txt')).text(), /Sitemap: https:\/\/laresidencenoema.com\/sitemap.xml/);
    for (const unknown of ['/invented-page/', '/images/missing.webp', '/server.cjs', '/server.cjs.map']) assert.equal((await fetch(base + unknown)).status, 404);
    assert.equal((await fetch(base + '/index.html', { redirect: 'manual' })).status, 301);
  } finally { child.kill(); }
});
