#!/usr/bin/env bash
set -euo pipefail
latest="$(ls -t backups/*.dump | head -1)"
docker compose exec -T postgres createdb -U cowork cowork_restore_test || true
docker compose exec -T postgres pg_restore -U cowork -d cowork_restore_test --clean --if-exists < "$latest"
docker compose exec -T postgres psql -U cowork -d cowork_restore_test -c 'select count(*) from "User";'
