"""Read-only deployment check; usable on the VPS and an external CI runner."""
import json
import sys
import time
import urllib.request
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET

BASE = sys.argv[1].rstrip('/')
REVISION = sys.argv[2] if len(sys.argv) > 2 else None
CANONICAL = 'https://laresidencenoema.com'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'

def get(path):
    request = urllib.request.Request(BASE + path, headers={
        'Host': 'laresidencenoema.com', 'X-Forwarded-Proto': 'https',
        'User-Agent': 'NOEMA deployment health check'})
    with urllib.request.urlopen(request, timeout=15) as response:
        assert response.status == 200, path
        if REVISION:
            assert response.headers.get('X-Noema-Release') == REVISION, 'Unexpected release: ' + path
        return response.read().decode('utf-8'), response.headers

def check():
    html, _ = get('/')
    assert f'rel="canonical" href="{CANONICAL}/"' in html
    robots, _ = get('/robots.txt')
    assert f'Sitemap: {CANONICAL}/sitemap.xml' in robots
    xml, headers = get('/sitemap.xml')
    assert headers.get_content_type() == 'application/xml'
    root = ET.fromstring(xml)
    assert root.tag == NS + 'urlset'
    locations = [node.text for node in root.findall(NS+'url/'+NS+'loc')]
    assert locations and len(locations) == len(set(locations))
    for url in locations:
        parsed = urlsplit(url)
        assert parsed.scheme == 'https' and parsed.netloc == 'laresidencenoema.com'
        assert not parsed.query and not parsed.fragment
        page, _ = get(parsed.path)
        assert f'rel="canonical" href="{url}"' in page
    apartments, _ = get('/api/apartments')
    assert json.loads(apartments)['success'] is True
    admin, _ = get('/admin/login/')
    assert 'csrfmiddlewaretoken' in admin

for attempt in range(12):
    try:
        check()
        print('PASS: revision, HTTPS (when using https), canonical pages, XML sitemap, robots, PostgreSQL-backed API and admin login')
        break
    except Exception as error:
        if attempt == 11:
            raise
        time.sleep(3)
