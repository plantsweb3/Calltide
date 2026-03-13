CREATE TABLE `google_calendar_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`google_email` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`token_expires_at` text NOT NULL,
	`calendar_id` text DEFAULT 'primary' NOT NULL,
	`connected_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_sync_at` text,
	`sync_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `google_calendar_connections_business_id_unique` ON `google_calendar_connections` (`business_id`);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `google_calendar_event_id` text;
