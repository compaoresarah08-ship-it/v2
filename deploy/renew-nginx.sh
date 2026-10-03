#!/bin/sh
set -eu
if [ "${RENEWED_LINEAGE:-}" = '/etc/letsencrypt/live/laresidencenoema.com' ]; then
    docker exec noema-proxy-1 nginx -t
    docker exec noema-proxy-1 nginx -s reload
fi
