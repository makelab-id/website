import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { settings, settingsUpdateSchema } from "../../db/schema.js";
import { asyncHandler } from "../lib/asyncHandler.js";

// Settings is a singleton row (seeded once by db/seed.ts) — GET/PUT only,
// no create/delete/list. PUT accepts a partial patch once the row exists,
// or a full object to bootstrap it if seeding hasn't run yet.
export const settingsRouter = Router();

async function getRow() {
  const [row] = await db.select().from(settings).limit(1);
  return row;
}

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const row = await getRow();
    if (!row) return res.status(404).json({ error: "settings not seeded yet" });
    res.json(row);
  }),
);

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const existing = await getRow();

    if (!existing) {
      const full = settingsUpdateSchema.safeParse(req.body);
      if (!full.success) {
        return res.status(400).json({
          error: "settings row does not exist yet; provide a complete settings object to initialize it",
          details: full.error.flatten(),
        });
      }
      const [row] = await db.insert(settings).values(full.data).returning();
      return res.status(201).json(row);
    }

    const patch = settingsUpdateSchema.partial().safeParse(req.body);
    if (!patch.success) {
      return res.status(400).json({ error: patch.error.flatten() });
    }
    if (Object.keys(patch.data).length === 0) {
      return res.status(400).json({ error: "request body must include at least one field" });
    }
    const [row] = await db.update(settings).set(patch.data).where(eq(settings.id, existing.id)).returning();
    res.json(row);
  }),
);
