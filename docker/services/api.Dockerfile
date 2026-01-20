FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN pnpm db:generate

# Copy source
COPY . .

# Development
ENV NODE_ENV=development
EXPOSE 3001
CMD ["pnpm", "dev"]
