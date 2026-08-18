import path from "node:path";
import fs from "node:fs";
import { dataDir } from "../../db/client.js";

export const uploadsDir = path.join(dataDir, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
