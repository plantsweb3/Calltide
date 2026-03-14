ALTER TABLE customers ADD COLUMN lifetime_value INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN tier TEXT DEFAULT 'new';
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN complaint_count INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN custom_fields TEXT DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE appointments ADD COLUMN technician_id TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN payment_link_url TEXT;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN custom_field_templates TEXT DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN enable_thank_you_sms INTEGER DEFAULT 1;
--> statement-breakpoint
ALTER TABLE businesses ADD COLUMN service_durations TEXT DEFAULT '{}';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  skills TEXT DEFAULT '[]',
  google_calendar_id TEXT,
  is_active INTEGER DEFAULT 1,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  customer_id TEXT REFERENCES customers(id),
  appointment_id TEXT REFERENCES appointments(id),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TEXT,
  paid_at TEXT,
  payment_method TEXT,
  payment_link_url TEXT,
  notes TEXT,
  sms_sent_at TEXT,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS google_reviews (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  review_id TEXT,
  author_name TEXT,
  rating INTEGER NOT NULL,
  text TEXT,
  reply TEXT,
  reply_draft TEXT,
  reply_status TEXT DEFAULT 'none',
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_technicians_business ON technicians(business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_google_reviews_business ON google_reviews(business_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON google_reviews(business_id, rating);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(business_id, tier);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_appointments_technician ON appointments(technician_id);
