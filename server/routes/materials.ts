import { materials, materialInsertSchema } from "../../db/schema.js";
import { crudRouter } from "../lib/crud.js";

export const materialsRouter = crudRouter({
  table: materials,
  idColumn: materials.id,
  insertSchema: materialInsertSchema,
});
