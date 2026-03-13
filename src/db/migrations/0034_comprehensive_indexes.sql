-- Comprehensive index coverage for remaining FK columns and high-frequency query patterns.
-- All indexes use IF NOT EXISTS to be safely idempotent.
-- ── FK columns not yet indexed ──
-- calls.customer_id — joined in customer detail pages
CREATE INDEX IF NOT EXISTS idx_calls_customer_id ON calls(customer_id);
--> statement-breakpoint

-- calls.outcome — filtered in dashboard overviews
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
--> statement-breakpoint

-- outbound_calls.customer_id — joined in customer call lists
CREATE INDEX IF NOT EXISTS idx_outbound_calls_customer_id ON outbound_calls(customer_id);
--> statement-breakpoint

-- outbound_calls.reference_id — FK to appointments.id or estimates.id
CREATE INDEX IF NOT EXISTS idx_outbound_calls_reference_id ON outbound_calls(reference_id);
--> statement-breakpoint

-- outbound_calls.status + scheduled_for — cron dispatch query
CREATE INDEX IF NOT EXISTS idx_outbound_calls_status_scheduled ON outbound_calls(status, scheduled_for);
--> statement-breakpoint

-- sms_messages.customer_id — customer SMS lookup (column present but not a .references())
CREATE INDEX IF NOT EXISTS idx_sms_messages_customer_id ON sms_messages(customer_id);
--> statement-breakpoint

-- referrals.referred_business_id — lookup by referred business
CREATE INDEX IF NOT EXISTS idx_referrals_referred_business_id ON referrals(referred_business_id);
--> statement-breakpoint

-- referrals.referral_code — lookup for signup attribution
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
--> statement-breakpoint

-- audit_requests.prospect_id — FK to prospects
CREATE INDEX IF NOT EXISTS idx_audit_requests_prospect_id ON audit_requests(prospect_id);
--> statement-breakpoint

-- capacity_alerts.incident_id — FK to incidents
CREATE INDEX IF NOT EXISTS idx_capacity_alerts_incident_id ON capacity_alerts(incident_id);
--> statement-breakpoint

-- consent_records.business_id — compliance lookups per business
CREATE INDEX IF NOT EXISTS idx_consent_records_business_id ON consent_records(business_id);
--> statement-breakpoint

-- consent_records.phone_number — SMS consent checks
CREATE INDEX IF NOT EXISTS idx_consent_records_phone_number ON consent_records(phone_number);
--> statement-breakpoint

-- help_search_misses.business_id — analytics per business
CREATE INDEX IF NOT EXISTS idx_help_search_misses_business_id ON help_search_misses(business_id);
--> statement-breakpoint

-- client_feedback.business_id — feedback per business
CREATE INDEX IF NOT EXISTS idx_client_feedback_business_id ON client_feedback(business_id);
--> statement-breakpoint

-- blog_posts.paired_post_id — bilingual pair lookup
CREATE INDEX IF NOT EXISTS idx_blog_posts_paired_post_id ON blog_posts(paired_post_id);
--> statement-breakpoint

-- paywall_emails.business_id — retarget sequence per business
CREATE INDEX IF NOT EXISTS idx_paywall_emails_business_id ON paywall_emails(business_id);
--> statement-breakpoint

-- paywall_emails.resend_id — webhook event matching
CREATE INDEX IF NOT EXISTS idx_paywall_emails_resend_id ON paywall_emails(resend_id);
--> statement-breakpoint

-- ── High-frequency query pattern indexes ──

-- businesses.onboarding_status — filtered in pipeline views and cron jobs
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_status ON businesses(onboarding_status);
--> statement-breakpoint

-- businesses.stripe_subscription_status — billing queries
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_sub_status ON businesses(stripe_subscription_status);
--> statement-breakpoint

-- businesses.payment_status — dunning + payment queries
CREATE INDEX IF NOT EXISTS idx_businesses_payment_status ON businesses(payment_status);
--> statement-breakpoint

-- prospects.status — filtered in admin prospect views
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
--> statement-breakpoint

-- prospects.vertical — filtered in admin prospect views
CREATE INDEX IF NOT EXISTS idx_prospects_vertical ON prospects(vertical);
--> statement-breakpoint

-- agent_activity_log.agent_name — filtered in admin agent views
CREATE INDEX IF NOT EXISTS idx_agent_activity_log_agent_name ON agent_activity_log(agent_name);
--> statement-breakpoint

-- agent_activity_log.created_at — sorted in admin views
CREATE INDEX IF NOT EXISTS idx_agent_activity_log_created_at ON agent_activity_log(created_at);
--> statement-breakpoint

-- dunning_state.status — filtered in dunning cron
CREATE INDEX IF NOT EXISTS idx_dunning_state_status ON dunning_state(status);
--> statement-breakpoint

-- incidents.severity — filtered in incident views
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
--> statement-breakpoint

-- blog_posts.published + published_at — public blog listing query
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at);
--> statement-breakpoint

-- help_articles.status — published articles query
CREATE INDEX IF NOT EXISTS idx_help_articles_status ON help_articles(status);
--> statement-breakpoint

-- nps_responses.created_at — sorted in admin views
CREATE INDEX IF NOT EXISTS idx_nps_responses_created_at ON nps_responses(created_at);
--> statement-breakpoint

-- escalations.resolution_status — filtered in admin views
CREATE INDEX IF NOT EXISTS idx_escalations_resolution_status ON escalations(resolution_status);
