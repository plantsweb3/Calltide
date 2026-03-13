-- Weekly digests table
CREATE TABLE IF NOT EXISTS `weekly_digests` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `week_start_date` text NOT NULL,
  `week_end_date` text NOT NULL,
  `stats` text NOT NULL,
  `email_sent_at` text,
  `sms_sent_at` text,
  `resend_id` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

-- Digest preferences on businesses
ALTER TABLE `businesses` ADD COLUMN `enable_weekly_digest` integer DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `digest_delivery_method` text DEFAULT 'both';
--> statement-breakpoint

-- Indexes for weekly digests
CREATE INDEX IF NOT EXISTS `idx_weekly_digests_business_id` ON `weekly_digests` (`business_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_weekly_digests_week_start` ON `weekly_digests` (`business_id`, `week_start_date`);
