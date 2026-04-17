-- Track handler completion for Stripe webhook events. Without this, an error
-- during handling required deleting the idempotency row to allow Stripe retries,
-- which could double-process any non-idempotent side-effects (activity logs,
-- notifications) that already ran before the throw.
ALTER TABLE processed_stripe_events ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';
