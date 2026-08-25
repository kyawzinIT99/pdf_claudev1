ALTER TABLE `public_inquiries` ADD `source` text DEFAULT 'get-involved' NOT NULL;--> statement-breakpoint
ALTER TABLE `public_inquiries` ADD `follow_up_required` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `public_inquiries` ADD `assigned_to` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `public_inquiries` ADD `follow_up_by` text;