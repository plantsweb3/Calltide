-- Migration 0070: Audit fixes — indexes, constraints, data integrity
-- Addresses: missing indexes, missing FK constraints, unique constraints, nullable timestamps

-- ══════════════════════════════════════════════
-- 1. Critical: Unique constraint on customers(businessId, phone)
--    Prevents duplicate customer records per business
-- ══════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_phone
  ON customers (business_id, phone)
  WHERE deleted_at IS NULL;

-- ══════════════════════════════════════════════
-- 2. Performance: Composite indexes on high-volume tables
-- ══════════════════════════════════════════════

-- Calls: frequently queried by businessId + createdAt range
CREATE INDEX IF NOT EXISTS idx_calls_business_created
  ON calls (business_id, created_at);

-- Calls: customer lookups
CREATE INDEX IF NOT EXISTS idx_calls_customer_id
  ON calls (customer_id);

-- Appointments: frequently queried by businessId + date range
CREATE INDEX IF NOT EXISTS idx_appointments_business_date
  ON appointments (business_id, date);

-- SMS Messages: frequently queried by businessId + createdAt
CREATE INDEX IF NOT EXISTS idx_sms_messages_business_created
  ON sms_messages (business_id, created_at);

-- Leads: phone lookups per business
CREATE INDEX IF NOT EXISTS idx_leads_business_phone
  ON leads (business_id, phone);

-- Customers: businessId (for list queries)
CREATE INDEX IF NOT EXISTS idx_customers_business_id
  ON customers (business_id);

-- Estimates: businessId + status
CREATE INDEX IF NOT EXISTS idx_estimates_business_status
  ON estimates (business_id, status);

-- Job Cards: businessId + createdAt
CREATE INDEX IF NOT EXISTS idx_job_cards_business_created
  ON job_cards (business_id, created_at);

-- Invoices: businessId + status
CREATE INDEX IF NOT EXISTS idx_invoices_business_status
  ON invoices (business_id, status);

-- Review Requests: businessId + sentAt (for daily count)
CREATE INDEX IF NOT EXISTS idx_review_requests_business_sent
  ON review_requests (business_id, sent_at);

-- Outbound Calls: businessId + scheduledFor
CREATE INDEX IF NOT EXISTS idx_outbound_calls_business_scheduled
  ON outbound_calls (business_id, scheduled_for);

-- SMS Opt-Outs: phone lookup
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone
  ON sms_opt_outs (phone_number);

-- Data Deletion Requests: status (for cron pickup)
CREATE INDEX IF NOT EXISTS idx_data_deletion_status
  ON data_deletion_requests (status);

-- Setup Sessions: status + lastActiveAt (for retargeting cron)
CREATE INDEX IF NOT EXISTS idx_setup_sessions_status
  ON setup_sessions (status, last_active_at);

-- Client Feedback: businessId
CREATE INDEX IF NOT EXISTS idx_client_feedback_business
  ON client_feedback (business_id);

-- Knowledge Gaps: businessId
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_business
  ON knowledge_gaps (business_id);

-- Webhook Endpoints: businessId
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_business
  ON webhook_endpoints (business_id);

-- Integration Connections: businessId
CREATE INDEX IF NOT EXISTS idx_integration_connections_business
  ON integration_connections (business_id);

-- Outreach Log: businessId + sentAt
CREATE INDEX IF NOT EXISTS idx_outreach_log_business_sent
  ON outreach_log (business_id, sent_at);
