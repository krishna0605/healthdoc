FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Development
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build
FROM base AS builder
RUN pnpm build

# Production
FROM node:20-alpine AS prod
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
