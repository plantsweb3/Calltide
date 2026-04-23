-- Prevent two businesses from accidentally claiming the same Twilio number.
-- Inbound calls to a shared number would route to whichever business the
-- SELECT query hit first — effectively random and silently wrong.
--
-- Create partial unique index (only on non-empty strings). Uses CREATE
-- UNIQUE INDEX IF NOT EXISTS so this is safe to re-run.

CREATE UNIQUE INDEX IF NOT EXISTS businesses_twilio_number_unique
  ON businesses (twilio_number)
  WHERE twilio_number IS NOT NULL AND twilio_number <> '';
