import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.js";

const dbPath = process.env.DATABASE_URL || "./data/makelab.sqlite";
const resolvedPath = dbPath === ":memory:" ? dbPath : path.resolve(process.cwd(), dbPath);

if (resolvedPath !== ":memory:") {
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
}

const sqlite = new Database(resolvedPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

const migrationsFolder = path.resolve(process.cwd(), "db/migrations");

export function runMigrations() {
  if (!fs.existsSync(migrationsFolder)) return;
  migrate(db, { migrationsFolder });
}

// Applied eagerly on import so every server boot (and every test that
// imports this module) starts from an up-to-date schema.
runMigrations();
