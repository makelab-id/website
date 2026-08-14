# Makelab

A real, standalone implementation of the `Makelab.dc.html` design — a 3D-printing
shop site for Yogyakarta, Indonesia, with an instant price calculator and a
WhatsApp-driven ordering flow. The original was authored in Claude Design's
`.dc` format, which only runs inside the design tool's preview; this is a
full rebuild as a deployable app.

## Architecture

Single Node "monolith" process — one server, one port, in both dev and prod:

- **Frontend**: React + Vite SPA, routed with React Router (`/`, `/quote`,
  `/katalog`, `/harga`, `/tentang` are real URLs).
- **Backend**: Express. In dev it runs Vite in middleware mode inside the
  same process (HMR, no proxy config, no second port). In prod it serves the
  Vite build as static files.
- **Database**: SQLite via Drizzle ORM + better-sqlite3. Pricing rates,
  material/color/quality/infill options, the printable-parts catalog, and
  site-wide settings (WhatsApp number, machine rate, fees, discounts) all
  live here instead of hardcoded arrays.
- **API**: full CRUD REST endpoints for every catalog resource, even though
  there's no admin UI yet (`Admin.dc.html` is out of scope) — see below.

```
db/        Drizzle schema, migrations, seed script, DB client
server/    Express app (API routes + dev/prod wiring)
src/       React app (routes, components, lib)
tests/     Vitest: pricing unit tests, API integration tests, component tests
```

## Setup

```bash
npm install
cp .env.example .env        # PORT and DATABASE_URL — defaults are fine locally
npm run db:migrate
npm run db:seed             # populates materials/colors/quality/infill/models/settings
```

## Running

```bash
npm run dev                 # http://localhost:4000 — one process, API + client, HMR
```

```bash
npm run build                # vite build (client) + esbuild bundle (server)
npm start                    # NODE_ENV=production node dist/server/index.js
```

## Docker

```bash
docker compose up --build
```

Builds the client, server, and seed script, then serves the site at
`http://localhost:4000`. The SQLite file lives in a named volume
(`makelab-data`), so data survives container restarts; migrations run
automatically on boot and seeding is idempotent, so it's safe to run on
every start.

## Testing

```bash
npm test                    # pricing calculator unit tests, API CRUD/validation
                             # tests (temp SQLite files, never the dev DB), and
                             # component tests (routes, Quote interaction, Katalog
                             # filtering, Nav active state)
npm run typecheck           # tsc --noEmit across client, server, and db
```

## API

```
GET/POST      /api/materials        GET/PUT/DELETE /api/materials/:id
GET/POST      /api/colors           GET/PUT/DELETE /api/colors/:id
GET/POST      /api/quality-options  GET/PUT/DELETE /api/quality-options/:id
GET/POST      /api/infill-options   GET/PUT/DELETE /api/infill-options/:id
GET/POST      /api/models           GET/PUT/DELETE /api/models/:id
GET/PUT       /api/settings                          (singleton row, no create/delete)
```

The frontend only reads from these (no admin UI ships in this repo), but the
schema and routes are already CRUD-complete so a future admin page can be
added without any backend rework.

## Swapping in real photos

The hero image and catalog cards currently render generated placeholder
tiles (`src/components/ImagePlaceholder.tsx`) instead of real photos. To use
a real photo: drop the file in `src/assets/`, import it, and pass it as the
`src` prop to `<ImagePlaceholder>` at that call site — no other changes
needed.

## Notes on fidelity to the original

- The instant price estimate is intentionally derived from the uploaded
  file's byte size, not real mesh geometry (see `fileFrom` in
  `src/lib/pricing.ts`) — this matches the original's behavior and the
  "estimate, confirmed on WhatsApp" copy already sets that expectation.
- The 3D preview (`src/components/PartStage.tsx`) is a decorative rotating
  placeholder shape, ported from the original's `part-stage.js`, now using
  the `three` npm package instead of a runtime CDN import.
