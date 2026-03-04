-- Daily summary SMS preference on businesses
ALTER TABLE `businesses` ADD COLUMN `enable_daily_summary` integer DEFAULT 1;
