// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let app: import("express").Express;
let dbFile: string;
let uploadsDir: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let request: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agent: any;

const ADMIN_PASSWORD = "test-admin-password";
// A 1x1 transparent PNG, small enough to inline as a fixture.
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

let modelId: number;

beforeAll(async () => {
  dbFile = path.join(os.tmpdir(), `makelab-test-models-image-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  process.env.DATABASE_URL = dbFile;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.ADMIN_SESSION_SECRET = "test-session-secret";
  const { dataDir } = await import("../../db/client.js");
  uploadsDir = path.join(dataDir, "uploads");
  ({ default: request } = await import("supertest"));
  const { createApiApp } = await import("../../server/app.js");
  app = createApiApp();
  agent = request.agent(app);
  const login = await agent.post("/api/admin/login").send({ password: ADMIN_PASSWORD });
  if (login.status !== 200) throw new Error("test setup: admin login failed");

  const created = await agent.post("/api/models").send({
    slot: "test-image-slot",
    category: "Test",
    name: "Image Test Part",
    description: "desc",
    sizeLabel: "1 x 1 x 1 mm",
    materialLabel: "PLA",
    basePrice: 1000,
    active: true,
  });
  modelId = created.body.id;
});

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
  fs.rmSync(uploadsDir, { recursive: true, force: true });
});

describe("POST /api/models/:id/image", () => {
  it("rejects an upload with no admin session", async () => {
    const res = await request(app)
      .post(`/api/models/${modelId}/image`)
      .attach("image", PNG_BYTES, "photo.png");
    expect(res.status).toBe(401);
  });

  it("400s when no file is attached", async () => {
    const res = await agent.post(`/api/models/${modelId}/image`);
    expect(res.status).toBe(400);
  });

  it("400s for a non-image file", async () => {
    const res = await agent
      .post(`/api/models/${modelId}/image`)
      .attach("image", Buffer.from("not an image"), "notes.txt");
    expect(res.status).toBe(400);
  });

  it("404s for an id that doesn't exist", async () => {
    const res = await agent.post("/api/models/999999/image").attach("image", PNG_BYTES, "photo.png");
    expect(res.status).toBe(404);
  });

  it("uploads a photo, sets imageUrl, and serves the file statically", async () => {
    const res = await agent.post(`/api/models/${modelId}/image`).attach("image", PNG_BYTES, "photo.png");
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/.+\.png$/);

    const served = await request(app).get(res.body.imageUrl);
    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/^image\/png/);

    const fetched = await request(app).get(`/api/models/${modelId}`);
    expect(fetched.body.imageUrl).toBe(res.body.imageUrl);
  });

  it("replaces the previous photo and removes the old file", async () => {
    const first = await agent.post(`/api/models/${modelId}/image`).attach("image", PNG_BYTES, "first.png");
    const firstPath = path.join(uploadsDir, path.basename(first.body.imageUrl));
    expect(fs.existsSync(firstPath)).toBe(true);

    const second = await agent.post(`/api/models/${modelId}/image`).attach("image", PNG_BYTES, "second.png");
    expect(second.status).toBe(200);
    expect(second.body.imageUrl).not.toBe(first.body.imageUrl);
    expect(fs.existsSync(firstPath)).toBe(false);
  });
});
