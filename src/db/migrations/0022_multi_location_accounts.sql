-- Multi-location accounts: parent account layer above businesses
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  company_name TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,
  plan_type TEXT DEFAULT 'monthly',
  location_count INTEGER DEFAULT 1,
  max_locations INTEGER DEFAULT 10,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_email ON accounts(owner_email);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_account_stripe ON accounts(stripe_customer_id);
--> statement-breakpoint

-- Add location columns to businesses
ALTER TABLE businesses ADD COLUMN account_id TEXT REFERENCES accounts(id);
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN location_name TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN is_primary_location INTEGER DEFAULT 1;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN location_order INTEGER DEFAULT 0;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_business_account ON businesses(account_id);
