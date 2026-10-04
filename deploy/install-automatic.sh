#!/usr/bin/env bash
# Operator-only installation after approval of the dedicated GitHub -> VPS key.
set -euo pipefail
umask 077
[[ $(id -u) == 0 && $# == 1 ]] || exit 2
public_key=$1
grep -Eq '^ssh-ed25519 [A-Za-z0-9+/]+={0,3}( .*)?$' "$public_key"
cd "$(dirname "$0")"
if ! id noema-deploy >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash noema-deploy
fi
# No password is created; only a forced SSH command is permitted by this key.
install -d -m 0755 -o root -g root /home/noema-deploy/.ssh
{ printf 'restrict,command="sudo -n /usr/local/sbin/noema-receive" '; cat "$public_key"; } > /home/noema-deploy/.ssh/authorized_keys
chown root:root /home/noema-deploy/.ssh/authorized_keys
chmod 0644 /home/noema-deploy/.ssh/authorized_keys
# The home is root owned so the deploy user cannot replace the restricted key file.
chown root:root /home/noema-deploy
chmod 0755 /home/noema-deploy
printf 'noema-deploy ALL=(root) NOPASSWD: /usr/local/sbin/noema-receive ""\n' > /etc/sudoers.d/noema-deploy
chmod 0440 /etc/sudoers.d/noema-deploy
visudo -cf /etc/sudoers.d/noema-deploy
install -d -m 0700 /srv/noema/incoming
install -d -m 0755 /usr/local/lib/noema
install -m 0755 -o root -g root receive.py /usr/local/sbin/noema-receive
install -m 0755 -o root -g root automatic.sh /usr/local/sbin/noema-deploy
install -m 0644 -o root -g root smoke.py /usr/local/lib/noema/smoke.py
if [[ ! -d /srv/noema/deploy.git ]]; then
    git clone --bare --no-hardlinks /srv/noema/current /srv/noema/deploy.git
    git -C /srv/noema/deploy.git remote remove origin
fi
printf 'Restricted deployment receiver installed. No password, billing, DNS or email setting changed.\n'
