-- Live call monitoring infrastructure

CREATE TABLE IF NOT EXISTS `active_calls` (
  `id` text PRIMARY KEY NOT NULL,
  `business_id` text NOT NULL,
  `business_name` text NOT NULL,
  `caller_phone` text NOT NULL,
  `customer_name` text,
  `is_returning_caller` integer DEFAULT 0,
  `direction` text DEFAULT 'inbound',
  `call_type` text,
  `language` text DEFAULT 'en',
  `twilio_call_sid` text,
  `hume_session_id` text,
  `started_at` text DEFAULT (datetime('now')) NOT NULL,
  `last_activity_at` text DEFAULT (datetime('now')) NOT NULL,
  `status` text DEFAULT 'ringing',
  `current_intent` text,
  `duration_seconds` integer DEFAULT 0,
  `metadata` text,
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`)
);

CREATE INDEX IF NOT EXISTS `idx_active_calls_status` ON `active_calls` (`status`);
CREATE INDEX IF NOT EXISTS `idx_active_calls_business` ON `active_calls` (`business_id`);

CREATE TABLE IF NOT EXISTS `call_peaks` (
  `id` text PRIMARY KEY NOT NULL,
  `date` text NOT NULL,
  `peak_concurrent` integer DEFAULT 0,
  `peak_time` text,
  `total_calls` integer DEFAULT 0,
  `avg_duration` integer DEFAULT 0,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_call_peaks_date` ON `call_peaks` (`date`);
