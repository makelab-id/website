// @vitest-environment node
//
// Settings is a singleton row (no create/delete/list) — bootstrapped by a
// full PUT, then patched partially. Uses its own temp SQLite file so it
// doesn't interact with crud-resources.test.ts's database.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let app: import("express").Express;
let dbFile: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let request: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agent: any;

const ADMIN_PASSWORD = "test-admin-password";

beforeAll(async () => {
  dbFile = path.join(os.tmpdir(), `makelab-test-settings-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  process.env.DATABASE_URL = dbFile;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.ADMIN_SESSION_SECRET = "test-session-secret";
  await import("../../db/client.js");
  ({ default: request } = await import("supertest"));
  const { createApiApp } = await import("../../server/app.js");
  app = createApiApp();
  agent = request.agent(app);
  const login = await agent.post("/api/admin/login").send({ password: ADMIN_PASSWORD });
  if (login.status !== 200) throw new Error("test setup: admin login failed");
});

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
});

const FULL_SETTINGS = {
  whatsappNumber: "6281234567890",
  machineRatePerHour: 7000,
  setupFee: 10000,
  expressMarkupPct: 0.4,
  bulkQtyThreshold: 5,
  bulkDiscountPct: 0.1,
  shellThicknessMm: 1.2,
};

describe("GET /api/settings before seeding", () => {
  it("404s because no settings row exists yet", async () => {
    const res = await request(app).get("/api/settings");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/settings", () => {
  it("rejects a mutation with no admin session", async () => {
    const res = await request(app).put("/api/settings").send(FULL_SETTINGS);
    expect(res.status).toBe(401);
  });

  it("rejects a partial payload when the row doesn't exist yet", async () => {
    const res = await agent.put("/api/settings").send({ setupFee: 12000 });
    expect(res.status).toBe(400);
  });

  it("bootstraps the row from a complete payload", async () => {
    const res = await agent.put("/api/settings").send(FULL_SETTINGS);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(FULL_SETTINGS);
  });

  it("is now readable via GET", async () => {
    const res = await request(app).get("/api/settings");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(FULL_SETTINGS);
  });

  it("applies a partial patch once the row exists", async () => {
    const res = await agent.put("/api/settings").send({ setupFee: 12000 });
    expect(res.status).toBe(200);
    expect(res.body.setupFee).toBe(12000);
    // Untouched fields survive the patch.
    expect(res.body.whatsappNumber).toBe(FULL_SETTINGS.whatsappNumber);
  });

  it("rejects an empty patch body", async () => {
    const res = await agent.put("/api/settings").send({});
    expect(res.status).toBe(400);
  });

  it("rejects an invalid field value", async () => {
    const res = await agent.put("/api/settings").send({ bulkDiscountPct: 1.5 });
    expect(res.status).toBe(400);
  });
});
