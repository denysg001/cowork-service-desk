# Changelog

All notable changes to Coworking Service Desk are documented in this file.

The format follows Keep a Changelog, and the project uses Semantic Versioning.

## [Unreleased]

### Added

- Enterprise governance backlog for domain expansion, documentation, TestSprite validation and production readiness.

## [0.1.0-alpha] - 2026-05-06

### Added

- Initial monorepo with Fastify API, React frontend, BullMQ workers and shared contracts.
- PostgreSQL/Prisma schema foundation with users, sessions, tickets, audit logs, outbox, attachments, idempotency and DLQ.
- Redis-backed cache service with stale-while-revalidate and lock-based stampede protection.
- Socket.io with Redis Adapter and JWT authentication.
- Docker Compose, Nginx, Redis AOF, Prometheus and Grafana provisioning.
- GitHub CI workflow and technical pull request template for TestSprite-oriented validation.

### Security

- JWT access tokens, httpOnly refresh cookie, structured masking and upload magic-byte validation.

### Known Gaps

- Coverage is below the 70% production target.
- Domain modules, SLA engine, chat, reports, map and admin workflows are still expanding toward the enterprise prompt.
