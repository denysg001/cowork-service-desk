FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages packages
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/worker apps/worker
RUN pnpm install --frozen-lockfile=false && pnpm --filter @cowork/api prisma:generate && pnpm --filter @cowork/worker build:only

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app ./
CMD ["pnpm", "--filter", "@cowork/worker", "start"]
