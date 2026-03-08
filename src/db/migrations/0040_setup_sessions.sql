CREATE TABLE `setup_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `token` text NOT NULL,
  `business_name` text,
  `business_type` text,
  `city` text,
  `state` text,
  `services` text,
  `owner_name` text,
  `owner_email` text,
  `owner_phone` text,
  `receptionist_name` text,
  `personality_preset` text,
  `faq_answers` text,
  `off_limits` text,
  `selected_plan` text,
  `current_step` integer NOT NULL DEFAULT 1,
  `max_step_reached` integer NOT NULL DEFAULT 1,
  `status` text NOT NULL DEFAULT 'active',
  `prospect_id` text,
  `business_id` text,
  `utm_source` text,
  `utm_medium` text,
  `utm_campaign` text,
  `ref_code` text,
  `language` text NOT NULL DEFAULT 'en',
  `last_active_at` text NOT NULL DEFAULT (datetime('now')),
  `converted_at` text,
  `abandoned_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `setup_sessions_token_unique` ON `setup_sessions` (`token`);
--> statement-breakpoint
CREATE INDEX `setup_sessions_status_idx` ON `setup_sessions` (`status`);
--> statement-breakpoint
CREATE INDEX `setup_sessions_owner_email_idx` ON `setup_sessions` (`owner_email`);
--> statement-breakpoint
CREATE TABLE `setup_retarget_emails` (
  `id` text PRIMARY KEY NOT NULL,
  `setup_session_id` text NOT NULL REFERENCES `setup_sessions`(`id`),
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
--> statement-breakpoint
CREATE INDEX `setup_retarget_emails_session_idx` ON `setup_retarget_emails` (`setup_session_id`);
