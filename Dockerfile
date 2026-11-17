# The dashboard as a container (Azure Container Apps: deploy/azure-deploy.sh).
# Amplify does not use this file: it builds from git with its own settings.
#
# NEXT_PUBLIC_* are build arguments: Next bakes them into the bundle, so the
# image is built once per environment from deploy/<env>.env. They are public
# URLs, never secrets. TUTORIA_CLIENT_ID / TUTORIA_CLIENT_SECRET (the login
# route's API client) are runtime env from Key Vault, never in the image.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AI_API_URL
ARG NEXT_PUBLIC_WIDGET_URL
ARG NEXT_PUBLIC_TUTORIALS_ENABLED=true
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL \
    NEXT_PUBLIC_WIDGET_URL=$NEXT_PUBLIC_WIDGET_URL \
    NEXT_PUBLIC_TUTORIALS_ENABLED=$NEXT_PUBLIC_TUTORIALS_ENABLED
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build cache (over 300 MB) is only for the next build; Next makes a fresh
# .next/cache at runtime.
RUN npm run build && rm -rf .next/cache

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AI_API_URL
ARG NEXT_PUBLIC_WIDGET_URL
ARG NEXT_PUBLIC_TUTORIALS_ENABLED=true
# The same values at runtime: `next start` loads next.config.ts again.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_AI_API_URL=$NEXT_PUBLIC_AI_API_URL \
    NEXT_PUBLIC_WIDGET_URL=$NEXT_PUBLIC_WIDGET_URL \
    NEXT_PUBLIC_TUTORIALS_ENABLED=$NEXT_PUBLIC_TUTORIALS_ENABLED
COPY --from=prod-deps /app/node_modules ./node_modules
# `next start` loads next.config.ts through TypeScript (a devDependency with no
# dependencies of its own); without it Next tries to install it at startup.
COPY --from=deps /app/node_modules/typescript ./node_modules/typescript
COPY --from=build /app/package.json /app/next.config.ts ./
COPY --from=build /app/public ./public
# Owned by the app user: Next writes its cache under .next/cache.
COPY --from=build --chown=node:node /app/.next ./.next
# Not root: the image's built-in "node" user (3000 needs no privilege).
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
