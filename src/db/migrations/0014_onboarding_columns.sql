ALTER TABLE businesses ADD COLUMN onboarding_step INTEGER DEFAULT 1;
ALTER TABLE businesses ADD COLUMN onboarding_completed_at TEXT;
ALTER TABLE businesses ADD COLUMN onboarding_skipped_steps TEXT DEFAULT '[]';
