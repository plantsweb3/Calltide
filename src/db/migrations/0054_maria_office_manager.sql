CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'dashboard',
  tool_calls TEXT DEFAULT NULL,
  tool_results TEXT DEFAULT NULL,
  token_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE business_context_notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  category TEXT NOT NULL DEFAULT 'context',
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'auto',
  expires_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE conversation_summaries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  channel TEXT NOT NULL DEFAULT 'dashboard',
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  oldest_message_at TEXT NOT NULL,
  newest_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE weather_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  location_key TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  data TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_chat_messages_business_created ON chat_messages(business_id, created_at);

CREATE INDEX idx_chat_messages_channel ON chat_messages(business_id, channel, created_at);

CREATE INDEX idx_context_notes_business ON business_context_notes(business_id, category);

CREATE INDEX idx_conv_summaries_business ON conversation_summaries(business_id, channel);

CREATE INDEX idx_weather_cache_location ON weather_cache(location_key);

CREATE INDEX idx_weather_cache_expires ON weather_cache(expires_at);
