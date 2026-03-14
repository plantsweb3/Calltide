-- Fix: add alertedAt to google_reviews to prevent re-alerting on same review
ALTER TABLE google_reviews ADD COLUMN alerted_at TEXT;

-- Fix: add thank_you_sent to appointments (was in schema but missing from migrations)
ALTER TABLE appointments ADD COLUMN thank_you_sent INTEGER DEFAULT 0;

-- Fix: drop orphan index on sms_messages.customer_id (column doesn't exist)
DROP INDEX IF EXISTS idx_sms_messages_customer_id;
