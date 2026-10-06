CREATE TABLE `access_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`requester` text NOT NULL,
	`type` text NOT NULL,
	`detail` text NOT NULL,
	`status` text DEFAULT 'Pendiente' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requester`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_companies_unique` ON `user_companies` (`user_id`,`company_id`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `approval` text DEFAULT 'Pendiente' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `approved_by` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `display_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `permissions` text DEFAULT '[]' NOT NULL;