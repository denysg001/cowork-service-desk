# Deployment

## Data Machine

Run:

```bash
docker compose -f infra/docker-compose.db.yml up -d
```

Expose PostgreSQL and Redis only on the private network. Firewall rules should allow ports `5432` and `6379` only from the App machine private IP.

## App Machine

Run:

```bash
docker compose -f infra/docker-compose.app.yml up -d
```

Scale API locally:

```bash
docker compose -f infra/docker-compose.app.yml up -d --scale backend=2
```

For production replicas, prefer Swarm, Kubernetes or an external load balancer.

## TLS

Terminate TLS at Nginx or an upstream load balancer. Enable HSTS only after HTTPS is confirmed.

## Secure Cookies Behind Proxy

Set:

- `NODE_ENV=production`
- secure cookies enabled
- trusted proxy in Fastify
- correct `FRONTEND_URL`

## Nginx

Nginx proxies:

- `/api/v1` to Fastify;
- `/ws` to Socket.io;
- `/` to React SPA.

## Rollback

Rollback code first, then workers. For migrations use expand/contract so old and new versions remain compatible during rolling updates.

## Ports

| Port | Component | Public |
| --- | --- | --- |
| 80/443 | Nginx | Yes |
| 3000 | API | No |
| 5432 | PostgreSQL | Private only |
| 6379 | Redis | Private only |
