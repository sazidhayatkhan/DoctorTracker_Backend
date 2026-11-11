# syntax=docker/dockerfile:1

# Doctor Tracker API — multi-stage build
#   deps       → all dependencies (incl. TypeScript) for compiling
#   build      → compiles src/ to dist/
#   prod-deps  → production dependencies only
#   runtime    → dist/ + prod node_modules, non-root, ~no build tooling
#
# Build: docker build -t doctor-tracker-api .
# Run:   docker run --env-file .env -p 5000:5000 doctor-tracker-api

ARG NODE_VERSION=24

# ── Base ─────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

# ── Dependencies for the build ──────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── Compile TypeScript ──────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production dependencies only ────────────────────────────────────────
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# ── Runtime ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runtime

# tini runs as PID 1 so SIGTERM from `docker stop` reaches Node promptly
RUN apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Secrets (MONGODB_URI, JWT_*, ADMIN_*) come from the environment at run
# time; .env is excluded from the build context by .dockerignore.
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
