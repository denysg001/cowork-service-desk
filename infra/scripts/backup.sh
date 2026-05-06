#!/usr/bin/env bash
set -euo pipefail
mkdir -p infra/backups
docker compose -f infra/docker-compose.db.yml exec -T postgres pg_dump -U cowork -d cowork_service_desk --format=custom > "infra/backups/cowork-$(date -u +%Y%m%dT%H%M%SZ).dump"
