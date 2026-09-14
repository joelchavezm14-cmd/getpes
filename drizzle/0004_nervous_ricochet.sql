CREATE TABLE `campaign_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`month` text NOT NULL,
	`leads` integer,
	`revenue` real,
	`meetings` integer,
	`sales` integer,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_metrics_company_month` ON `campaign_metrics` (`company_id`,`month`);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `audience` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `daily_budget` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `frequency` real DEFAULT 0 NOT NULL;