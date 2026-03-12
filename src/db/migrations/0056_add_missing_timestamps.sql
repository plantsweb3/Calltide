-- Add missing createdAt timestamps to tables that lack them
ALTER TABLE system_health_logs ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE revenue_metrics ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE processed_stripe_events ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE rate_limit_entries ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE demo_sessions ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));
