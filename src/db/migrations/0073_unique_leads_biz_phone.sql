-- Migration 0073: Add UNIQUE index on leads(business_id, phone)
-- Prevents duplicate leads per business during concurrent call handling.
-- Drop the old non-unique index first, then create the unique one.

DROP INDEX IF EXISTS idx_leads_business_phone;

CREATE UNIQUE INDEX idx_leads_business_phone
  ON leads (business_id, phone);
