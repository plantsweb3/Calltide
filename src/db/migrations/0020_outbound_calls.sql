-- Outbound calling infrastructure
CREATE TABLE IF NOT EXISTS `outbound_calls` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL,
  `customer_id` text,
  `customer_phone` text NOT NULL,
  `call_type` text NOT NULL,
  `reference_id` text,
  `status` text DEFAULT 'scheduled',
  `scheduled_for` text NOT NULL,
  `attempted_at` text,
  `completed_at` text,
  `duration` integer,
  `outcome` text,
  `transcript` text,
  `recording_url` text,
  `twilio_call_sid` text,
  `retry_count` integer DEFAULT 0,
  `max_retries` integer DEFAULT 2,
  `consent_record_id` text,
  `language` text DEFAULT 'en',
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_outbound_business` ON `outbound_calls` (`business_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_outbound_status` ON `outbound_calls` (`status`, `scheduled_for`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_outbound_customer` ON `outbound_calls` (`customer_id`);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `seasonal_services` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL,
  `service_name` text NOT NULL,
  `reminder_interval_months` integer NOT NULL,
  `reminder_message` text,
  `season_start` integer,
  `season_end` integer,
  `is_active` integer DEFAULT 1,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `idx_seasonal_business` ON `seasonal_services` (`business_id`);
--> statement-breakpoint

-- Business outbound preferences
ALTER TABLE `businesses` ADD COLUMN `outbound_enabled` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `appointment_reminders` integer DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `estimate_followups` integer DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `seasonal_reminders` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `outbound_calling_hours_start` text DEFAULT '09:00';
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `outbound_calling_hours_end` text DEFAULT '18:00';
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `outbound_max_calls_per_day` integer DEFAULT 20;
