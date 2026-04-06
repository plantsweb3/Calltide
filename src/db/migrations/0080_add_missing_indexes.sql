-- Hot-path indexes for webhook and inbound call lookups
CREATE INDEX IF NOT EXISTS idx_businesses_twilio_number ON businesses(twilio_number);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_calls_twilio_call_sid ON calls(twilio_call_sid);
