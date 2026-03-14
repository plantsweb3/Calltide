ALTER TABLE google_reviews ADD COLUMN alerted_at TEXT;
--> statement-breakpoint
ALTER TABLE appointments ADD COLUMN thank_you_sent INTEGER DEFAULT 0;
--> statement-breakpoint
DROP INDEX IF EXISTS idx_sms_messages_customer_id;
