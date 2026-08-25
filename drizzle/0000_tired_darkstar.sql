CREATE TABLE `distribution_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`external_id` text,
	`error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded_by` text DEFAULT 'Community editor' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_object_key_unique` ON `media` (`object_key`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Field notes' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`channels` text DEFAULT '[]' NOT NULL,
	`author` text DEFAULT 'Community editor' NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);