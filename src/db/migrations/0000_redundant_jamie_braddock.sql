CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`lead_id` text NOT NULL,
	`call_id` text,
	`service` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`duration` integer DEFAULT 60 NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`notes` text,
	`reminder_sent` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`owner_name` text NOT NULL,
	`owner_phone` text NOT NULL,
	`owner_email` text,
	`twilio_number` text NOT NULL,
	`hume_config_id` text,
	`services` text NOT NULL,
	`business_hours` text NOT NULL,
	`timezone` text DEFAULT 'America/Chicago' NOT NULL,
	`default_language` text DEFAULT 'en' NOT NULL,
	`greeting` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`lead_id` text,
	`hume_chat_id` text,
	`hume_chat_group_id` text,
	`direction` text DEFAULT 'inbound' NOT NULL,
	`caller_phone` text,
	`called_phone` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`duration` integer,
	`language` text,
	`summary` text,
	`sentiment` text,
	`transfer_requested` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaign_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`lead_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`call_id` text,
	`attempts` integer DEFAULT 0,
	`last_attempt_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `outbound_campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`phone` text NOT NULL,
	`name` text,
	`email` text,
	`language` text DEFAULT 'en' NOT NULL,
	`notes` text,
	`source` text DEFAULT 'inbound_call' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `outbound_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'reactivation' NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`total_contacts` integer DEFAULT 0,
	`contacts_reached` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sms_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`lead_id` text,
	`call_id` text,
	`direction` text DEFAULT 'outbound' NOT NULL,
	`from_number` text NOT NULL,
	`to_number` text NOT NULL,
	`body` text NOT NULL,
	`template_type` text,
	`twilio_sid` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
