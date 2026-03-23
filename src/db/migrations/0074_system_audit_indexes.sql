-- Migration 0074: System audit — additional performance indexes
CREATE INDEX IF NOT EXISTS idx_active_calls_status ON active_calls(status);
CREATE INDEX IF NOT EXISTS idx_active_calls_business_id ON active_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_pending_jobs_status_next_retry ON pending_jobs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_technicians_business_id ON technicians(business_id);
CREATE INDEX IF NOT EXISTS idx_business_partners_business_active ON business_partners(business_id, active);
CREATE INDEX IF NOT EXISTS idx_custom_intake_questions_business_id ON custom_intake_questions(business_id);
CREATE INDEX IF NOT EXISTS idx_job_intakes_business_created ON job_intakes(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pricing_ranges_business_active ON pricing_ranges(business_id, active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_business_created ON chat_messages(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_business_context_notes_business ON business_context_notes(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_google_reviews_business_rating ON google_reviews(business_id, rating);
CREATE INDEX IF NOT EXISTS idx_seasonal_services_business_active ON seasonal_services(business_id, is_active);
