# Coworking Service Desk

Production-grade single-tenant SaaS for coworking operations.

## Topology

- DB machine: PostgreSQL 16, Redis 7 with AOF, backup jobs.
- APP machine: Nginx, Vite-built frontend, stateless Fastify API instances, BullMQ workers.
- Backend instances are stateless. Sessions are stored in PostgreSQL, not Redis.
- Socket.io uses Redis Adapter for horizontal fanout. Websocket is an optimization and never the source of truth.

## Consistency

- Strong consistency: auth, sessions, tickets, status transitions.
- Eventual consistency: dashboard cache, websocket events, async notifications.
- All APIs are versioned under `/api/v1`.
- All persisted timestamps are UTC. `COWORKING_TIMEZONE` is only for SLA business rules.

## PostgreSQL Pooling

`DATABASE_URL` includes `connection_limit`. Total DB connections are roughly:

`api_replicas * api_connection_limit + worker_replicas * worker_connection_limit + admin_margin`

Keep this below PostgreSQL `max_connections` or use PgBouncer/managed pooling before scaling aggressively. Future read replicas should be introduced behind repository methods, keeping writes on primary.

Never run destructive migrations or `prisma reset` in production.

## Degradation

- Redis down: API keeps serving DB-backed operations without cache and without distributed websocket fanout.
- SMTP down: in-app notifications continue; email jobs retry and eventually land in DLQ.
- Worker down: API continues; jobs accumulate in Redis.
- S3 down: upload endpoint fails in isolation.
- Websocket down: frontend refetches REST on reconnect/disconnect.

## Cache Policy

`CacheService` implements short TTL, explicit invalidation, stale-while-revalidate, jitter, and lock-based stampede prevention. Do not cache sessions, chat, critical ticket mutations, or notifications.

## Deploy

Use readiness checks for rolling updates. Backend boots only after DB and Redis are healthy in compose. Graceful shutdown closes Fastify, Prisma, Redis, Socket.io listeners, BullMQ workers, queues, and timers.
