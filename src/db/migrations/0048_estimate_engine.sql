-- Migration 0048: Dual-Mode Estimate Engine
-- Adds pricing_ranges for structured estimates and job_cards for owner review

-- Add estimate_mode to businesses
ALTER TABLE businesses ADD COLUMN estimate_mode TEXT DEFAULT 'quick';

-- Pricing ranges: supports both quick (flat min/max) and advanced (formula) modes
CREATE TABLE IF NOT EXISTS pricing_ranges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  mode TEXT DEFAULT 'quick',
  job_type_key TEXT NOT NULL,
  job_type_label TEXT NOT NULL,
  job_type_label_es TEXT,
  trade_type TEXT NOT NULL,
  scope_level TEXT DEFAULT 'residential',
  min_price REAL,
  max_price REAL,
  unit TEXT DEFAULT 'per_job',
  formula_json TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, job_type_key)
);

-- Job cards: structured estimate summaries for owner review
CREATE TABLE IF NOT EXISTS job_cards (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  call_id TEXT REFERENCES calls(id),
  lead_id TEXT REFERENCES leads(id),
  job_intake_id TEXT,
  caller_name TEXT,
  caller_phone TEXT,
  caller_email TEXT,
  job_type_key TEXT,
  job_type_label TEXT,
  scope_level TEXT,
  scope_description TEXT,
  estimate_mode TEXT,
  estimate_min REAL,
  estimate_max REAL,
  estimate_unit TEXT,
  estimate_calculation_json TEXT,
  estimate_confidence TEXT,
  status TEXT DEFAULT 'pending_review',
  owner_response TEXT,
  owner_adjusted_min REAL,
  owner_adjusted_max REAL,
  owner_responded_at TEXT,
  customer_notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pricing_ranges_business ON pricing_ranges(business_id);
CREATE INDEX IF NOT EXISTS idx_pricing_ranges_trade ON pricing_ranges(business_id, trade_type);
CREATE INDEX IF NOT EXISTS idx_job_cards_business ON job_cards(business_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_call ON job_cards(call_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(business_id, status);
