#!/usr/bin/env bash
set -euo pipefail
# Run only on the confirmed, newly provisioned NOEMA VPS.
test "$(id -u)" = 0
. /etc/os-release
test "$ID" = ubuntu && test "$VERSION_ID" = 24.04

install -d -m 0755 /etc/apt/keyrings
if ! test -f /etc/apt/keyrings/docker.asc; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod 0644 /etc/apt/keyrings/docker.asc
fi
if ! test -f /etc/apt/sources.list.d/docker.sources; then
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
fi
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin linux-image-virtual
systemctl enable --now docker

# Permit access before enabling UFW. No database/backend ports are published.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw default deny incoming
ufw default allow outgoing
ufw --force enable

install -d -m 0700 /etc/noema /srv/noema/backups
install -d -m 0755 -o 10001 -g 10001 /srv/noema/media
install -d -m 0755 /srv/noema/acme /srv/noema/releases
docker version --format '{{.Server.Version}}'
docker compose version
ufw status verbose
systemctl is-enabled docker unattended-upgrades
