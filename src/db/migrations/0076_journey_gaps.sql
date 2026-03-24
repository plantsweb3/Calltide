-- Migration 0076: Customer journey gap closure
-- Cancellation feedback, win-back tracking, voicemail transcription, tech unavailability

-- Exit survey / cancellation feedback
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  reason TEXT NOT NULL, -- too_expensive, not_enough_value, switching_competitor, going_manual, seasonal_business, other
  rating INTEGER, -- 1-5 satisfaction
  feedback TEXT, -- free-text
  recovery_offer_shown INTEGER DEFAULT 0,
  recovery_offer_accepted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Win-back email tracking
CREATE TABLE IF NOT EXISTS win_back_emails (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  email_number INTEGER NOT NULL, -- 1, 2, or 3
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  opened_at TEXT,
  clicked_at TEXT,
  reactivated INTEGER DEFAULT 0
);

-- Usage alert tracking (prevent duplicate alerts)
CREATE TABLE IF NOT EXISTS usage_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  alert_type TEXT NOT NULL, -- usage_drop, no_calls, card_expiring
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  metric_value TEXT, -- e.g. "calls_dropped_60_pct"
  acknowledged INTEGER DEFAULT 0
);

-- Voicemail transcript column on calls
ALTER TABLE calls ADD COLUMN voicemail_transcript TEXT;

-- Tech unavailability
ALTER TABLE technicians ADD COLUMN is_unavailable INTEGER DEFAULT 0;
ALTER TABLE technicians ADD COLUMN unavailable_reason TEXT;
ALTER TABLE technicians ADD COLUMN unavailable_until TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_business ON cancellation_feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_win_back_business ON win_back_emails(business_id, email_number);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_business_type ON usage_alerts(business_id, alert_type, sent_at);
