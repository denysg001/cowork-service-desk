# Troubleshooting

## Redis Offline

Symptoms: cache misses, websocket fanout degraded, queues paused.

Actions:

- check Redis password and network;
- verify AOF disk space;
- restart Redis only after confirming persistence health.

## PostgreSQL Offline

Symptoms: `/ready` fails, API cannot authenticate, workers fail jobs.

Actions:

- run `pg_isready`;
- inspect connection limits;
- check disk and migrations.

## WebSocket Does Not Connect

Actions:

- verify JWT access token;
- inspect Nginx `/ws` upgrade config;
- check Socket.io path compatibility;
- confirm Redis Adapter connection.

## Cookies

Actions:

- dev: `sameSite=lax`, `secure=false`;
- prod: `sameSite=strict`, `secure=true`;
- verify proxy trust and HTTPS.

## CORS

Actions:

- confirm `FRONTEND_URL`;
- remove wildcard origin;
- ensure credentials are intentional.

## Clock Skew

Actions:

- sync server time;
- configure `JWT_CLOCK_SKEW_SECONDS`.

## Prisma Migration Failed

Actions:

- do not reset production;
- create a corrective migration;
- verify locks and long-running transactions.

## Queues Stuck

Actions:

- inspect Redis;
- inspect worker process;
- check delayed jobs and lock keys;
- inspect DLQ.

## DLQ Growing

Actions:

- group by queue and error;
- fix root cause before retry;
- retry in small batches.

## Upload Failing

Actions:

- check size;
- check extension and magic bytes;
- check storage provider credentials;
- inspect path traversal rejection.

## High CPU

Actions:

- inspect report jobs;
- inspect dashboard queries;
- reduce worker concurrency;
- add indexes.

## Memory Leak

Actions:

- check websocket listeners;
- check BullMQ listeners;
- check timers;
- inspect heap snapshots for retained closures.

## Cache Inconsistent

Actions:

- invalidate explicit keys;
- inspect stale TTL;
- verify mutation paths call invalidation.

## Dashboard Not Updating

Actions:

- force REST refetch;
- check websocket;
- inspect dashboard cache TTL.

## Worker Not Processing

Actions:

- verify process is running;
- verify queue names;
- verify Redis auth;
- inspect lock contention.

## Idempotency Conflict

Actions:

- compare request hash;
- check key scope;
- return previous response when identical.

## Optimistic Locking 409

Actions:

- refetch ticket;
- show conflict UI;
- retry only with latest version.
