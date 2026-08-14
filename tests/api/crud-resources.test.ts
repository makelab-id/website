// @vitest-environment node
//
// Verifies the shared REST contract (server/lib/crud.ts) against each of the
// five catalog resources, using a fresh temp SQLite file per test run so
// these tests never touch the real dev/prod database.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let app: import("express").Express;
let dbFile: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let request: any;

beforeAll(async () => {
  dbFile = path.join(os.tmpdir(), `makelab-test-crud-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  process.env.DATABASE_URL = dbFile;
  await import("../../db/client.js"); // applies migrations against the temp file on import
  ({ default: request } = await import("supertest"));
  const { createApiApp } = await import("../../server/app.js");
  app = createApiApp();
});

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
});

const RESOURCES = [
  {
    path: "/api/materials",
    valid: { name: "Nylon", ratePerGram: 5200, density: 1.15 },
    invalid: { name: "", ratePerGram: -1, density: 1.15 },
    patch: { ratePerGram: 5300 },
  },
  {
    path: "/api/colors",
    valid: { name: "Biru", hex: "#1155ff", extraPrice: 3000 },
    invalid: { name: "Bad", hex: "not-a-hex" },
    patch: { extraPrice: 4000 },
  },
  {
    path: "/api/quality-options",
    valid: { label: "0,16 mm — uji", timeMultiplier: 1.2 },
    invalid: { label: "", timeMultiplier: -1 },
    patch: { timeMultiplier: 1.3 },
  },
  {
    path: "/api/infill-options",
    valid: { label: "75% — solid", percent: 75, fillFraction: 0.9 },
    invalid: { label: "", percent: 200, fillFraction: 2 },
    patch: { percent: 80 },
  },
  {
    path: "/api/models",
    valid: {
      slot: "test-slot-1",
      category: "Test",
      name: "Test Part",
      description: "desc",
      sizeLabel: "1 x 1 x 1 mm",
      materialLabel: "PLA",
      basePrice: 1000,
      active: true,
    },
    invalid: { slot: "", category: "", name: "", description: "", sizeLabel: "", materialLabel: "", basePrice: -1 },
    patch: { basePrice: 2000 },
  },
];

describe.each(RESOURCES)("CRUD contract for $path", ({ path: resourcePath, valid, invalid, patch }) => {
  let createdId: number;

  it("returns a JSON array on GET", async () => {
    const res = await request(app).get(resourcePath);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await request(app).post(resourcePath).send(invalid);
    expect(res.status).toBe(400);
  });

  it("creates a row from a valid payload", async () => {
    const res = await request(app).post(resourcePath).send(valid);
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe("number");
    createdId = res.body.id;
  });

  it("fetches the created row by id", async () => {
    const res = await request(app).get(`${resourcePath}/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it("404s for an id that doesn't exist", async () => {
    const res = await request(app).get(`${resourcePath}/999999`);
    expect(res.status).toBe(404);
  });

  it("400s for a non-integer id", async () => {
    const res = await request(app).get(`${resourcePath}/not-a-number`);
    expect(res.status).toBe(400);
  });

  it("applies a partial patch on PUT", async () => {
    const res = await request(app).put(`${resourcePath}/${createdId}`).send(patch);
    expect(res.status).toBe(200);
    for (const [key, value] of Object.entries(patch)) {
      expect(res.body[key]).toBe(value);
    }
  });

  it("rejects an empty patch body", async () => {
    const res = await request(app).put(`${resourcePath}/${createdId}`).send({});
    expect(res.status).toBe(400);
  });

  it("deletes the row", async () => {
    const res = await request(app).delete(`${resourcePath}/${createdId}`);
    expect(res.status).toBe(204);
  });

  it("404s when fetching the deleted row", async () => {
    const res = await request(app).get(`${resourcePath}/${createdId}`);
    expect(res.status).toBe(404);
  });
});

describe("unmatched /api routes", () => {
  it("returns a JSON 404, not an HTML error page", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not found" });
  });
});
