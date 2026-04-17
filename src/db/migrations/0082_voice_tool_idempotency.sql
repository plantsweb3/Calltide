-- Durable idempotency store for ElevenLabs voice tool retries.
-- Prevents double side-effects (double SMS, duplicate emergency dispatch,
-- duplicate complaint tickets) when the webhook is delivered to multiple
-- Vercel instances concurrently or retried by the provider.
CREATE TABLE IF NOT EXISTS voice_tool_idempotency (
  key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_voice_tool_idempotency_created_at ON voice_tool_idempotency(created_at);
