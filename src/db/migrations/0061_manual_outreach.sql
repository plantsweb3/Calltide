ALTER TABLE prospects ADD COLUMN outreach_status TEXT DEFAULT 'fresh';
--> statement-breakpoint
ALTER TABLE prospects ADD COLUMN next_follow_up_at TEXT;
--> statement-breakpoint
ALTER TABLE prospects ADD COLUMN last_touch_at TEXT;
--> statement-breakpoint
CREATE TABLE manual_touches (
  id TEXT PRIMARY KEY NOT NULL,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  channel TEXT NOT NULL,
  outcome TEXT NOT NULL,
  notes TEXT,
  follow_up_at TEXT,
  duration_seconds INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX idx_manual_touches_prospect_id ON manual_touches(prospect_id);
--> statement-breakpoint
CREATE INDEX idx_manual_touches_created_at ON manual_touches(created_at);
--> statement-breakpoint
CREATE INDEX idx_prospects_outreach_status ON prospects(outreach_status);
--> statement-breakpoint
CREATE INDEX idx_prospects_next_follow_up_at ON prospects(next_follow_up_at);
