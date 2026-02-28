-- CRM: Customers table
CREATE TABLE IF NOT EXISTS `customers` (
  `id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `phone` text NOT NULL,
  `name` text,
  `email` text,
  `address` text,
  `language` text DEFAULT 'en',
  `tags` text DEFAULT '[]',
  `notes` text,
  `source` text DEFAULT 'inbound_call',
  `total_calls` integer DEFAULT 0,
  `total_appointments` integer DEFAULT 0,
  `total_estimates` integer DEFAULT 0,
  `last_call_at` text,
  `first_call_at` text,
  `is_repeat` integer DEFAULT 0,
  `deleted_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS `customers_business_phone_idx` ON `customers` (`business_id`, `phone`);
CREATE INDEX IF NOT EXISTS `customers_business_idx` ON `customers` (`business_id`);
CREATE INDEX IF NOT EXISTS `customers_business_last_call_idx` ON `customers` (`business_id`, `last_call_at`);

-- CRM: Estimates table
CREATE TABLE IF NOT EXISTS `estimates` (
  `id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `customer_id` text NOT NULL REFERENCES `customers`(`id`),
  `call_id` text REFERENCES `calls`(`id`),
  `service` text,
  `description` text,
  `status` text NOT NULL DEFAULT 'new',
  `amount` real,
  `follow_up_count` integer DEFAULT 0,
  `last_follow_up_at` text,
  `next_follow_up_at` text,
  `won_at` text,
  `lost_at` text,
  `lost_reason` text,
  `notes` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `estimates_business_status_idx` ON `estimates` (`business_id`, `status`);
CREATE INDEX IF NOT EXISTS `estimates_next_followup_idx` ON `estimates` (`next_follow_up_at`);

-- Add new columns to calls
ALTER TABLE `calls` ADD COLUMN `outcome` text;
ALTER TABLE `calls` ADD COLUMN `audio_url` text;
ALTER TABLE `calls` ADD COLUMN `customer_id` text REFERENCES `customers`(`id`);

-- Add new columns to businesses
ALTER TABLE `businesses` ADD COLUMN `personality_notes` text;
ALTER TABLE `businesses` ADD COLUMN `audio_retention_days` integer DEFAULT 90;
