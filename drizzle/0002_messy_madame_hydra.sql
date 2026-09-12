CREATE TABLE `lead_events` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`type` text NOT NULL,
	`detail` text NOT NULL,
	`actor` text NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lead_events_lead_date` ON `lead_events` (`lead_id`,`occurred_at`);--> statement-breakpoint
ALTER TABLE `leads` ADD `campaign_id` text REFERENCES campaigns(id) ON DELETE SET NULL;
