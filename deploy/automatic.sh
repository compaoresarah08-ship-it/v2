#!/usr/bin/env bash
# Install this reviewed file as /usr/local/sbin/noema-deploy, root:root 0755.
# Changes to this control script require operator installation, never self-update.
set -Eeuo pipefail
umask 077
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
exec 9>/run/lock/noema-deploy-execution.lock
flock -n 9 || { echo 'Another NOEMA deployment is running.' >&2; exit 1; }
release=${1:-}
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || exit 2
previous=$(readlink -f /srv/noema/current)
target="/srv/noema/releases/$release"
candidate_django="noema-check-django-${release:0:12}"
candidate_web="noema-check-web-${release:0:12}"
switched=0
cleanup() {
    docker rm -f "$candidate_web" "$candidate_django" >/dev/null 2>&1 || true
}
compose() {
    docker compose --env-file .env -f deploy/compose.yml -f deploy/compose.public.yml "$@"
}
on_exit() {
    status=$?
    trap - EXIT
    cleanup
    if (( status != 0 && switched == 1 )); then
        printf 'New release failed; restoring previous application containers (database is not restored).\n' >&2
        cd "$previous"
        compose up -d --no-deps django web proxy || true
        docker exec noema-proxy-1 nginx -s reload || true
        if python3 /usr/local/lib/noema/smoke.py https://laresidencenoema.com; then
            printf 'Previous application restored and HTTP checks passed.\n'
        else
            printf 'ALERT: rollback health checks failed; operator intervention required.\n' >&2
        fi
    fi
    exit "$status"
}
trap on_exit EXIT
available_kb=$(df -Pk /srv/noema | awk 'END {print $4}')
(( available_kb >= 10485760 )) || { echo 'Deployment blocked: keep at least 10 GiB available.' >&2; exit 1; }
if [[ ! -d "$target" ]]; then
    # Source code must be readable by the non-root users inside the built images.
    # Production environment files remain root-only, outside Git.
    (umask 022; git -C /srv/noema/deploy.git worktree add --detach "$target" "$release")
fi
[[ $(git -C "$target" rev-parse HEAD) == "$release" ]] || exit 1
cd "$target"
printf 'NOEMA_RELEASE=%s\n' "$release" > .env
chmod 600 .env
printf 'Building release %s while the current site stays online.\n' "$release"
compose build django
compose build web
compose run --rm --no-deps django python manage.py check --deploy
# Never apply an unknown schema change while the previous app still serves clients.
if ! compose run --rm --no-deps django python manage.py migrate --check; then
    printf 'Deployment blocked: pending database migrations require a reviewed maintenance operation. Current site unchanged.\n' >&2
    exit 1
fi
docker run -d --name "$candidate_django" --network noema_app --read-only --tmpfs /tmp \
    --cap-drop ALL --security-opt no-new-privileges:true --memory 1024m \
    --env-file /etc/noema/app.env -v /srv/noema/media:/data/media:ro \
    "noema-django:$release" >/dev/null
docker network connect noema_data "$candidate_django"
docker run -d --name "$candidate_web" --network noema_app --read-only --tmpfs /tmp \
    --cap-drop ALL --security-opt no-new-privileges:true --memory 768m \
    -e NODE_ENV=production -e PORT=3000 -e TRUST_PROXY_HOPS=1 -e NOEMA_RELEASE="$release" \
    -e DJANGO_API_URL="http://$candidate_django:8000/api" \
    -e MEDIA_ROOT=/data/media -v /srv/noema/media:/data/media:ro \
    -p 127.0.0.1:18080:3000 "noema-web:$release" >/dev/null
python3 /usr/local/lib/noema/smoke.py http://127.0.0.1:18080 "$release"
cleanup
bash "$previous/deploy/backup.sh"
# Static files are persistent; no database/media deletion or restoration occurs here.
compose run --rm --no-deps django python manage.py collectstatic --noinput
switched=1
compose up -d --no-deps django web proxy
docker exec noema-proxy-1 nginx -t
docker exec noema-proxy-1 nginx -s reload
python3 /usr/local/lib/noema/smoke.py https://laresidencenoema.com "$release"
ln -sfn "$target" /srv/noema/current
switched=0
printf 'DEPLOYED %s; previous release retained at %s\n' "$release" "$previous"
