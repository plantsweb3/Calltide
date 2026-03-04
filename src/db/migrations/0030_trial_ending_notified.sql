-- Add trialEndingNotified flag to businesses
-- Prevents duplicate trial-ending emails and enables tracking.
ALTER TABLE businesses ADD COLUMN trial_ending_notified INTEGER DEFAULT 0;
