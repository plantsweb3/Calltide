-- Migration 0075: Feature Expansion
-- Adds follow-ups, callbacks, complaint tickets, recurring rules,
-- SMS templates, customer portal tokens, and invoice/estimate enhancements

-- ── 1. Add columns to calls table ──
ALTER TABLE calls ADD COLUMN caller_context_used INTEGER DEFAULT 0;
ALTER TABLE calls ADD COLUMN follow_up_created INTEGER DEFAULT 0;

-- ── 2. Create follow_ups table ──
CREATE TABLE follow_ups (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  call_id TEXT REFERENCES calls(id),
  customer_id TEXT REFERENCES customers(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 3. Create callbacks table ──
CREATE TABLE callbacks (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  call_id TEXT REFERENCES calls(id),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  reason TEXT,
  requested_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  outbound_call_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 4. Create complaint_tickets table ──
CREATE TABLE complaint_tickets (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  call_id TEXT REFERENCES calls(id),
  customer_id TEXT REFERENCES customers(id),
  customer_phone TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  description TEXT NOT NULL,
  resolution TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 5. Create recurring_rules table ──
CREATE TABLE recurring_rules (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  service TEXT NOT NULL,
  frequency TEXT NOT NULL,
  day_of_week INTEGER,
  day_of_month INTEGER,
  preferred_time TEXT,
  technician_id TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  next_occurrence TEXT NOT NULL,
  last_generated TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 6. Create sms_templates table ──
CREATE TABLE sms_templates (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  template_key TEXT NOT NULL,
  name TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_es TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 7. Create customer_portal_tokens table ──
CREATE TABLE customer_portal_tokens (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── 8. Add columns to invoices table ──
ALTER TABLE invoices ADD COLUMN estimate_id TEXT REFERENCES estimates(id);
ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN line_items TEXT;
ALTER TABLE invoices ADD COLUMN subtotal REAL;
ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN stripe_payment_link_id TEXT;
ALTER TABLE invoices ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE invoices ADD COLUMN customer_portal_url TEXT;

-- ── 9. Add columns to estimates table ──
ALTER TABLE estimates ADD COLUMN line_items TEXT;
ALTER TABLE estimates ADD COLUMN subtotal REAL;
ALTER TABLE estimates ADD COLUMN tax_rate REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN tax_amount REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN valid_until TEXT;
ALTER TABLE estimates ADD COLUMN converted_invoice_id TEXT;

-- ── 10. Indexes ──
CREATE INDEX idx_follow_ups_business_status ON follow_ups(business_id, status);
CREATE INDEX idx_follow_ups_due_date ON follow_ups(due_date);
CREATE INDEX idx_callbacks_business_status ON callbacks(business_id, status);
CREATE INDEX idx_callbacks_requested_time ON callbacks(requested_time);
CREATE INDEX idx_complaint_tickets_business ON complaint_tickets(business_id, status);
CREATE INDEX idx_recurring_rules_next ON recurring_rules(business_id, next_occurrence, is_active);
CREATE INDEX idx_sms_templates_business ON sms_templates(business_id, template_key);
CREATE INDEX idx_portal_tokens_token ON customer_portal_tokens(token);
CREATE INDEX idx_portal_tokens_customer ON customer_portal_tokens(customer_id);
CREATE INDEX idx_invoices_estimate ON invoices(estimate_id);
CREATE INDEX idx_invoices_number ON invoices(business_id, invoice_number);
