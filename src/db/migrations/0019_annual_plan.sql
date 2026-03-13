-- Annual plan tracking columns on businesses
ALTER TABLE `businesses` ADD COLUMN `plan_type` text DEFAULT 'monthly';
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `annual_converted_at` text;
--> statement-breakpoint
ALTER TABLE `businesses` ADD COLUMN `annual_pitched_at` text;
