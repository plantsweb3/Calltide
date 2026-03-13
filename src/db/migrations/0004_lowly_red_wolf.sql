CREATE TABLE `agent_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_name` text NOT NULL,
	`action_type` text NOT NULL,
	`target_id` text,
	`target_type` text,
	`input_summary` text,
	`output_summary` text,
	`tools_called` text,
	`escalated` integer DEFAULT false,
	`resolved_without_escalation` integer DEFAULT false,
	`category` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_config` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_name` text NOT NULL,
	`enabled` integer DEFAULT true,
	`cron_expression` text,
	`system_prompt_override` text,
	`escalation_threshold` integer,
	`last_run_at` text,
	`last_error_at` text,
	`last_error_message` text,
	`config` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_config_agent_name_unique` ON `agent_config` (`agent_name`);
--> statement-breakpoint
ALTER TABLE `leads` ADD `sms_opt_out` integer DEFAULT false;
