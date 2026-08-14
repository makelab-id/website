import { models, modelInsertSchema } from "../../db/schema.js";
import { crudRouter } from "../lib/crud.js";

export const modelsRouter = crudRouter({
  table: models,
  idColumn: models.id,
  insertSchema: modelInsertSchema,
});
