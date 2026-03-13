-- Fix active_calls table schema
-- Migration 0009 created the table with 5 columns, but 0021 used CREATE TABLE IF NOT EXISTS
-- which silently skipped if the table already existed from 0009. This migration ensures
-- all 18 columns from the current schema are present.
-- active_calls is ephemeral (only tracks in-progress calls), so DROP + CREATE is safe.
DROP TABLE IF EXISTS `active_calls`;
--> statement-breakpoint
CREATE TABLE `active_calls` (
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
