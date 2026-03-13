CREATE TABLE IF NOT EXISTS `knowledge_gaps` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`call_id` text,
	`question` text NOT NULL,
	`ai_response` text,
	`owner_response` text,
	`status` text NOT NULL DEFAULT 'pending',
	`custom_response_id` text,
	`asked_at` text,
	`answered_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
