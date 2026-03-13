-- Service Pricing Intelligence + TCPA Compliance
-- Migration 0018
-- New table: service pricing for AI quoting
CREATE TABLE IF NOT EXISTS `service_pricing` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL,
  `service_name` text NOT NULL,
  `price_min` real,
  `price_max` real,
  `unit` text DEFAULT 'per_job',
  `description` text,
  `is_active` integer DEFAULT 1,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_service_pricing_business_active` ON `service_pricing` (`business_id`, `is_active`);
--> statement-breakpoint

-- Add pricing enabled flag to businesses
ALTER TABLE `businesses` ADD COLUMN `has_pricing_enabled` integer DEFAULT 0;
--> statement-breakpoint

-- Add disclosure tracking to calls
ALTER TABLE `calls` ADD COLUMN `recording_disclosed` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `calls` ADD COLUMN `ai_disclosed` integer DEFAULT 0;
