-- Agent Handoffs table
CREATE TABLE IF NOT EXISTS agent_handoffs (
  id TEXT PRIMARY KEY NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  reason TEXT NOT NULL,
  context TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  completed_at TEXT,
  completed_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoff_to_agent ON agent_handoffs(to_agent, status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoff_business ON agent_handoffs(business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoff_expires ON agent_handoffs(expires_at);
--> statement-breakpoint

-- Disaster recovery columns on businesses
ALTER TABLE businesses ADD COLUMN voicemail_fallback_active INTEGER DEFAULT 0;
--> statement-breakpoint

-- Enhanced incident columns
ALTER TABLE incidents ADD COLUMN auto_mitigation_applied TEXT;
--> statement-breakpoint
ALTER TABLE incidents ADD COLUMN acknowledged_at TEXT;
--> statement-breakpoint
ALTER TABLE incidents ADD COLUMN acknowledged_by TEXT;
