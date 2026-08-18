CREATE TABLE `finish_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finish_options_label_unique` ON `finish_options` (`label`);--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `finish_cost_none`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `finish_cost_sand`;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `finish_cost_paint`;