ALTER TABLE `leads` ADD `services` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `billing` text DEFAULT 'Estimado' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `closed_at` text DEFAULT '' NOT NULL;