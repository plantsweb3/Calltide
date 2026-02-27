CREATE TABLE `call_qa_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`business_id` text NOT NULL,
	`score` integer NOT NULL,
	`breakdown` text,
	`flags` text,
	`fix_recommendation` text,
	`summary` text,
	`is_first_week` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `client_success_log` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_data` text,
	`email_sent_at` text,
	`email_opened_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nps_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`score` integer NOT NULL,
	`classification` text NOT NULL,
	`feedback` text,
	`follow_up_action` text,
	`escalated` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_business_id` text NOT NULL,
	`referred_business_id` text,
	`referral_code` text NOT NULL,
	`status` text DEFAULT 'pending',
	`referrer_credit_amount` integer DEFAULT 497,
	`referrer_credit_applied` integer DEFAULT false,
	`referrer_credit_applied_at` text,
	`referred_discount_applied` integer DEFAULT false,
	`signed_up_at` text,
	`activated_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`referrer_business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `businesses` ADD `referral_code` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `health_score` integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE `businesses` ADD `last_nps_score` integer;--> statement-breakpoint
ALTER TABLE `businesses` ADD `last_nps_date` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboarding_qa_grade` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboarding_qa_complete_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_referral_code_unique` ON `businesses` (`referral_code`);