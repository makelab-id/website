import express, { type NextFunction, type Request, type Response } from "express";
import { materialsRouter } from "./routes/materials.js";
import { colorsRouter } from "./routes/colors.js";
import { qualityOptionsRouter } from "./routes/qualityOptions.js";
import { infillOptionsRouter } from "./routes/infillOptions.js";
import { modelsRouter } from "./routes/models.js";
import { settingsRouter } from "./routes/settings.js";

/**
 * The API-only Express app, with no static file serving or Vite wiring.
 * server/index.ts wraps this for the real monolith; tests import it
 * directly (via supertest) against a temp SQLite database.
 */
export function createApiApp() {
  const app = express();
  app.use(express.json());

  app.use("/api/materials", materialsRouter);
  app.use("/api/colors", colorsRouter);
  app.use("/api/quality-options", qualityOptionsRouter);
  app.use("/api/infill-options", infillOptionsRouter);
  app.use("/api/models", modelsRouter);
  app.use("/api/settings", settingsRouter);

  app.use("/api", (_req, res) => res.status(404).json({ error: "not found" }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
