# TestSprite Validation

Use TestSprite as an architecture and production-readiness reviewer, not only a code test generator.

## Recommended Prompt

Validate Coworking Service Desk as a realtime distributed operations platform using React, Fastify, PostgreSQL, Redis, BullMQ, Socket.io, Prisma and Docker Compose. Focus on architecture, race conditions, consistency, workers, cache, websocket, security, N+1 queries, retries, DLQ, distributed locks, memory leaks and production readiness.

## Required Validation Areas

- stateless backend architecture;
- API/workers separation;
- PostgreSQL as source of truth;
- Redis only for cache/queues/pub-sub/locks;
- session revocation and refresh rotation;
- optimistic locking;
- idempotency;
- Prisma transactions;
- websocket reconnect REST refetch;
- BullMQ retry/backoff/DLQ;
- distributed locks and TTL;
- cache stale-while-revalidate and invalidation;
- N+1 query prevention;
- upload MIME validation;
- RBAC;
- rate limits;
- graceful shutdown;
- memory leak prevention.

## Expected Output

TestSprite should classify findings as:

- Critical: blocks merge.
- High: blocks production.
- Medium: requires issue or mitigation.
- Low: acceptable with tracking.

Every finding should include file, line, risk, reproduction and remediation.
