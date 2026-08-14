# ---- build ----
FROM node:22-slim AS builder
WORKDIR /app

# better-sqlite3 compiles a native addon on install; needs a C++ toolchain.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Builds the Vite client (dist/client), the esbuild server bundle
# (dist/server/index.js), and the esbuild seed bundle (dist/db/seed.js).
RUN npm run build

# Drop devDependencies now that build artifacts exist — the runtime image
# only needs what dist/server/index.js actually imports at runtime
# (express, drizzle-orm, better-sqlite3, dotenv — see --packages=external
# in package.json's build:server/build:seed scripts).
RUN npm prune --omit=dev

# ---- runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=/app/data/makelab.sqlite

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db/migrations ./db/migrations
COPY package.json ./

# Migrations run automatically on boot (db/client.ts applies them on
# import); seeding is idempotent (db/seed.ts no-ops on non-empty tables),
# so it's safe to run on every container start.
CMD ["sh", "-c", "node dist/db/seed.js && node dist/server/index.js"]

EXPOSE 4000
VOLUME ["/app/data"]
