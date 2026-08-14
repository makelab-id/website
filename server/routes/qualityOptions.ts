import { qualityOptions, qualityOptionInsertSchema } from "../../db/schema.js";
import { crudRouter } from "../lib/crud.js";

export const qualityOptionsRouter = crudRouter({
  table: qualityOptions,
  idColumn: qualityOptions.id,
  insertSchema: qualityOptionInsertSchema,
});
