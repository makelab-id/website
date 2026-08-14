import { Router } from "express";
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionToken, verifySessionToken } from "../lib/adminAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminAuthRouter = Router();

adminAuthRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return res.status(500).json({ error: "ADMIN_PASSWORD is not configured on the server" });
    }
    const { password } = req.body ?? {};
    if (typeof password !== "string" || password !== expected) {
      return res.status(401).json({ error: "Kata sandi salah. Coba lagi." });
    }
    res.cookie(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS,
    });
    res.json({ ok: true });
  }),
);

adminAuthRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  }),
);

adminAuthRouter.get(
  "/session",
  asyncHandler(async (req, res) => {
    const token = (req as typeof req & { cookies?: Record<string, string> }).cookies?.[SESSION_COOKIE];
    res.json({ loggedIn: verifySessionToken(token) });
  }),
);
