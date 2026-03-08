CREATE TABLE IF NOT EXISTS `monthly_digests` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL REFERENCES `businesses`(`id`),
	`month_key` text NOT NULL,
	`month_label` text NOT NULL,
	`stats` text NOT NULL,
	`email_sent_at` text,
	`sms_sent_at` text,
	`resend_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_monthly_digests_biz_month` ON `monthly_digests` (`business_id`, `month_key`);
