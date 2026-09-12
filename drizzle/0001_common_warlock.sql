CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'Otro' NOT NULL,
	`stage` text DEFAULT 'Nuevos' NOT NULL,
	`value` real DEFAULT 0 NOT NULL,
	`follow_up` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `leads_company_stage` ON `leads` (`company_id`,`stage`);