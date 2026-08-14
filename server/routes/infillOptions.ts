import { infillOptions, infillOptionInsertSchema } from "../../db/schema.js";
import { crudRouter } from "../lib/crud.js";

export const infillOptionsRouter = crudRouter({
  table: infillOptions,
  idColumn: infillOptions.id,
  insertSchema: infillOptionInsertSchema,
});
