CREATE TABLE `social_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`platform` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`account_name` text DEFAULT '' NOT NULL,
	`external_id` text,
	`last_synced` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_company_platform` ON `social_connections` (`company_id`,`platform`);--> statement-breakpoint
CREATE TABLE `social_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`connection_id` text NOT NULL,
	`date` text NOT NULL,
	`followers` integer,
	`views` integer,
	`reach` integer,
	FOREIGN KEY (`connection_id`) REFERENCES `social_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_daily_account_date` ON `social_daily` (`connection_id`,`date`);--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`connection_id` text NOT NULL,
	`external_id` text NOT NULL,
	`published_at` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'Post' NOT NULL,
	`views` integer,
	`reach` integer,
	`likes` integer,
	FOREIGN KEY (`connection_id`) REFERENCES `social_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_posts_external` ON `social_posts` (`connection_id`,`external_id`);