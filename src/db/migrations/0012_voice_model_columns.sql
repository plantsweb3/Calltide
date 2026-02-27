-- Add voice model tuning columns to businesses
ALTER TABLE businesses ADD COLUMN greeting_es TEXT;
ALTER TABLE businesses ADD COLUMN service_area TEXT;
ALTER TABLE businesses ADD COLUMN additional_info TEXT;
