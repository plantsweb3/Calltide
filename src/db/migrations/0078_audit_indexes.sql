-- Add missing indexes identified in system audit
-- calls.is_after_hours — queried on every dashboard overview load
CREATE INDEX IF NOT EXISTS idx_calls_after_hours ON calls(business_id, is_after_hours);

-- calls.language — queried in overview for Spanish call counts
CREATE INDEX IF NOT EXISTS idx_calls_language ON calls(business_id, language);

-- monthlyDigests composite — queried by business_id + month_key in monthly-roi cron
CREATE INDEX IF NOT EXISTS idx_monthly_digests_biz_month ON monthly_digests(business_id, month_key);

-- customers.deleted_at — nearly every customer query filters isNull(deleted_at)
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(business_id, deleted_at);

-- win_back_emails — add created_at column (was missing entirely)
ALTER TABLE win_back_emails ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));
