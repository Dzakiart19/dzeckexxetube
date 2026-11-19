# syntax=docker/dockerfile:1

# ---------- Stage 1: install dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app

# Enable pnpm via corepack. The repository ships bun.lock (not
# pnpm-lock.yaml), so dependencies are resolved from package.json with a
# permissive lockfile policy.
RUN corepack enable pnpm

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

# ---------- Stage 2: build the application ----------
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm

# Reuse the dependency tree from the previous stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# `pnpm build` runs `next build` (output: standalone) and copies
# .next/static + public into .next/standalone, per package.json.
RUN pnpm build

# ---------- Stage 3: minimal runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# The Next.js standalone server reads PORT and HOSTNAME. Bind to all
# interfaces so the container is reachable from outside.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone output (already bundles the traced node_modules and,
# thanks to the build script, its own .next/static + public). The extra COPY
# lines below re-assert the documented standalone layout.
COPY --from=builder --chown=node:node /app/.next/standalone ./.next/standalone
COPY --from=builder --chown=node:node /app/.next/static ./.next/standalone/.next/static
COPY --from=builder --chown=node:node /app/public ./.next/standalone/public

# Run as the non-root `node` user provided by the base image.
USER node

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
