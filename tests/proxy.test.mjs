import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer, request as httpRequest } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: options.method || 'GET', headers: options.headers }, async res => {
      let body = '';
      for await (const chunk of res) body += chunk;
      resolve({ status: res.statusCode, headers: res.headers, json: async () => JSON.parse(body) });
    });
    req.on('error', reject);
    req.end(options.body);
  });
}

test('production Express preserves HTTPS, CSRF and persistent appointment IDs', async () => {
  const received = [];
  let returnEmptyApartments = false;
  const backend = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({ path: req.url, headers: req.headers, body });
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/admin/') {
      res.statusCode = 302;
      res.setHeader('Location', '/admin/login/');
      return res.end('{}');
    }
    if (req.url === '/api/auth/me/') return res.end(JSON.stringify({ authenticated: true, user: { is_staff: true } }));
    if (req.url === '/api/leads/appointment-notification/') {
      res.statusCode = 201;
      return res.end(JSON.stringify({ success: true, data: { lead_id: 123, pipeline_stage: 'meeting_scheduled' } }));
    }
    if (req.url === '/api/apartments/?public=true') {
      if (returnEmptyApartments) return res.end(JSON.stringify([]));
      return res.end(JSON.stringify([
        { id: 1, reference: 'NOEMA-T2-01', name: 'T2', apartment_type: 't2', is_public: true, status: 'available', display_order: 1 },
        { id: 2, reference: 'NOEMA-PH-T2-01', name: 'Penthouse', apartment_type: 't2', is_public: true, status: 'reserved', display_order: 2 },
        { id: 3, reference: 'NOEMA-INTERNAL-01', name: 'Interne', apartment_type: 't2', is_public: false, status: 'available', display_order: 3 },
      ]));
    }
    if (req.method === 'POST') res.statusCode = 201;
    res.end(JSON.stringify([]));
  });
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const portProbe = createServer();
  await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const child = spawn(process.execPath, ['frontend/dist/server.cjs'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), TRUST_PROXY_HOPS: '1', DJANGO_API_URL: `http://127.0.0.1:${backend.address().port}/api` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  const base = `http://127.0.0.1:${port}`;
  const headers = {
    Host: 'laresidencenoema.com', 'X-Forwarded-Proto': 'https',
    'X-Forwarded-For': '192.0.2.10', Origin: 'https://laresidencenoema.com',
    Referer: 'https://laresidencenoema.com/', 'X-CSRFToken': 'test-csrf',
    Cookie: 'sessionid=test-session', 'Content-Type': 'application/json',
  };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      if (child.exitCode !== null) throw new Error(logs);
      try { await fetch(base); ready = true; break; } catch { await delay(250); }
    }
    assert.ok(ready, `Express did not start: ${logs}`);
    for (const path of ['/api/residence', '/api/apartments', '/api/construction', '/api/faq', '/api/auth/me/', '/api/leads']) {
      const response = await request(base + path, { headers });
      assert.equal(response.status, 200, path);
    }
    const publicApartments = await request(base + '/api/apartments?public=true', { headers });
    assert.equal(publicApartments.status, 200);
    assert.ok(received.some(({ path }) => path === '/api/apartments/?public=true'), 'public apartment mode reaches Django');
    const publicApartmentData = await publicApartments.json();
    assert.equal(publicApartmentData.count, 1);
    assert.equal(publicApartmentData.data[0].ref, 'NOEMA-T2-01');
    const reservedDetail = await request(base + '/api/apartments/NOEMA-PH-T2-01?public=true', { headers });
    assert.equal(reservedDetail.status, 404);
    returnEmptyApartments = true;
    const emptyApartments = await request(base + '/api/apartments?public=true', { headers });
    assert.equal((await emptyApartments.json()).count, 0, 'an empty Django result does not reveal stale fallback apartments');
    const admin = await request(base + '/admin/', { headers });
    assert.equal(admin.status, 302);
    assert.equal(admin.headers.location, '/admin/login/');
    const formBodies = [
      ['application/x-www-form-urlencoded', 'csrfmiddlewaretoken=test-token&username=&password='],
      ['multipart/form-data; boundary=noema-test', '--noema-test\r\nContent-Disposition: form-data; name="csrfmiddlewaretoken"\r\n\r\ntest-token\r\n--noema-test\r\nContent-Disposition: form-data; name="hero_image"; filename="test.png"\r\nContent-Type: image/png\r\n\r\nPNG-test-bytes\r\n--noema-test--\r\n'],
    ];
    for (const [contentType, body] of formBodies) {
      const response = await request(base + '/admin/login/', {
        method: 'POST', headers: { ...headers, 'Content-Type': contentType, 'Transfer-Encoding': 'chunked' }, body,
      });
      assert.equal(response.status, 201);
      const upstream = received.at(-1);
      assert.equal(upstream.body, body, 'Django receives all form/upload bytes');
      assert.equal(upstream.headers['content-length'], String(Buffer.byteLength(body)), 'WSGI requires an explicit body length');
      assert.equal(upstream.headers['transfer-encoding'], undefined);
      assert.equal(upstream.headers['content-type'], contentType);
    }
    const lead = await request(base + '/api/leads', { method: 'POST', headers, body: JSON.stringify({ first_name: 'TEST NOEMA' }) });
    assert.equal(lead.status, 201);
    const appointment = await request(base + '/api/appointments', {
      method: 'POST', headers, body: JSON.stringify({
        first_name: 'TEST NOEMA', last_name: 'DEPLOY', email: 'test@example.com',
        phone_whatsapp: '+225000000001', consent_data_processing: true,
        appointment_date: new Date().toISOString().slice(0, 10), appointment_time: '10:00', appointment_mode: 'visio',
      }),
    });
    assert.equal(appointment.status, 201);
    assert.equal((await appointment.json()).data.lead_id, 123);
    for (const request of received) {
      assert.equal(request.headers['x-forwarded-host'], 'laresidencenoema.com', request.path);
      assert.equal(request.headers['x-forwarded-proto'], 'https', request.path);
      assert.equal(request.headers['x-forwarded-for'], '192.0.2.10', request.path);
      assert.equal(request.headers.origin, 'https://laresidencenoema.com', request.path);
      assert.equal(request.headers['x-csrftoken'], 'test-csrf', request.path);
    }
  } finally {
    child.kill();
    await new Promise(resolve => backend.close(resolve));
  }
});
