#!/usr/bin/python3
"""Root-owned, forced SSH command. Protocol: full SHA + LF + Git bundle.

No shell commands, arbitrary paths, SSH arguments or environment are accepted.
The dedicated key can deploy NOEMA code, so keep it only in this repo's Actions secrets.
"""
import fcntl
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

os.umask(0o077)
os.environ.clear()
os.environ.update(PATH='/usr/sbin:/usr/bin:/sbin:/bin', HOME='/root', LANG='C.UTF-8')
assert os.geteuid() == 0 and len(sys.argv) == 1
lock = open('/run/lock/noema-deploy.lock', 'w')
fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
revision = sys.stdin.buffer.readline(42).decode('ascii').strip()
if not re.fullmatch('[0-9a-f]{40}', revision):
    raise SystemExit('Rejected: expected a full commit SHA.')
root = pathlib.Path('/srv/noema')
repo = root / 'deploy.git'
with tempfile.TemporaryDirectory(prefix='receive-', dir=root / 'incoming') as temp:
    bundle = pathlib.Path(temp) / 'source.bundle'
    total = 0
    with bundle.open('wb') as output:
        while chunk := sys.stdin.buffer.read(1024*1024):
            total += len(chunk)
            if total > 200*1024*1024:
                raise SystemExit('Rejected: source bundle exceeds 200 MiB.')
            output.write(chunk)
    def git(*args, capture=False):
        return subprocess.run(['git', '-C', str(repo), *args], check=True, text=True,
                              stdout=subprocess.PIPE if capture else None).stdout
    git('bundle', 'verify', str(bundle))
    refs = git('bundle', 'list-heads', str(bundle), capture=True).splitlines()
    if refs != [revision + ' refs/heads/noema-deployment']:
        raise SystemExit('Rejected: bundle reference does not match the validated commit.')
    git('fetch', '--no-tags', str(bundle), 'refs/heads/noema-deployment')
    current = subprocess.check_output(['git','-C',str(root/'current'),'rev-parse','HEAD'],text=True).strip()
    if revision == current:
        print('This commit is already deployed; no changes made.')
        raise SystemExit(0)
    git('merge-base', '--is-ancestor', current, revision)
    unit = 'noema-deploy-' + revision[:12]
    result = subprocess.run(['systemd-run', '--quiet', '--wait', '--collect', '--unit='+unit,
        '--property=Type=exec', '--property=RuntimeMaxSec=1500',
        '/usr/local/sbin/noema-deploy', revision])
    # Build/probe logs do not print the production environment or customer records.
    subprocess.run(['journalctl','--no-pager','-o','cat','-u',unit,'-n','180'])
    raise SystemExit(result.returncode)
