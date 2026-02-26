CREATE TABLE `churn_risk_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`factors` text DEFAULT '[]',
	`calculated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`note_text` text NOT NULL,
	`created_by` text DEFAULT 'admin' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text,
	`customer_id` text NOT NULL,
	`reason` text NOT NULL,
	`resolution_status` text DEFAULT 'open' NOT NULL,
	`assigned_to` text,
	`notes` text,
	`resolved_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `revenue_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`mrr` real DEFAULT 0 NOT NULL,
	`arr` real DEFAULT 0 NOT NULL,
	`customer_count` integer DEFAULT 0 NOT NULL,
	`new_customers` integer DEFAULT 0,
	`churned_customers` integer DEFAULT 0,
	`failed_payments` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `system_health_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`service_name` text NOT NULL,
	`status` text DEFAULT 'operational' NOT NULL,
	`latency_ms` integer,
	`error_count` integer DEFAULT 0,
	`uptime_pct` real DEFAULT 100,
	`checked_at` text DEFAULT (datetime('now')) NOT NULL
);
