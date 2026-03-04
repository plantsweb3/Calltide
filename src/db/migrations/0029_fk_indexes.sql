-- Add indexes on all remaining foreign key columns without indexes.
-- Migration 0011 covered many FK columns; these are the ones still missing.

-- businesses → accounts
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON businesses(account_id);

-- service_pricing → businesses
CREATE INDEX IF NOT EXISTS idx_service_pricing_business_id ON service_pricing(business_id);

-- outbound_calls → businesses
CREATE INDEX IF NOT EXISTS idx_outbound_calls_business_id ON outbound_calls(business_id);

-- seasonal_services → businesses
CREATE INDEX IF NOT EXISTS idx_seasonal_services_business_id ON seasonal_services(business_id);

-- active_calls → businesses
CREATE INDEX IF NOT EXISTS idx_active_calls_business_id ON active_calls(business_id);

-- customers → businesses
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);

-- estimates → businesses, customers, calls
CREATE INDEX IF NOT EXISTS idx_estimates_business_id ON estimates(business_id);
CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX IF NOT EXISTS idx_estimates_call_id ON estimates(call_id);

-- campaign_contacts → calls (campaign_id and lead_id already indexed in 0011)
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_call_id ON campaign_contacts(call_id);

-- agent_handoffs → businesses
CREATE INDEX IF NOT EXISTS idx_agent_handoffs_business_id ON agent_handoffs(business_id);

-- receptionist_custom_responses → businesses
CREATE INDEX IF NOT EXISTS idx_receptionist_custom_responses_business_id ON receptionist_custom_responses(business_id);

-- testimonials → businesses
CREATE INDEX IF NOT EXISTS idx_testimonials_business_id ON testimonials(business_id);
