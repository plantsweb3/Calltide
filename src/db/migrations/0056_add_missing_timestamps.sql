-- Add missing createdAt timestamps to tables that lack them
-- SQLite ALTER TABLE ADD COLUMN requires constant defaults, so we use '' then backfill
ALTER TABLE system_health_logs ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE system_health_logs SET created_at = datetime('now') WHERE created_at = '';
--> statement-breakpoint
ALTER TABLE revenue_metrics ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE revenue_metrics SET created_at = datetime('now') WHERE created_at = '';
--> statement-breakpoint
ALTER TABLE processed_stripe_events ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE processed_stripe_events SET created_at = datetime('now') WHERE created_at = '';
--> statement-breakpoint
ALTER TABLE rate_limit_entries ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE rate_limit_entries SET created_at = datetime('now') WHERE created_at = '';
--> statement-breakpoint
ALTER TABLE demo_sessions ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE demo_sessions SET created_at = datetime('now') WHERE created_at = '';
