CREATE TABLE `site_pages` (
	`key` text PRIMARY KEY NOT NULL,
	`eyebrow` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`statement` text NOT NULL,
	`updated_by` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
