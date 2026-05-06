# Observability

## Logs

Logs are structured JSON with:

- `timestamp`
- `level`
- `service`
- `correlationId`

Critical paths:

- login/logout;
- ticket creation;
- status change;
- worker start/done/fail;
- 5xx errors;
- DLQ persistence.

## Metrics

Prometheus should cover:

- HTTP latency p50/p95/p99;
- requests by route/status;
- 5xx count;
- BullMQ queue depth and job duration;
- Redis latency and cache hit rate;
- PostgreSQL connection utilization;
- websocket connections;
- SLA warnings and breaches.

## Grafana

Grafana provisioning points to Prometheus. Dashboards should be added for API, workers, queues, database, Redis and business SLA.

## Correlation IDs

HTTP creates or propagates `x-correlation-id`. Workers and websocket events should carry the same ID where possible.
