"""Owner-operated, hidden input for existing SMTP/Google credentials on the VPS."""
import argparse
import getpass
import os
from pathlib import Path
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--smtp', action='store_true')
parser.add_argument('--google', action='store_true')
args = parser.parse_args()
if os.geteuid() != 0 or not (args.smtp or args.google):
    raise SystemExit('Run as root with --smtp and/or --google.')
path = Path('/etc/noema/app.env')
if path.is_symlink() or path.stat().st_uid != 0 or path.stat().st_mode & 0o077:
    raise SystemExit('Expected a root-owned, private configuration file.')
lines = path.read_text().splitlines()
updates = {}

def read_hidden(label):
    value = getpass.getpass(label)
    if not value or any(char in value for char in '\r\n\x00'):
        raise SystemExit('Empty or multiline value refused; nothing was changed.')
    return value

if args.smtp:
    updates.update(EMAIL_HOST='smtp.hostinger.com', EMAIL_PORT='465',
                   EMAIL_USE_TLS='False', EMAIL_USE_SSL='True')
    updates['EMAIL_HOST_PASSWORD'] = read_hidden('Mot de passe EXISTANT de finance@urielgroup.fr (masque) : ')
if args.google:
    client_id = input('Client ID Google OAuth Web : ').strip()
    if not client_id.endswith('.apps.googleusercontent.com') or any(char in client_id for char in '\r\n\x00'):
        raise SystemExit('Invalid Web OAuth client ID; nothing was changed.')
    updates['GOOGLE_CLIENT_ID'] = client_id
    updates['GOOGLE_CLIENT_SECRET'] = read_hidden('Client secret Google OAuth (masque) : ')

present = set()
for index, line in enumerate(lines):
    name = line.split('=', 1)[0]
    if name in updates:
        lines[index] = name + '=' + updates[name]
        present.add(name)
lines.extend(name + '=' + value for name, value in updates.items() if name not in present)
fd, temporary = tempfile.mkstemp(prefix='.integrations-', dir=path.parent)
try:
    with os.fdopen(fd, 'w') as stream:
        stream.write('\n'.join(lines) + '\n')
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)
print('Configuration enregistree avec droits 0600. Aucune valeur secrete affichee.')
