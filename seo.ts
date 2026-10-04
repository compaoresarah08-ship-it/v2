import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LegalPage } from './frontend/src/components/LegalPage';

export const SITE_URL = 'https://laresidencenoema.com';
const image = `${SITE_URL}/images/noema%20fa%C3%A7ade.webp`;
export const publicPages = {
  '/': { title: 'Résidence NOEMA : appartements T2 et T3 à Angré, Abidjan', description: 'Découvrez la Résidence NOEMA à Angré Djorogobité, Abidjan : appartements T2 et T3, plans, disponibilités et simulation de financement. Contactez URIEL GROUP Afrique.' },
  '/politique-de-confidentialite/': { title: 'Politique de confidentialité | Résidence NOEMA', description: 'Données personnelles, finalités, durées de conservation et contact confidentialité du site Résidence NOEMA.', kind: 'privacy' },
  '/mentions-legales/': { title: 'Mentions légales | Résidence NOEMA', description: 'Informations sur URIEL GROUP Afrique, éditeur du site Résidence NOEMA, et sur son hébergement.', kind: 'legal' },
  '/politique-des-cookies/': { title: 'Politique des cookies | Résidence NOEMA', description: 'Cookies nécessaires, contenus tiers et mémorisation pendant six mois de votre choix sur le site Résidence NOEMA.', kind: 'cookies' },
} as const;

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function renderPublicPage(template: string, pathname: keyof typeof publicPages): string {
  const page = publicPages[pathname];
  const canonical = SITE_URL + pathname;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/, `<meta name="description" content="${escape(page.description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/, `<meta property="og:title" content="${escape(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/, `<meta property="og:description" content="${escape(page.description)}" />`);
  const schema = pathname === '/' ? {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#organisation`, name: 'URIEL GROUP Afrique', legalName: 'URIEL GROUP Afrique', url: SITE_URL, email: 'finance@urielgroup.fr' },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Résidence NOEMA', url: SITE_URL, inLanguage: 'fr', publisher: { '@id': `${SITE_URL}/#organisation` } },
      { '@type': 'ApartmentComplex', '@id': `${SITE_URL}/#residence`, name: 'Résidence NOEMA', url: SITE_URL, image, description: 'Programme résidentiel proposant des appartements T2 et T3 à Angré Djorogobité, Cocody, Abidjan.', address: { '@type': 'PostalAddress', addressLocality: 'Abidjan', addressRegion: 'Cocody, Angré Djorogobité', addressCountry: 'CI' } },
    ],
  } : null;
  const meta = `<link rel="canonical" href="${canonical}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta property="og:url" content="${canonical}" />
<meta property="og:site_name" content="Résidence NOEMA" />
<meta property="og:locale" content="fr_CI" />
<meta property="og:image" content="${image}" />
<meta property="og:image:alt" content="Façade de la Résidence NOEMA à Angré Djorogobité, Abidjan" />
<meta name="twitter:title" content="${escape(page.title)}" />
<meta name="twitter:description" content="${escape(page.description)}" />
<meta name="twitter:image" content="${image}" />
${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
  html = html.replace('</head>', `${meta}\n</head>`);
  // The same legal component is visible with or without JavaScript. This also
  // lets OAuth reviewers and crawlers read the policy directly from the HTML.
  if ('kind' in page) html = html.replace('<div id="root"></div>', `<div id="root">${renderToString(createElement(LegalPage, { kind: page.kind }))}</div>`);
  return html;
}

export function sitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(publicPages).map(path => `<url><loc>${SITE_URL}${path}</loc></url>`).join('')}</urlset>`;
}

export const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
