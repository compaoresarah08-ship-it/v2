#!/usr/bin/env bash
# Back up only NOEMA containers and media. Never reads or changes WordPress.
set -euo pipefail
umask 077
cd "$(dirname "$0")"
exec 9>/run/lock/noema-backup.lock
flock -n 9 || { printf 'A NOEMA backup is already running.\n' >&2; exit 1; }
available_kb=$(df -Pk /srv/noema/backups | awk 'END {print $4}')
media_kb=$(du -sk /srv/noema/media | cut -f1)
if (( available_kb < 5242880 + 2 * media_kb )); then
    printf 'Insufficient free space for a NOEMA backup; existing backups retained.\n' >&2
    exit 1
fi
archive_dir="/srv/noema/backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir "$archive_dir"
docker compose -f compose.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$archive_dir/database.dump"
docker compose -f compose.yml exec -T db pg_restore --list < "$archive_dir/database.dump" > "$archive_dir/database.contents"
tar -C /srv/noema -czf "$archive_dir/media.tar.gz" media
tar -tzf "$archive_dir/media.tar.gz" > "$archive_dir/media.contents"
git -C .. rev-parse HEAD > "$archive_dir/release.txt"
(cd "$archive_dir" && sha256sum database.dump media.tar.gz > SHA256SUMS && sha256sum -c SHA256SUMS)
printf 'Backup created and archive structure verified: %s\n' "$archive_dir"
printf 'An isolated database restore and an off-server copy are still required.\n'
