FROM node:18-bullseye-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Générer le client Prisma avec le nouveau schéma
RUN npx prisma generate

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN groupadd -r nodejs --gid 1001 \
 && useradd -r -g nodejs --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Générer Prisma (engines glibc) pendant le build
RUN npx prisma generate --schema=./prisma/schema.prisma \
 && rm -rf /app/node_modules/.prisma/client/query-engine* \
 && true

USER nestjs

EXPOSE 4000

ENV PORT=4000

CMD ["sh", "-lc", "npx prisma migrate deploy && node dist/main"]

