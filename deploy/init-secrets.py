"""Run as root on the VPS only, after the owner's approval.

Generates ONLY the approved Django and PostgreSQL secrets. Never prints values,
never asks for or stores the SSH/root password, and never overwrites an existing
configuration. SMTP/OAuth credentials remain empty for secure user entry.
"""
import os
from pathlib import Path
import secrets
import stat
import sys

if sys.platform != 'linux' or os.geteuid() != 0:
    raise SystemExit('Run this only as root on the confirmed NOEMA Linux VPS.')

directory = Path('/etc/noema')
if directory.is_symlink():
    raise SystemExit('Refusing a symlink for the secrets directory.')
directory.mkdir(mode=0o700, exist_ok=True)
metadata = directory.stat()
if metadata.st_uid != 0 or stat.S_IMODE(metadata.st_mode) != 0o700:
    raise SystemExit('/etc/noema must belong to root and have mode 0700.')

app_path = directory / 'app.env'
db_path = directory / 'postgres.env'
if app_path.exists() or db_path.exists() or app_path.is_symlink() or db_path.is_symlink():
    raise SystemExit('Configuration already exists; no secret was changed.')

django_secret = secrets.token_urlsafe(64)
postgres_secret = secrets.token_urlsafe(48)
template = (Path(__file__).parent / 'app.env.example').read_text(encoding='utf-8')
app_content = template.replace('DJANGO_SECRET_KEY=\n', f'DJANGO_SECRET_KEY={django_secret}\n')
app_content = app_content.replace('POSTGRES_PASSWORD=\n', f'POSTGRES_PASSWORD={postgres_secret}\n')
db_content = f'POSTGRES_DB=noema\nPOSTGRES_USER=noema\nPOSTGRES_PASSWORD={postgres_secret}\n'

for target, content in ((app_path, app_content), (db_path, db_content)):
    descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
        stream.write(content)
        stream.flush()
        os.fsync(stream.fileno())

print('Approved Django/PostgreSQL secrets saved with mode 0600; no values displayed.')
print('SMTP and Google OAuth fields must still be completed securely before startup.')
