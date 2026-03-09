-- Owner Response Loop: tracks owner replies to job card SMS + customer notifications

CREATE TABLE IF NOT EXISTS owner_responses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  job_card_id TEXT NOT NULL REFERENCES job_cards(id),
  direction TEXT NOT NULL DEFAULT 'inbound', -- inbound (owner reply) | outbound (system SMS to owner)
  message_type TEXT NOT NULL, -- job_card_notify | confirm_reply | adjust_reply | site_visit_reply | reminder | expiry
  message_text TEXT,
  raw_reply TEXT, -- exact text the owner sent
  parsed_action TEXT, -- confirm | adjust | site_visit | unknown
  parsed_amount REAL, -- if owner adjusted price
  twilio_sid TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_owner_responses_job_card ON owner_responses(job_card_id);
CREATE INDEX idx_owner_responses_business ON owner_responses(business_id);

CREATE TABLE IF NOT EXISTS customer_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  job_card_id TEXT NOT NULL REFERENCES job_cards(id),
  lead_id TEXT REFERENCES leads(id),
  notification_type TEXT NOT NULL, -- estimate_confirmed | estimate_adjusted | site_visit_scheduled
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  twilio_sid TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customer_notifications_job_card ON customer_notifications(job_card_id);
CREATE INDEX idx_customer_notifications_lead ON customer_notifications(lead_id);

-- Add expiration tracking to job_cards
ALTER TABLE job_cards ADD COLUMN reminder_sent_at TEXT;
ALTER TABLE job_cards ADD COLUMN expired_at TEXT;
