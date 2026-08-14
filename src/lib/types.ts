// Re-exported type-only from the Drizzle/zod schema so the client and the
// server share one definition of each shape. `import type` is fully erased
// by the bundler, so none of db/schema.ts's runtime (drizzle-orm,
// better-sqlite3) ends up in the client bundle.
export type {
  Material,
  MaterialInput,
  Color,
  ColorInput,
  QualityOption,
  QualityOptionInput,
  InfillOption,
  InfillOptionInput,
  PrintModel,
  PrintModelInput,
  Settings,
  SettingsInput,
} from "@db/schema";
