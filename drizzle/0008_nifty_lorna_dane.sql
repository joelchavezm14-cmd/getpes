CREATE TABLE `dashboard_preferences` (
	`company_id` text PRIMARY KEY NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `status` text DEFAULT 'Sin definir' NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `start_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `end_date` text DEFAULT '' NOT NULL;