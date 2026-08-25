CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`snapshot` text NOT NULL,
	`changed_by` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `public_inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text DEFAULT 'contact' NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `security_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_started_at` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`blocked_until` text
);
--> statement-breakpoint
ALTER TABLE `media` ADD `alt_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `scheduled_at` text;--> statement-breakpoint
ALTER TABLE `staff_users` ADD `must_change_password` integer DEFAULT false NOT NULL;