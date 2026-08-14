import { Router } from "express";
import type { z } from "zod";
import { eq, type SQL } from "drizzle-orm";
import { db } from "../../db/client.js";
import { asyncHandler } from "./asyncHandler.js";
import { requireAdmin } from "./adminAuth.js";

/**
 * Generic REST CRUD router for a single Drizzle table. Used for the five
 * catalog/config resources (materials, colors, quality/infill options,
 * models) so each route file is just "wire the table + its zod schema" —
 * settings.ts stays hand-written since it's a singleton, not a collection.
 */
export function crudRouter(opts: {
  table: any;
  idColumn: SQL | any;
  insertSchema: z.ZodObject<any>;
}) {
  const router = Router();
  const { table, idColumn, insertSchema } = opts;
  const updateSchema = insertSchema.partial();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const rows = await db.select().from(table);
      res.json(rows);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "id must be an integer" });
      }
      const [row] = await db.select().from(table).where(eq(idColumn, id));
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(row);
    }),
  );

  router.post(
    "/",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const parsed = insertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const [row] = (await db.insert(table).values(parsed.data).returning()) as any[];
      res.status(201).json(row);
    }),
  );

  router.put(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "id must be an integer" });
      }
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      if (Object.keys(parsed.data).length === 0) {
        return res.status(400).json({ error: "request body must include at least one field" });
      }
      const [row] = (await db.update(table).set(parsed.data).where(eq(idColumn, id)).returning()) as any[];
      if (!row) return res.status(404).json({ error: "not found" });
      res.json(row);
    }),
  );

  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "id must be an integer" });
      }
      const [row] = (await db.delete(table).where(eq(idColumn, id)).returning()) as any[];
      if (!row) return res.status(404).json({ error: "not found" });
      res.status(204).end();
    }),
  );

  return router;
}
