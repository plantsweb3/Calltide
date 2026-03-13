-- Trade Intake Engine: structured qualifying questions per trade
-- Migration: 0046_trade_intake_engine
CREATE TABLE IF NOT EXISTS trade_intake_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  trade_type TEXT NOT NULL,
  scope_level TEXT NOT NULL DEFAULT 'residential',
  question_order INTEGER NOT NULL,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_text_es TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options_json TEXT,
  required INTEGER NOT NULL DEFAULT 1,
  help_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(trade_type, scope_level, question_order)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS job_intakes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  call_id TEXT REFERENCES calls(id),
  lead_id TEXT REFERENCES leads(id),
  trade_type TEXT NOT NULL,
  scope_level TEXT NOT NULL DEFAULT 'residential',
  answers_json TEXT NOT NULL,
  scope_description TEXT,
  urgency TEXT DEFAULT 'normal',
  intake_complete INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS custom_intake_questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  question_order INTEGER NOT NULL,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_text_es TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options_json TEXT,
  required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, question_key)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_trade_intake_templates_trade ON trade_intake_templates(trade_type, scope_level);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_intakes_business ON job_intakes(business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_intakes_call ON job_intakes(call_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_intakes_lead ON job_intakes(lead_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_custom_intake_questions_business ON custom_intake_questions(business_id);
