# Coworking Service Desk

[![CI](https://github.com/denysg001/cowork-service-desk/actions/workflows/ci.yml/badge.svg)](https://github.com/denysg001/cowork-service-desk/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-20.x-1f6f50)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-336791)
![Redis](https://img.shields.io/badge/redis-7-bb2222)
![Licenca](https://img.shields.io/badge/licenca-MIT-blue)

Coworking Service Desk é uma plataforma SaaS single-tenant para operação de coworking. A proposta é funcionar como um painel premium de operações, inspirado em NOC/centro de controle, e não como um helpdesk genérico.

O sistema organiza chamados, empresas clientes, usuários, salas, categorias, fornecedores, SLA, chat, notificações, relatórios, mapa visual, auditoria, workers distribuídos e atualizações realtime.

## Sumário

- [Visão Geral](#visão-geral)
- [Diferença Para Um Helpdesk Comum](#diferença-para-um-helpdesk-comum)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura Do Repositório](#estrutura-do-repositório)
- [Como Testar Com Docker](#como-testar-com-docker)
- [Credenciais Seed](#credenciais-seed)
- [Como Testar A API](#como-testar-a-api)
- [Como Testar Observabilidade](#como-testar-observabilidade)
- [Desenvolvimento Local Sem Docker Completo](#desenvolvimento-local-sem-docker-completo)
- [Variáveis De Ambiente](#variáveis-de-ambiente)
- [Rotas Principais](#rotas-principais)
- [Workers E Filas](#workers-e-filas)
- [WebSocket](#websocket)
- [SLA](#sla)
- [Uploads](#uploads)
- [Segurança](#segurança)
- [Testes E CI](#testes-e-ci)
- [Documentação](#documentação)
- [Troubleshooting](#troubleshooting)

## Visão Geral

Modelo de produto:

- uma instalação atende um coworking;
- empresas são clientes/locatárias do coworking, não tenants isolados;
- usuários `CLIENT` pertencem a empresas;
- usuários `OPERATOR` e `ADMIN` são equipe interna do coworking;
- PostgreSQL é a fonte da verdade;
- Redis acelera cache, filas, pub/sub e locks, mas não armazena sessão como fonte da verdade;
- WebSocket melhora a experiência realtime, mas REST continua sendo a fonte de verdade.

## Diferença Para Um Helpdesk Comum

Este projeto prioriza operação física e SLA:

- salas e mapa visual são entidades de primeira classe;
- SLA depende de categoria e horário útil do coworking;
- operadores têm painel, relatórios, filas e chat interno;
- histórico e auditoria registram decisões operacionais;
- workers processam SLA, notificações, relatórios e limpeza fora do servidor HTTP.

## Arquitetura

```mermaid
flowchart LR
  Browser[React SPA] --> Nginx[Nginx]
  Nginx --> API[Fastify API stateless]
  Nginx --> Web[React build estático]
  API --> PG[(PostgreSQL 16)]
  API --> Redis[(Redis 7 AOF)]
  Worker[BullMQ Workers] --> Redis
  Worker --> PG
  API <-->|Socket.io Redis Adapter| Redis
  Prom[Prometheus] --> API
  Grafana[Grafana] --> Prom
```

Topologia alvo em produção:

- Máquina DB: PostgreSQL, Redis e backups.
- Máquina APP: Nginx, frontend estático, backend Fastify e workers.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 18, TypeScript strict, Vite, Tailwind CSS, Zustand |
| Dados frontend | TanStack Query v5, Axios |
| Formulários | React Hook Form, Zod |
| Realtime | Socket.io client/server, Redis Adapter |
| Backend | Node.js 20, Fastify, TypeScript strict |
| Banco | PostgreSQL 16, Prisma ORM |
| Redis | Cache, BullMQ, pub/sub, locks distribuídos |
| Auth | JWT, refresh token em cookie httpOnly, bcrypt |
| Logs | Winston JSON |
| Testes | Vitest |
| Infra | Docker Compose, Nginx, Prometheus, Grafana |

## Estrutura Do Repositório

```text
apps/api          Backend Fastify
apps/web          Frontend React
apps/worker       Workers BullMQ
packages/shared   Schemas Zod e tipos compartilhados
infra             Docker Compose, Nginx, Redis, Postgres, observabilidade
docs              Documentação operacional e arquitetural
.github           Workflows e templates
```

## Como Testar Com Docker

### 1. Preparar `.env`

```bash
cp .env.example .env
```

Para desenvolvimento local com Docker Compose, mantenha:

```env
DATABASE_URL=postgresql://cowork:cowork@postgres:5432/cowork_service_desk?schema=public&connection_limit=10&pool_timeout=10
REDIS_URL=redis://:cowork-redis-password@redis:6379/0
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
FRONTEND_URL=http://localhost:8080
```

### 2. Subir banco e Redis

```bash
docker compose up -d postgres redis
```

Validar:

```bash
docker compose ps
docker compose exec postgres pg_isready -U cowork -d cowork_service_desk
docker compose exec redis redis-cli -a cowork-redis-password ping
```

### 3. Rodar migrations e seed

```bash
docker compose run --rm backend pnpm --filter @cowork/api prisma:migrate
docker compose run --rm backend pnpm --filter @cowork/api prisma:seed
```

### 4. Subir aplicação completa

```bash
docker compose up -d --build backend worker web nginx prometheus grafana
```

### 5. Acessar

- Aplicação: http://localhost:8080
- Health: http://localhost:8080/health
- Readiness: http://localhost:8080/ready
- Métricas: http://localhost:8080/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

### 6. Ver logs

```bash
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f nginx
```

## Credenciais Seed

| Papel | Email | Senha |
| --- | --- | --- |
| ADMIN | `admin@coworking.com` | `admin123` |
| OPERATOR | `op1@coworking.com` | `oper123` |
| OPERATOR | `op2@coworking.com` | `oper123` |

O seed também cria empresas, clientes, salas, categorias, fornecedores, tickets, mensagens, histórico e audit logs.

## Como Testar A API

Login via Nginx:

```bash
curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@coworking.com","password":"admin123"}'
```

Copie o `accessToken` da resposta e teste tickets:

```bash
curl http://localhost:8080/api/v1/tickets \
  -H "authorization: Bearer SEU_ACCESS_TOKEN"
```

Testar dashboard:

```bash
curl http://localhost:8080/api/v1/dashboard/summary \
  -H "authorization: Bearer SEU_ACCESS_TOKEN"
```

Testar DLQ admin:

```bash
curl http://localhost:8080/api/v1/admin/dlq \
  -H "authorization: Bearer SEU_ACCESS_TOKEN"
```

## Como Testar Observabilidade

Prometheus:

```bash
open http://localhost:9090
```

Consultas úteis:

```text
cowork_http_request_duration_seconds_count
cowork_websocket_connections
```

Grafana:

```bash
open http://localhost:3001
```

Login padrão da imagem Grafana:

- usuário: `admin`
- senha: `admin`

## Desenvolvimento Local Sem Docker Completo

Use Docker apenas para Postgres e Redis:

```bash
docker compose up -d postgres redis
npx pnpm@9.12.3 install
npx pnpm@9.12.3 --filter @cowork/api prisma:generate
npx pnpm@9.12.3 --filter @cowork/api prisma:dev
npx pnpm@9.12.3 --filter @cowork/api prisma:seed
npx pnpm@9.12.3 --filter @cowork/api dev
npx pnpm@9.12.3 --filter @cowork/worker dev
npx pnpm@9.12.3 --filter @cowork/web dev
```

Nesse modo, ajuste `DATABASE_URL` e `REDIS_URL` para `localhost`.

## Variáveis De Ambiente

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL com limite de pool |
| `REDIS_URL` | Redis com senha |
| `JWT_ACCESS_SECRET` / `JWT_SECRET` | Assinatura do access token |
| `JWT_REFRESH_SECRET` / `REFRESH_SECRET` | Assinatura/rotação do refresh token |
| `COOKIE_SECRET` | Cookie httpOnly |
| `SESSION_MAX_PER_USER` | Limite de sessões por usuário |
| `COWORKING_TIMEZONE` | Timezone usado para SLA |
| `BODY_LIMIT_BYTES` | Limite de JSON |
| `UPLOAD_MAX_SIZE_MB` | Limite de upload |
| `UPLOAD_ALLOWED_TYPES` | MIME types permitidos |
| `UPLOAD_STORAGE` | `local` ou `s3` |
| `SMTP_*` | Configuração futura de email |

## Rotas Principais

Operacionais sem versão:

- `GET /health`
- `GET /ready`
- `GET /metrics`

Negócio em `/api/v1`:

- Auth: login, refresh, logout e sessões.
- Tickets: listagem, criação, detalhe, atualização, status, histórico e anexos.
- Chat: mensagens client/internal.
- Admin: usuários, empresas, salas, categorias, fornecedores e DLQ.
- Dashboard: resumo operacional.
- Reports: tickets, operadores, SLA e salas.
- Notifications: listagem e marcação de leitura.

## Workers E Filas

Filas versionadas:

- `sla-check-v1`
- `notifications-v1`
- `reports-jobs-v1`
- `cleanup-jobs-v1`

Workers são processos separados e não iniciam Fastify nem abrem porta HTTP.

## WebSocket

Socket.io autentica via JWT no handshake e usa Redis Adapter para múltiplas instâncias.

Rooms planejadas:

- `user:{userId}`
- `ticket:{ticketId}`
- `role:operator`
- `role:admin`

Ao reconectar, o frontend invalida queries e refaz fetch REST.

## SLA

SLA usa categoria, horário útil, timezone `COWORKING_TIMEZONE`, pausa acumulada e worker distribuído. O módulo `apps/api/src/modules/sla/calculator.ts` contém a base testável.

## Uploads

Uploads validam:

- tamanho;
- nome de arquivo;
- path traversal;
- extensão;
- MIME real por magic bytes;
- divergência extensão/MIME.

## Segurança

Implementado ou preparado:

- JWT access token;
- refresh token em cookie httpOnly;
- sessões como fonte da verdade no PostgreSQL;
- CORS allow-list;
- Helmet/CSP;
- rate limit;
- RBAC base;
- upload seguro;
- logs com masking/truncamento.

## Testes E CI

Rodar localmente:

```bash
npx pnpm@9.12.3 build
npx pnpm@9.12.3 test
docker build -f apps/api/Dockerfile .
docker build -f apps/worker/Dockerfile .
docker build -f apps/web/Dockerfile .
```

O GitHub Actions executa:

- Prisma generate;
- build do pacote shared;
- typecheck;
- testes;
- build;
- Docker build API/worker/web;
- validação básica de segurança;
- validação de docs.

## Documentação

- `docs/architecture.md`
- `docs/api.md`
- `docs/deployment.md`
- `docs/operations.md`
- `docs/security.md`
- `docs/observability.md`
- `docs/testsprite.md`
- `docs/versioning.md`
- `docs/backup-restore.md`
- `docs/troubleshooting.md`

## Troubleshooting

Redis:

```bash
docker compose logs redis
docker compose exec redis redis-cli -a cowork-redis-password ping
```

Postgres:

```bash
docker compose logs postgres
docker compose exec postgres pg_isready -U cowork -d cowork_service_desk
```

Backend:

```bash
docker compose logs -f backend
curl http://localhost:8080/ready
```

WebSocket:

- conferir Nginx em `/ws` e `/socket.io`;
- conferir token JWT;
- conferir Redis Adapter.

Fila travada:

```bash
docker compose logs -f worker
```

Reset local completo, somente em ambiente de desenvolvimento:

```bash
docker compose down -v
docker compose up -d postgres redis
docker compose run --rm backend pnpm --filter @cowork/api prisma:migrate
docker compose run --rm backend pnpm --filter @cowork/api prisma:seed
docker compose up -d --build
```
