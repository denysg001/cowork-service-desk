# Operations

## Health

- `/health`: process is alive.
- `/ready`: PostgreSQL and Redis dependency readiness.
- `/metrics`: Prometheus scrape.

## Logs

Logs are JSON. Every production path should include `service` and `correlationId`.

## Queues

Workers process:

- `sla-check-v1`
- `notifications-v1`
- `reports-jobs-v1`
- `cleanup-jobs-v1`

If a job exhausts attempts, it is persisted to `DeadLetterJob`.

## DLQ

DLQ growth means final failures are happening. Investigate dependency failures, bad payloads, lock contention and code regressions before retrying.

## Restart Worker

```bash
docker compose -f infra/docker-compose.app.yml restart worker
```

## Validate Redis

```bash
redis-cli -a "$REDIS_PASSWORD" ping
```

## Validate PostgreSQL

```bash
pg_isready -h "$POSTGRES_HOST" -U cowork
```

## Validate Websocket

Check Nginx upgrade headers, JWT handshake and Redis Adapter connectivity.

## Validate SLA

Inspect worker logs for batch size, lock acquisition and notification creation.
