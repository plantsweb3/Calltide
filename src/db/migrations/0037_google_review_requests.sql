-- Add Google review URL and toggle to businesses
ALTER TABLE businesses ADD COLUMN google_review_url TEXT;
ALTER TABLE businesses ADD COLUMN enable_review_requests INTEGER DEFAULT 1;

-- Review requests tracking table
CREATE TABLE IF NOT EXISTS review_requests (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  lead_id TEXT NOT NULL REFERENCES leads(id),
  customer_phone TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'sent',
  twilio_sid TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for review request lookups
CREATE INDEX IF NOT EXISTS idx_review_requests_business ON review_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_lead ON review_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_phone_biz ON review_requests(customer_phone, business_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at ON review_requests(sent_at);
