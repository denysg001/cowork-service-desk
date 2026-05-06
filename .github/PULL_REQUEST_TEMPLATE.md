# Coworking Service Desk Pull Request

## Contexto

**Problema resolvido**
- Descreva o problema operacional ou técnico que esta PR corrige.
- Indique quais fluxos do service desk, NOC, coworking operations ou plataforma SaaS são afetados.

**Motivação**
- Explique por que a mudança precisa existir agora.
- Relacione incidentes, limitações de arquitetura, risco de produção, débito técnico ou melhoria operacional.

**Impacto operacional**
- Descreva o impacto em operadores, agentes, administradores, membros e rotinas de atendimento.
- Informe se há impacto em SLA, triagem, realtime dashboard, notificações, uploads, relatórios ou fila de trabalho.

**Impacto arquitetural**
- Explique se a mudança altera contratos, consistência, escalabilidade horizontal, isolamento entre API/workers, dependência de Redis/PostgreSQL ou estratégia stateless.

## Impacto Técnico

Marque e detalhe somente o que foi alterado.

- [ ] Backend Fastify/API `/api/v1`
- [ ] Frontend React/Vite
- [ ] PostgreSQL/Prisma/schema/migrations
- [ ] Redis/cache/pub-sub/locks
- [ ] Socket.io/websocket realtime
- [ ] BullMQ/workers/filas
- [ ] Nginx/Docker Compose/infra
- [ ] Observabilidade/logs/métricas
- [ ] Segurança/auth/RBAC/sessões
- [ ] Performance/latência/memória/CPU

**Detalhes técnicos**
- Backend:
- Frontend:
- Banco:
- Websocket:
- Workers:
- Filas:
- Cache:
- Observabilidade:
- Segurança:
- Performance:

## Concorrência e Consistência

Documente explicitamente os pontos abaixo. Use `N/A` apenas quando não existir caminho de execução relacionado.

- [ ] Optimistic locking foi preservado ou implementado onde há escrita concorrente.
- [ ] Race conditions foram analisadas para requests simultâneos, workers paralelos e reconnect websocket.
- [ ] Idempotência foi aplicada para comandos reexecutáveis, retries e operações sensíveis.
- [ ] Retry/backoff é determinístico, finito e observável.
- [ ] Distributed locks foram usados quando execução concorrente entre instâncias causa risco.
- [ ] Websocket continua sendo otimização, não fonte de verdade.
- [ ] Reconnect websocket força refetch REST quando necessário.
- [ ] Cache invalidation é explícita para dados mutáveis.
- [ ] Stale cache não afeta dados strong consistency.
- [ ] Transações Prisma protegem invariantes de domínio.
- [ ] Queries evitam N+1 e têm ordenação determinística.
- [ ] Paginação mantém `page`, `limit`, `meta` e ordenação estável.

**Análise de consistência**
- Strong consistency afetada:
- Eventual consistency afetada:
- Invariantes protegidos:
- Cenários concorrentes testados:

## Produção

- [ ] Graceful shutdown continua fechando HTTP, Redis, Prisma, Socket.io, BullMQ listeners, timers e filas.
- [ ] Readiness/health checks continuam refletindo dependências críticas.
- [ ] Rollback é possível sem perda de dados ou incompatibilidade de contrato.
- [ ] Migrações são não destrutivas ou têm plano seguro de expansão/contração.
- [ ] Compatibilidade backward foi preservada para API, eventos websocket e payloads de jobs.
- [ ] A mudança é compatível com múltiplas instâncias backend stateless.
- [ ] A mudança é compatível com workers distribuídos.
- [ ] Impacto em memória/CPU foi avaliado.
- [ ] Impacto em Redis foi avaliado.
- [ ] Impacto em PostgreSQL, índices e pool de conexão foi avaliado.

**Plano de rollback**
- Passos:
- Sinais para rollback:
- Dados que precisam ser preservados:
- Comandos ou flags envolvidos:

**Migrações**
- Tipo de migração:
- Estratégia expand/contract:
- Índices adicionados/removidos:
- Risco de lock em tabela:

## Segurança

- [ ] RBAC/autorização foi validado no backend.
- [ ] Validação Zod cobre todos os inputs novos ou alterados.
- [ ] Upload validation continua verificando tamanho, extensão, path traversal e sanitização.
- [ ] MIME real por magic bytes foi preservado para uploads.
- [ ] Auth/session/JWT/refresh token não foram enfraquecidos.
- [ ] Refresh token não é exposto ao `localStorage`.
- [ ] Rate limit por IP/userId permanece adequado.
- [ ] CORS continua allow-list, sem `origin *`.
- [ ] Headers de segurança continuam corretos: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy e HSTS em produção.
- [ ] Logs não expõem senha, token, cookie, Authorization ou payload sensível.

**Superfície de ataque alterada**
- Endpoints:
- Eventos websocket:
- Jobs BullMQ:
- Uploads:
- Dados sensíveis:

## Observabilidade

- [ ] Logs estruturados JSON incluem `timestamp`, `level`, `service` e `correlationId`.
- [ ] `correlationId` atravessa HTTP, workers, filas, websocket e logs relevantes.
- [ ] Métricas Prometheus foram adicionadas ou preservadas para latência, filas, Redis, PostgreSQL e websocket.
- [ ] Workers têm tracing/logs por job, queue, attempt e failure.
- [ ] Falhas finais vão para DLQ e não somem silenciosamente.
- [ ] Alertas/runbooks foram atualizados quando a mudança altera operação.

**Sinais de produção**
- Métricas novas/alteradas:
- Logs novos/alterados:
- Dashboards impactados:
- Alertas impactados:

## Testes

Marque somente após validar localmente ou em CI.

- [ ] Testes unitários.
- [ ] Testes de integração.
- [ ] Testes websocket.
- [ ] Testes de workers.
- [ ] Edge cases.
- [ ] Testes de concorrência.
- [ ] SLA pause/resume.
- [ ] Realtime/refetch após reconnect.
- [ ] Upload validation.
- [ ] Soft delete.
- [ ] Optimistic locking.
- [ ] Idempotência.
- [ ] Retry/backoff.
- [ ] DLQ.
- [ ] Cache invalidation.
- [ ] Stale cache/stampede prevention.
- [ ] Timeout handling.
- [ ] Distributed locks.
- [ ] Graceful degradation.

**Comandos executados**
```bash

```

**Resultados**
- Build:
- Typecheck:
- Testes:
- Cobertura:

## Frontend

- [ ] Screenshots desktop anexados.
- [ ] Screenshots mobile anexados.
- [ ] Responsividade validada.
- [ ] Loading states implementados.
- [ ] Error states implementados.
- [ ] Empty states implementados quando aplicável.
- [ ] Websocket reconnection invalida cache e refaz fetch REST.
- [ ] Filtros, paginação e ordenação persistem conforme esperado.
- [ ] Textos não sobrepõem controles em mobile/desktop.

**Evidências visuais**
- Desktop:
- Mobile:
- Fluxos testados:

## TestSprite Validation

Solicitar validação automática do TestSprite para os itens abaixo. Falhas devem bloquear merge quando indicarem risco de produção, segurança, dados, concorrência ou disponibilidade.

- [ ] Arquitetura stateless e separação API/workers.
- [ ] Concorrência entre múltiplas instâncias backend.
- [ ] Race conditions em escrita simultânea.
- [ ] Consistência websocket e refetch REST após reconnect.
- [ ] Filas BullMQ, retries, backoff e limites de concorrência.
- [ ] Locks distribuídos e TTLs.
- [ ] Cache, stale-while-revalidate, stampede prevention e invalidação.
- [ ] Escalabilidade horizontal.
- [ ] Segurança de auth, sessões, JWT, RBAC, CORS, rate limit e headers.
- [ ] Gargalos invisíveis em queries, CPU, memória e I/O.
- [ ] Memory leaks em listeners, sockets, workers e timers.
- [ ] Readiness de produção e graceful shutdown.
- [ ] Edge cases críticos.
- [ ] Retries finitos e observáveis.
- [ ] DLQ obrigatória para falhas finais.
- [ ] Consistency issues entre PostgreSQL, Redis, websocket e frontend cache.
- [ ] N+1 queries.
- [ ] Queries pesadas, índices ausentes e ordenação não determinística.
- [ ] Impacto de migrations em tabelas grandes.
- [ ] Readiness para produção real.

**Resultado TestSprite**
- Status:
- Relatório:
- Achados críticos:
- Achados aceitos com justificativa:

## Riscos Conhecidos

- Risco:
- Probabilidade:
- Impacto:
- Mitigação:
- Métrica/log para detectar:

## Débito Técnico Introduzido

- Item:
- Justificativa:
- Prazo recomendado:
- Dono:

## Plano Futuro

- Próximo incremento:
- Pré-requisitos:
- Dependências:
- Critério de sucesso:

## Checklist Final do Autor

- [ ] A PR não adiciona segredos, tokens, dumps, `.env` real ou dados sensíveis.
- [ ] A PR não usa Redis como fonte de verdade de sessão.
- [ ] A PR não adiciona rota fora de `/api/v1`.
- [ ] A PR não torna websocket fonte de verdade.
- [ ] A PR não adiciona migration destrutiva direta.
- [ ] A PR não remove observabilidade de caminho crítico.
- [ ] A PR não reduz segurança para facilitar desenvolvimento.
