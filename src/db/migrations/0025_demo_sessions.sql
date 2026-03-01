CREATE TABLE IF NOT EXISTS demo_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  ip_hash TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  duration_seconds INTEGER,
  business_type TEXT,
  business_name TEXT,
  business_size TEXT,
  pain_point TEXT,
  reached_roi INTEGER DEFAULT 0,
  reached_roleplay INTEGER DEFAULT 0,
  reached_close INTEGER DEFAULT 0,
  converted_to_signup INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  user_agent TEXT,
  estimated_monthly_loss INTEGER
);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_ip ON demo_sessions(ip_hash, started_at);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_type ON demo_sessions(business_type);
