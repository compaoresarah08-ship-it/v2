"""Read configuration locally and report missing names only, never secret values."""
import pathlib
import sys

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/etc/noema/app.env')
if not path.is_file():
    raise SystemExit('Missing configuration file: ' + str(path))
values = {}
for line in path.read_text(encoding='utf-8-sig').splitlines():
    if line and not line.startswith('#') and '=' in line:
        key, value = line.split('=', 1)
        values[key] = value
required = (
    'DJANGO_SECRET_KEY', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD',
    'EMAIL_HOST', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD',
    'DEFAULT_FROM_EMAIL', 'NOEMA_CONTACT_EMAIL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
)
errors = ['Missing: ' + name for name in required if not values.get(name)]
if len(values.get('DJANGO_SECRET_KEY', '')) < 50:
    errors.append('DJANGO_SECRET_KEY must contain at least 50 random characters.')
if values.get('DJANGO_DEBUG', '').lower() != 'false':
    errors.append('DJANGO_DEBUG must be False.')
if values.get('DJANGO_SECURE_SSL_REDIRECT', '').lower() != 'true':
    errors.append('DJANGO_SECURE_SSL_REDIRECT must be True.')
if values.get('EMAIL_USE_TLS', '').lower() == values.get('EMAIL_USE_SSL', '').lower():
    errors.append('Enable exactly one of EMAIL_USE_TLS and EMAIL_USE_SSL.')
if values.get('GOOGLE_REDIRECT_URI') != 'https://laresidencenoema.com/api/auth/google/callback/':
    errors.append('GOOGLE_REDIRECT_URI does not match the production callback.')
for error in errors:
    print(error)
if errors:
    raise SystemExit(1)
print('Configuration names and production flags validated; no secrets displayed.')
