import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiApp } from "./app.js";
// Importing the client applies pending migrations before the server
// starts accepting requests.
import "../db/client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 4000;

async function main() {
  const app = createApiApp();

  if (isProd) {
    // dist/server/index.js (this bundle) sits next to dist/client (the
    // Vite build output) — see build:server / build:client in package.json.
    const clientDir = path.resolve(__dirname, "../client");
    app.use(express.static(clientDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  } else {
    // Single-process dev mode: Vite runs as Express middleware so the API
    // and the client dev server (with HMR) share one origin and one port —
    // no proxy config, no second process.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  }

  app.listen(port, () => {
    console.log(`Makelab server listening on http://localhost:${port}`);
  });
}

main();
