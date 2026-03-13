-- Referral Network: cross-trade partner referrals between businesses
CREATE TABLE IF NOT EXISTS business_partners (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  partner_business_id TEXT REFERENCES businesses(id),
  partner_name TEXT NOT NULL,
  partner_trade TEXT NOT NULL,
  partner_phone TEXT NOT NULL,
  partner_contact_name TEXT,
  partner_email TEXT,
  relationship TEXT NOT NULL DEFAULT 'trusted',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, partner_phone)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_business_partners_business ON business_partners(business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_business_partners_trade ON business_partners(business_id, partner_trade);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS partner_referrals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  referring_business_id TEXT NOT NULL REFERENCES businesses(id),
  partner_id TEXT NOT NULL REFERENCES business_partners(id),
  call_id TEXT REFERENCES calls(id),
  caller_name TEXT,
  caller_phone TEXT,
  requested_trade TEXT NOT NULL,
  job_description TEXT,
  referral_method TEXT NOT NULL DEFAULT 'info_shared',
  partner_notified INTEGER NOT NULL DEFAULT 0,
  outcome TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_partner_referrals_business ON partner_referrals(referring_business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner ON partner_referrals(partner_id);
