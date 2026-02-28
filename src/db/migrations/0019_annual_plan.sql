-- Annual plan tracking columns on businesses
ALTER TABLE `businesses` ADD COLUMN `plan_type` text DEFAULT 'monthly';
ALTER TABLE `businesses` ADD COLUMN `annual_converted_at` text;
ALTER TABLE `businesses` ADD COLUMN `annual_pitched_at` text;
