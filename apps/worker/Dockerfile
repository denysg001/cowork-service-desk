FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages packages
COPY apps/api/prisma apps/api/prisma
COPY apps/worker apps/worker
RUN pnpm install --frozen-lockfile=false && pnpm --filter @cowork/worker build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app ./
CMD ["pnpm", "--filter", "@cowork/worker", "start"]
