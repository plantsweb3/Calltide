-- Migration 0077: Onboarding activation — timezone on setup sessions
-- Stores browser-detected timezone during setup for sync to business on creation

ALTER TABLE setup_sessions ADD COLUMN timezone TEXT DEFAULT 'America/Chicago';
