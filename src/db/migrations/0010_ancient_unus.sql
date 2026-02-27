CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`action_url` text,
	`acknowledged` integer DEFAULT false,
	`acknowledged_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outreach_log` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`source` text NOT NULL,
	`channel` text NOT NULL,
	`sent_at` text DEFAULT (datetime('now')) NOT NULL
);
