CREATE TABLE `incident_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`recipient_id` text,
	`recipient_contact` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`sent_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `incident_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`status` text NOT NULL,
	`message` text NOT NULL,
	`message_es` text,
	`is_public` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`title_es` text,
	`status` text DEFAULT 'detected' NOT NULL,
	`severity` text DEFAULT 'minor' NOT NULL,
	`affected_services` text NOT NULL,
	`started_at` text DEFAULT (datetime('now')) NOT NULL,
	`resolved_at` text,
	`duration` integer,
	`clients_affected` integer DEFAULT 0,
	`estimated_calls_impacted` integer DEFAULT 0,
	`postmortem` text,
	`postmortem_es` text,
	`postmortem_published` integer DEFAULT false,
	`postmortem_scheduled_for` text,
	`created_by` text DEFAULT 'system',
	`consecutive_unhealthy_checks` integer DEFAULT 0,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `status_page_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`verification_token` text,
	`subscribed_at` text DEFAULT (datetime('now')) NOT NULL,
	`unsubscribed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `status_page_subscribers_email_unique` ON `status_page_subscribers` (`email`);
