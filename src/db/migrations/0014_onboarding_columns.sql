ALTER TABLE businesses ADD COLUMN onboarding_step INTEGER DEFAULT 1;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN onboarding_completed_at TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN onboarding_skipped_steps TEXT DEFAULT '[]';
