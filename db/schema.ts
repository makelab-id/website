import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  // Price in Rupiah per gram of filament/resin used.
  ratePerGram: integer("rate_per_gram").notNull(),
  // Grams per cubic centimetre, used to turn printed volume into weight.
  density: real("density").notNull(),
  comingSoon: integer("coming_soon", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const colors = sqliteTable("colors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  hex: text("hex").notNull(),
  extraPrice: integer("extra_price").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const qualityOptions = sqliteTable("quality_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  // Multiplier applied to machine-time estimate; finer layers take longer.
  timeMultiplier: real("time_multiplier").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const infillOptions = sqliteTable("infill_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull().unique(),
  percent: integer("percent").notNull(),
  // Fraction of the bounding-box volume actually consumed by material.
  fillFraction: real("fill_fraction").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Stable key used by the frontend to pick a placeholder image tile.
  slot: text("slot").notNull().unique(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sizeLabel: text("size_label").notNull(),
  materialLabel: text("material_label").notNull(),
  basePrice: integer("base_price").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Singleton row (id is always 1) holding site-wide pricing knobs.
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  whatsappNumber: text("whatsapp_number").notNull(),
  machineRatePerHour: integer("machine_rate_per_hour").notNull(),
  setupFee: integer("setup_fee").notNull(),
  expressMarkupPct: real("express_markup_pct").notNull(),
  bulkQtyThreshold: integer("bulk_qty_threshold").notNull(),
  bulkDiscountPct: real("bulk_discount_pct").notNull(),
  finishCostNone: integer("finish_cost_none").notNull().default(0),
  finishCostSand: integer("finish_cost_sand").notNull(),
  finishCostPaint: integer("finish_cost_paint").notNull(),
});

// Zod schemas derived from the Drizzle table defs — single source of truth
// shared by the server's request validation and (via inferred types) the client.
export const materialInsertSchema = createInsertSchema(materials, {
  name: z.string().min(1),
  ratePerGram: z.number().int().nonnegative(),
  density: z.number().positive(),
}).omit({ id: true });
export const materialSelectSchema = createSelectSchema(materials);

export const colorInsertSchema = createInsertSchema(colors, {
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex must look like #rrggbb"),
  extraPrice: z.number().int().nonnegative(),
}).omit({ id: true });
export const colorSelectSchema = createSelectSchema(colors);

export const qualityOptionInsertSchema = createInsertSchema(qualityOptions, {
  label: z.string().min(1),
  timeMultiplier: z.number().positive(),
}).omit({ id: true });
export const qualityOptionSelectSchema = createSelectSchema(qualityOptions);

export const infillOptionInsertSchema = createInsertSchema(infillOptions, {
  label: z.string().min(1),
  percent: z.number().int().min(0).max(100),
  fillFraction: z.number().min(0).max(1),
}).omit({ id: true });
export const infillOptionSelectSchema = createSelectSchema(infillOptions);

export const modelInsertSchema = createInsertSchema(models, {
  slot: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  sizeLabel: z.string().min(1),
  materialLabel: z.string().min(1),
  basePrice: z.number().int().nonnegative(),
}).omit({ id: true });
export const modelSelectSchema = createSelectSchema(models);

export const settingsUpdateSchema = createInsertSchema(settings, {
  whatsappNumber: z.string().min(1),
  machineRatePerHour: z.number().int().nonnegative(),
  setupFee: z.number().int().nonnegative(),
  expressMarkupPct: z.number().min(0),
  bulkQtyThreshold: z.number().int().positive(),
  bulkDiscountPct: z.number().min(0).max(1),
  finishCostNone: z.number().int().nonnegative(),
  finishCostSand: z.number().int().nonnegative(),
  finishCostPaint: z.number().int().nonnegative(),
}).omit({ id: true });
export const settingsSelectSchema = createSelectSchema(settings);

export type Material = z.infer<typeof materialSelectSchema>;
export type MaterialInput = z.infer<typeof materialInsertSchema>;
export type Color = z.infer<typeof colorSelectSchema>;
export type ColorInput = z.infer<typeof colorInsertSchema>;
export type QualityOption = z.infer<typeof qualityOptionSelectSchema>;
export type QualityOptionInput = z.infer<typeof qualityOptionInsertSchema>;
export type InfillOption = z.infer<typeof infillOptionSelectSchema>;
export type InfillOptionInput = z.infer<typeof infillOptionInsertSchema>;
export type PrintModel = z.infer<typeof modelSelectSchema>;
export type PrintModelInput = z.infer<typeof modelInsertSchema>;
export type Settings = z.infer<typeof settingsSelectSchema>;
export type SettingsInput = z.infer<typeof settingsUpdateSchema>;
