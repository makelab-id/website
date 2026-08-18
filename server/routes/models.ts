import path from "node:path";
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import multer from "multer";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import { models, modelInsertSchema } from "../../db/schema.js";
import { db } from "../../db/client.js";
import { crudRouter } from "../lib/crud.js";
import { requireAdmin } from "../lib/adminAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { uploadsDir } from "../lib/uploads.js";

const ALLOWED_MIME = /^image\/(png|jpe?g|webp|gif)$/;

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.test(file.mimetype)) {
      return cb(new Error("File harus berupa gambar (png/jpg/webp/gif)"));
    }
    cb(null, true);
  },
});

// multer's own errors (bad mime type, file too large) arrive via this
// callback rather than a thrown exception, so they're normalized into the
// same 400 shape as the rest of the API instead of falling through to the
// generic 500 handler.
const uploadImage: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (err) return res.status(400).json({ error: err instanceof Error ? err.message : "upload gagal" });
    next();
  });
};

export const modelsRouter = crudRouter({
  table: models,
  idColumn: models.id,
  insertSchema: modelInsertSchema,
});

modelsRouter.post(
  "/:id/image",
  requireAdmin,
  uploadImage,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const file = req.file;
    if (!Number.isInteger(id)) {
      if (file) await fsp.rm(file.path, { force: true });
      return res.status(400).json({ error: "id must be an integer" });
    }
    if (!file) {
      return res.status(400).json({ error: "field 'image' wajib diunggah" });
    }

    const [existing] = await db.select().from(models).where(eq(models.id, id));
    if (!existing) {
      await fsp.rm(file.path, { force: true });
      return res.status(404).json({ error: "not found" });
    }

    if (existing.imageUrl) {
      await fsp.rm(path.join(uploadsDir, path.basename(existing.imageUrl)), { force: true });
    }

    const imageUrl = `/uploads/${file.filename}`;
    const [row] = await db.update(models).set({ imageUrl }).where(eq(models.id, id)).returning();
    res.json(row);
  }),
);
