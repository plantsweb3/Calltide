ALTER TABLE businesses ADD COLUMN receptionist_name TEXT DEFAULT 'Maria';
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN personality_preset TEXT DEFAULT 'friendly';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS receptionist_custom_responses (
  id TEXT PRIMARY KEY NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  category TEXT NOT NULL,
  trigger_text TEXT NOT NULL,
  response_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_rcr_business ON receptionist_custom_responses(business_id, category, active);
