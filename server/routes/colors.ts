import { colors, colorInsertSchema } from "../../db/schema.js";
import { crudRouter } from "../lib/crud.js";

export const colorsRouter = crudRouter({
  table: colors,
  idColumn: colors.id,
  insertSchema: colorInsertSchema,
});
