# syntax=docker/dockerfile:1
#
# Bytari Expo Web — production image (served at https://bytari.com).
#
#   build   : `expo export --platform web` → static files in /app/dist
#   runtime : unprivileged nginx serving /app/dist (no Node, no node_modules)
#
# EXPO_PUBLIC_* values are inlined into the JS bundle at BUILD time, so they
# are build args, not runtime env. They are PUBLIC by definition — never pass
# a secret here. `src/lib/env.ts` rejects a production build whose API /
# realtime URL is not a public https:// / wss:// origin.

# ---------- Build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG EXPO_PUBLIC_API_BASE_URL=https://api.bytari.com
ARG EXPO_PUBLIC_API_VERSION=v1
ARG EXPO_PUBLIC_REALTIME_URL=wss://api.bytari.com
ARG EXPO_PUBLIC_REALTIME_PATH=/realtime
ARG EXPO_PUBLIC_ENVIRONMENT=production
ARG EXPO_PUBLIC_REQUEST_TIMEOUT_MS=20000
ARG EXPO_PUBLIC_DEBUG_LOGGING=false
ENV NODE_ENV=production \
    CI=1 \
    EXPO_NO_TELEMETRY=1 \
    EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL \
    EXPO_PUBLIC_API_VERSION=$EXPO_PUBLIC_API_VERSION \
    EXPO_PUBLIC_REALTIME_URL=$EXPO_PUBLIC_REALTIME_URL \
    EXPO_PUBLIC_REALTIME_PATH=$EXPO_PUBLIC_REALTIME_PATH \
    EXPO_PUBLIC_ENVIRONMENT=$EXPO_PUBLIC_ENVIRONMENT \
    EXPO_PUBLIC_REQUEST_TIMEOUT_MS=$EXPO_PUBLIC_REQUEST_TIMEOUT_MS \
    EXPO_PUBLIC_DEBUG_LOGGING=$EXPO_PUBLIC_DEBUG_LOGGING

# Fail the image build if a dev API origin (loopback / LAN host WITH a port)
# slipped into the bundle, or if the configured production API URL is missing.
# (A bare 'http://localhost' is a library URL-parsing placeholder — allowed.)
RUN npm run build:web \
 && ! grep -rqE "(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.[0-9.]+):[0-9]+" dist/_expo \
 && grep -rqF "$EXPO_PUBLIC_API_BASE_URL" dist/_expo

# ---------- Runtime ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY deploy/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
