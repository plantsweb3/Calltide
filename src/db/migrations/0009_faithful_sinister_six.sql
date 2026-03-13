CREATE TABLE `active_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`call_sid` text NOT NULL,
	`started_at` text DEFAULT (datetime('now')),
	`provider` text DEFAULT 'twilio'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `active_calls_call_sid_unique` ON `active_calls` (`call_sid`);
--> statement-breakpoint
CREATE TABLE `capacity_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`metric` text NOT NULL,
	`severity` text NOT NULL,
	`current_value` real NOT NULL,
	`limit_value` real NOT NULL,
	`pct_used` real NOT NULL,
	`message` text NOT NULL,
	`acknowledged` integer DEFAULT false,
	`acknowledged_at` text,
	`resolved_at` text,
	`incident_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `capacity_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`current_tier` text NOT NULL,
	`active_clients` integer DEFAULT 0,
	`calls_today` integer DEFAULT 0,
	`peak_concurrent` integer DEFAULT 0,
	`hume_minutes_mtd` real DEFAULT 0,
	`hume_plan_minutes` integer DEFAULT 1200,
	`hume_concurrent_peak` integer DEFAULT 0,
	`hume_concurrent_limit` integer DEFAULT 10,
	`anthropic_tokens_mtd` integer DEFAULT 0,
	`anthropic_rpm_peak` integer DEFAULT 0,
	`anthropic_spend_mtd` integer DEFAULT 0,
	`turso_row_reads_mtd` integer DEFAULT 0,
	`turso_row_writes_mtd` integer DEFAULT 0,
	`turso_storage_mb` real DEFAULT 0,
	`twilio_calls_today` integer DEFAULT 0,
	`twilio_error_count` integer DEFAULT 0,
	`twilio_success_rate` real DEFAULT 100,
	`vercel_function_invocations` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `client_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`month` text NOT NULL,
	`call_minutes` real DEFAULT 0,
	`call_count` integer DEFAULT 0,
	`sms_count` integer DEFAULT 0,
	`twilio_cost` integer DEFAULT 0,
	`hume_cost` integer DEFAULT 0,
	`anthropic_cost` integer DEFAULT 0,
	`total_cost` integer DEFAULT 0,
	`revenue` integer DEFAULT 49700,
	`margin` integer DEFAULT 0,
	`margin_pct` real DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text,
	`phone_number` text,
	`consent_type` text NOT NULL,
	`document_version` text,
	`status` text DEFAULT 'active' NOT NULL,
	`consented_at` text NOT NULL,
	`revoked_at` text,
	`revoked_method` text,
	`ip_address` text,
	`user_agent` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `data_deletion_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`requested_by` text NOT NULL,
	`request_type` text NOT NULL,
	`status` text DEFAULT 'received',
	`data_description` text,
	`verified_at` text,
	`processing_started_at` text,
	`completed_at` text,
	`deleted_records` text,
	`denial_reason` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `data_retention_log` (
	`id` text PRIMARY KEY NOT NULL,
	`data_type` text NOT NULL,
	`records_deleted` integer NOT NULL,
	`deleted_at` text NOT NULL,
	`retention_period_days` integer NOT NULL,
	`oldest_record_date` text,
	`newest_record_date` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `dunning_state` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`first_failed_at` text NOT NULL,
	`attempt_count` integer DEFAULT 1,
	`last_failure_code` text,
	`email1_sent_at` text,
	`email2_sent_at` text,
	`email3_sent_at` text,
	`sms_sent_at` text,
	`recovered_at` text,
	`canceled_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `legal_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`title_es` text,
	`content` text NOT NULL,
	`content_es` text,
	`effective_date` text NOT NULL,
	`superseded_date` text,
	`is_current_version` integer DEFAULT true,
	`change_summary` text,
	`change_summary_es` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `mrr_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`mrr` integer NOT NULL,
	`arr` integer,
	`active_clients` integer DEFAULT 0,
	`past_due_clients` integer DEFAULT 0,
	`new_clients` integer DEFAULT 0,
	`churned_clients` integer DEFAULT 0,
	`recovered_clients` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text,
	`stripe_event_id` text,
	`event_type` text NOT NULL,
	`amount` integer,
	`currency` text DEFAULT 'usd',
	`status` text NOT NULL,
	`failure_code` text,
	`failure_message` text,
	`invoice_id` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `processed_stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`processed_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `processed_stripe_events_stripe_event_id_unique` ON `processed_stripe_events` (`stripe_event_id`);
--> statement-breakpoint
CREATE TABLE `scaling_playbook` (
	`id` text PRIMARY KEY NOT NULL,
	`tier` text NOT NULL,
	`client_range` text NOT NULL,
	`provider` text NOT NULL,
	`action` text NOT NULL,
	`plan_required` text,
	`estimated_monthly_cost` text,
	`priority` text DEFAULT 'required' NOT NULL,
	`completed` integer DEFAULT false,
	`completed_at` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `sms_opt_outs` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`opted_out_at` text NOT NULL,
	`opted_out_method` text NOT NULL,
	`reopted_in_at` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sms_opt_outs_phone_number_unique` ON `sms_opt_outs` (`phone_number`);
--> statement-breakpoint
CREATE TABLE `sub_processors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`purpose` text NOT NULL,
	`data_processed` text,
	`location` text,
	`dpa_url` text,
	`dpa_status` text DEFAULT 'active',
	`last_reviewed_at` text,
	`added_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `subscription_events` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text,
	`stripe_subscription_id` text,
	`change_type` text NOT NULL,
	`previous_status` text,
	`new_status` text,
	`mrr` integer,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `businesses` ADD `tos_accepted_version` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `tos_accepted_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `privacy_accepted_version` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `privacy_accepted_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `dpa_accepted_version` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `dpa_accepted_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `data_deleted_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `data_retention_hold_until` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripe_customer_id` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripe_subscription_id` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripe_subscription_status` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `payment_status` text DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE `businesses` ADD `last_payment_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `last_payment_amount` integer;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `next_billing_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `mrr` integer DEFAULT 49700;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `lifetime_revenue` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `card_last4` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `card_exp_month` integer;
--> statement-breakpoint
ALTER TABLE `businesses` ADD `card_exp_year` integer;
