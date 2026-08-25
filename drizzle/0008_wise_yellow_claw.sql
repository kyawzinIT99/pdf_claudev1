CREATE TABLE `site_home_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`announcement` text NOT NULL,
	`eyebrow` text NOT NULL,
	`title` text NOT NULL,
	`intro` text NOT NULL,
	`help_title` text NOT NULL,
	`help_intro` text NOT NULL,
	`pathways_json` text NOT NULL,
	`updated_by` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
