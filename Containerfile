# syntax=docker/dockerfile:1.7
# Multi-stage build for forkme (Next.js 14, standalone output).
# OCI-compatible — works with both Docker and Podman.

# --- deps ---------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# --legacy-peer-deps: matches local resolution; without it, a transitive
#   react-native peer of react@^19 pulls in @types/react@19 and breaks
#   the Next.js type check.
# --ignore-scripts:   skip native addon compile for USB/Ledger transports
#   that the browser bundle never loads.
RUN npm install --no-audit --no-fund --legacy-peer-deps --ignore-scripts

# --- builder ------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* are baked into the build. Pass them via --build-arg.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
ARG NEXT_PUBLIC_SOLANA_NETWORK=devnet
ARG NEXT_PUBLIC_ESCROW_PROGRAM_ID=CNUWqYhXPXszPuB8psqG2VSnwCXf1MWzT4Pztp4y8fgj
ARG NEXT_PUBLIC_REGISTRY_PROGRAM_ID=EM1FgSzfS3F7cCYJWhUaqqPAK7ijZYpYRx7pzYkuyExz
ARG NEXT_PUBLIC_LOYALTY_PROGRAM_ID=BnnUntqkUadZ2BsW8j675P9hJQV3aqVcmt4xG4xfeoM8

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SOLANA_RPC_URL=${NEXT_PUBLIC_SOLANA_RPC_URL} \
    NEXT_PUBLIC_SOLANA_NETWORK=${NEXT_PUBLIC_SOLANA_NETWORK} \
    NEXT_PUBLIC_ESCROW_PROGRAM_ID=${NEXT_PUBLIC_ESCROW_PROGRAM_ID} \
    NEXT_PUBLIC_REGISTRY_PROGRAM_ID=${NEXT_PUBLIC_REGISTRY_PROGRAM_ID} \
    NEXT_PUBLIC_LOYALTY_PROGRAM_ID=${NEXT_PUBLIC_LOYALTY_PROGRAM_ID}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runner -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]
