-- Contractor Daily Digest: add digest preference columns to businesses

ALTER TABLE businesses ADD COLUMN digest_preference TEXT NOT NULL DEFAULT 'sms';
-- 'sms', 'email', 'both', 'none'

ALTER TABLE businesses ADD COLUMN digest_time TEXT NOT NULL DEFAULT '18:00';
-- HH:MM in the business's local timezone

ALTER TABLE businesses ADD COLUMN last_digest_sent_at TEXT;
-- Track last digest to prevent double-sends
