#!/usr/bin/env bash
set -euo pipefail
mkdir -p backups
docker compose exec -T postgres pg_dump -U cowork -d cowork_service_desk --format=custom > "backups/cowork-$(date -u +%Y%m%dT%H%M%SZ).dump"
