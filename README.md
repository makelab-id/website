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
  material/color/quality/infill/finish options, the printable-parts catalog,
  and site-wide settings (WhatsApp number, machine rate, fees, discounts,
  shell thickness) all live here instead of hardcoded arrays.
- **API**: full CRUD REST endpoints for every catalog resource. GETs are
  public (the storefront reads them); POST/PUT/DELETE require an admin
  session (see Admin panel below). Catalog models also accept a product
  photo upload (`POST /api/models/:id/image`, admin-only), stored on disk
  and served back from `/uploads/*`.
- **Admin panel** (`/admin`): a real port of the design's `Admin.dc.html` —
  password login, then "Opsi Kalkulator" (materials/quality/infill/finish/
  colors/settings), "Katalog Model" (the printable-parts catalog, with
  search, pagination, and photo upload per model), and "Pengaturan" (site-
  wide settings outside the calculator, e.g. the WhatsApp number).

```
db/        Drizzle schema, migrations, seed script, DB client
server/    Express app (API routes + dev/prod wiring)
src/       React app (routes, components, lib)
tests/     Vitest: pricing unit tests, API integration tests, component tests
```

## Setup

```bash
npm install
cp .env.example .env        # set ADMIN_PASSWORD and ADMIN_SESSION_SECRET; PORT/DATABASE_URL defaults are fine locally
npm run db:migrate
npm run db:seed             # populates materials/colors/quality/infill/finish/models/settings
```

`ADMIN_PASSWORD` is the password for `/admin`. `ADMIN_SESSION_SECRET` signs the
admin session cookie — generate a real one with `openssl rand -hex 32`. The
storefront works fine without either set, but `/admin` won't: login 500s
without `ADMIN_PASSWORD` configured, and without `ADMIN_SESSION_SECRET` any
session-signing attempt throws.

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
`http://localhost:4000`. The SQLite file and uploaded catalog photos both
live in a named volume (`makelab-data`), so data survives container
restarts; migrations run
automatically on boot and seeding is idempotent, so it's safe to run on
every start. `docker-compose.yml` loads `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET`
from your local `.env` (`env_file:`) — make sure it exists and isn't left at
the dev placeholder values before exposing this beyond your own machine.

## Testing

```bash
npm test                    # pricing calculator unit tests (incl. the shell+infill
                             # weight model), .stl/.3mf geometry parsing unit tests
                             # (tests/fixtures/), API CRUD/validation/auth tests
                             # (temp SQLite files, never the dev DB) including the
                             # model image upload endpoint, and component tests
                             # (routes, Quote interaction, Katalog filtering, Nav
                             # active state, admin login)
npm run typecheck           # tsc --noEmit across client, server, and db
```

## Admin panel

`/admin` — password login (`ADMIN_PASSWORD`), then:

- **Opsi Kalkulator** (`/admin`) — materials, quality/infill/finish options,
  filament colors, and the flat cost settings (machine rate, setup fee,
  express markup, shell thickness, bulk discount) that back the Quote
  screen's calculator.
- **Katalog Model** (`/admin/katalog`) — the printable-parts catalog: search,
  pagination, active toggle, name/category/size/material/price/description,
  a photo upload per model, add/remove.
- **Pengaturan** (`/admin/pengaturan`) — site-wide settings that aren't part
  of the calculator, currently just the WhatsApp number used for every
  "Chat WA" link on the public site.

Edits commit on blur (or immediately for checkboxes/radios/add/remove/photo
upload) and take effect on the public site right away — there's no separate
publish step. The session is a signed HTTP-only cookie
(`ADMIN_SESSION_SECRET`), not a database-backed login system — fine for a
single shared admin password, not meant for multiple accounts.

## API

```
GET/POST      /api/materials        GET/PUT/DELETE /api/materials/:id
GET/POST      /api/colors           GET/PUT/DELETE /api/colors/:id
GET/POST      /api/quality-options  GET/PUT/DELETE /api/quality-options/:id
GET/POST      /api/infill-options   GET/PUT/DELETE /api/infill-options/:id
GET/POST      /api/finish-options   GET/PUT/DELETE /api/finish-options/:id
GET/POST      /api/models           GET/PUT/DELETE /api/models/:id
                                     POST /api/models/:id/image           (multipart "image", admin-only)
GET/PUT       /api/settings                          (singleton row, no create/delete)

POST          /api/admin/login                       ({ password }) -> sets session cookie
POST          /api/admin/logout
GET           /api/admin/session                     -> { loggedIn }
```

GETs on the catalog resources are public (the storefront reads them without
auth). POST/PUT/DELETE on all of them, POST on `/api/models/:id/image`, and
PUT on `/api/settings`, require a valid admin session — see
`server/lib/adminAuth.ts`. Uploaded photos are written to disk under the
same directory as the SQLite file (see `dataDir` in `db/client.ts`) and
served statically from `/uploads/*`; the catalog's `ImagePlaceholder`
component falls back to a generated placeholder tile for any model without
an uploaded photo.

## Notes on fidelity to the original

- The instant price estimate parses real mesh geometry for `.stl`,
  `.glb`/`.gltf`, and `.3mf` uploads (`src/lib/stl.ts`,
  `src/lib/modelFile.ts`, `src/lib/geometryMetrics.ts`) to get an actual
  volume, bounding box, and surface area, then estimates material weight as
  an always-solid outer shell (surface area × `settings.shellThicknessMm`)
  plus an infill-scaled interior — closer to how a slicer actually prints
  than "volume × infill fraction". `.obj`/`.step`/`.stp` uploads (formats
  without a client-side parser here) fall back to the original's byte-size
  heuristic (see `fileFrom` in `src/lib/pricing.ts`); either way the
  "estimate, confirmed on WhatsApp" copy sets the right expectation.
- The 3D preview (`src/components/PartStage.tsx`) renders the real parsed
  geometry when a supported file is uploaded, normalized/centered to fill
  the same viewing volume regardless of the model's real-world scale;
  otherwise it falls back to the decorative rotating placeholder shape
  ported from the original's `part-stage.js`, now using the `three` npm
  package instead of a runtime CDN import.
