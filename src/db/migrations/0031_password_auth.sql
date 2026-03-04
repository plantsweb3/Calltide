ALTER TABLE `accounts` ADD `password_hash` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `password_reset_token` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `password_reset_expiry` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `password_changed_at` text;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `failed_login_attempts` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `accounts` ADD `locked_until` text;
