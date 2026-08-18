import { finishOptions, finishOptionInsertSchema } from "../../db/schema.js";
import { crudRouter } from "../lib/crud.js";

export const finishOptionsRouter = crudRouter({
  table: finishOptions,
  idColumn: finishOptions.id,
  insertSchema: finishOptionInsertSchema,
});
