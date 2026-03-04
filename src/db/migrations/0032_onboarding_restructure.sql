ALTER TABLE `businesses` ADD `onboarding_status` text DEFAULT 'not_started';
--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboarding_started_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboarding_paywall_reached_at` text;
