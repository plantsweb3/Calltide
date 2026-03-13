-- Missed call recovery columns on calls table
ALTER TABLE calls ADD COLUMN is_abandoned INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE calls ADD COLUMN recovery_sms_sent_at TEXT;
--> statement-breakpoint
ALTER TABLE calls ADD COLUMN recovery_status TEXT;
--> statement-breakpoint

-- Business setting for missed call recovery
ALTER TABLE businesses ADD COLUMN enable_missed_call_recovery INTEGER DEFAULT 1;
--> statement-breakpoint

-- Index for finding abandoned calls pending recovery
CREATE INDEX IF NOT EXISTS idx_calls_abandoned ON calls(is_abandoned, recovery_status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_calls_caller_created ON calls(caller_phone, created_at);
