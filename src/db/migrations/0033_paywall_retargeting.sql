-- Paywall retargeting email tracking
CREATE TABLE IF NOT EXISTS `paywall_emails` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `email_number` integer NOT NULL,
  `template_key` text NOT NULL,
  `status` text NOT NULL DEFAULT 'sent',
  `resend_id` text,
  `language` text NOT NULL DEFAULT 'en',
  `sent_at` text NOT NULL DEFAULT (datetime('now')),
  `opened_at` text,
  `clicked_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

-- Unsubscribe flag for paywall emails
ALTER TABLE `businesses` ADD COLUMN `paywall_unsubscribed` integer DEFAULT false;
