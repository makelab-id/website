CREATE TABLE `colors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`hex` text NOT NULL,
	`extra_price` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `infill_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`percent` integer NOT NULL,
	`fill_fraction` real NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rate_per_gram` integer NOT NULL,
	`density` real NOT NULL,
	`coming_soon` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slot` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`size_label` text NOT NULL,
	`material_label` text NOT NULL,
	`base_price` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quality_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`time_multiplier` real NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`whatsapp_number` text NOT NULL,
	`machine_rate_per_hour` integer NOT NULL,
	`setup_fee` integer NOT NULL,
	`express_markup_pct` real NOT NULL,
	`bulk_qty_threshold` integer NOT NULL,
	`bulk_discount_pct` real NOT NULL,
	`finish_cost_none` integer DEFAULT 0 NOT NULL,
	`finish_cost_sand` integer NOT NULL,
	`finish_cost_paint` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `colors_name_unique` ON `colors` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `infill_options_label_unique` ON `infill_options` (`label`);--> statement-breakpoint
CREATE UNIQUE INDEX `materials_name_unique` ON `materials` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `models_slot_unique` ON `models` (`slot`);--> statement-breakpoint
CREATE UNIQUE INDEX `quality_options_label_unique` ON `quality_options` (`label`);