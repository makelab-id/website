// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let app: import("express").Express;
let dbFile: string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let request: any;
let createSessionToken: () => string;
let verifySessionToken: (token: string | undefined | null) => boolean;
let SESSION_COOKIE: string;

const ADMIN_PASSWORD = "correct-horse-battery-staple";

beforeAll(async () => {
  dbFile = path.join(os.tmpdir(), `makelab-test-auth-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  process.env.DATABASE_URL = dbFile;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.ADMIN_SESSION_SECRET = "test-session-secret";
  await import("../../db/client.js");
  ({ default: request } = await import("supertest"));
  const { createApiApp } = await import("../../server/app.js");
  ({ createSessionToken, verifySessionToken, SESSION_COOKIE } = await import("../../server/lib/adminAuth.js"));
  app = createApiApp();
});

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
});

describe("GET /api/admin/session", () => {
  it("reports logged out with no cookie", async () => {
    const res = await request(app).get("/api/admin/session");
    expect(res.status).toBe(200);
    expect(res.body.loggedIn).toBe(false);
  });
});

describe("POST /api/admin/login", () => {
  it("rejects the wrong password", async () => {
    const res = await request(app).post("/api/admin/login").send({ password: "nope" });
    expect(res.status).toBe(401);
  });

  it("rejects a missing password", async () => {
    const res = await request(app).post("/api/admin/login").send({});
    expect(res.status).toBe(401);
  });

  it("sets a session cookie on the correct password and the session then reads as logged in", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/admin/login").send({ password: ADMIN_PASSWORD });
    expect(login.status).toBe(200);

    const session = await agent.get("/api/admin/session");
    expect(session.body.loggedIn).toBe(true);
  });
});

describe("POST /api/admin/logout", () => {
  it("clears the session so a subsequent check reads logged out", async () => {
    const agent = request.agent(app);
    await agent.post("/api/admin/login").send({ password: ADMIN_PASSWORD });
    expect((await agent.get("/api/admin/session")).body.loggedIn).toBe(true);

    await agent.post("/api/admin/logout");
    expect((await agent.get("/api/admin/session")).body.loggedIn).toBe(false);
  });
});

describe("session token internals", () => {
  it("round-trips a freshly created token as valid", () => {
    expect(verifySessionToken(createSessionToken())).toBe(true);
  });

  it("rejects a missing or malformed token", () => {
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken(null)).toBe(false);
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("not.enough")).toBe(false);
    expect(verifySessionToken("way.too.many.parts")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken();
    const [role, expiresAt] = token.split(".");
    expect(verifySessionToken(`${role}.${expiresAt}.0000000000000000000000000000000000000000000000000000000000000000`)).toBe(
      false,
    );
  });

  it("rejects a tampered expiry", () => {
    const token = createSessionToken();
    const [role, , signature] = token.split(".");
    const farFuture = Date.now() + 1000 * 60 * 60 * 24 * 365;
    expect(verifySessionToken(`${role}.${farFuture}.${signature}`)).toBe(false);
  });

  it("rejects an expired token", () => {
    // A token signed for a timestamp already in the past should fail even
    // though the signature itself is otherwise well-formed — simulate by
    // reaching into the same signing scheme via a fresh token whose expiry
    // we roll back (still correctly signed, since we recompute the token).
    const expiresAt = Date.now() - 1000;
    const payload = `admin.${expiresAt}`;
    const sig = createHmac("sha256", process.env.ADMIN_SESSION_SECRET as string).update(payload).digest("hex");
    expect(verifySessionToken(`${payload}.${sig}`)).toBe(false);
  });

  it("cookie name matches the constant the middleware reads", () => {
    expect(SESSION_COOKIE).toBe("makelab_admin_session");
  });
});

describe("unauthenticated mutation is rejected consistently", () => {
  it("401s a POST with no session at all", async () => {
    const res = await request(app).post("/api/materials").send({ name: "x", ratePerGram: 1, density: 1 });
    expect(res.status).toBe(401);
  });
});
