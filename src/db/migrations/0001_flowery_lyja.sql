CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`title` text NOT NULL,
	`detail` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `demos` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`scheduled_at` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`outcome` text,
	`notes` text,
	`revenue` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prospect_audit_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`twilio_call_sid` text,
	`from_number` text NOT NULL,
	`to_number` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`duration` integer,
	`answered_by` text,
	`ring_time` integer,
	`scheduled_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prospect_outreach` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`channel` text NOT NULL,
	`template_key` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`external_id` text,
	`sent_at` text DEFAULT (datetime('now')) NOT NULL,
	`opened_at` text,
	`clicked_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text,
	`business_name` text NOT NULL,
	`phone` text,
	`email` text,
	`website` text,
	`address` text,
	`city` text,
	`state` text,
	`vertical` text,
	`rating` real,
	`review_count` integer,
	`language` text DEFAULT 'en',
	`size` text DEFAULT 'small',
	`lead_score` integer DEFAULT 0,
	`status` text DEFAULT 'new' NOT NULL,
	`audit_result` text,
	`tags` text DEFAULT '[]',
	`notes` text,
	`source` text DEFAULT 'google_places' NOT NULL,
	`sms_opt_out` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prospects_place_id_unique` ON `prospects` (`place_id`);