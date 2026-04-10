import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function colExists(table, col) {
  try {
    const r = await client.execute(`PRAGMA table_info(${table})`);
    return r.rows.some((x) => x.name === col);
  } catch {
    return false;
  }
}

async function tableExists(table) {
  const r = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table]);
  return r.rows.length > 0;
}

async function addCol(table, col, type) {
  if (!(await tableExists(table))) {
    console.log(`  ⊘ ${table} does not exist — skip ${col}`);
    return;
  }
  if (await colExists(table, col)) return;
  await client.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  console.log(`  + ${table}.${col}`);
}

async function exec(sql, label) {
  try {
    await client.execute(sql);
    console.log(`  + ${label}`);
  } catch (e) {
    if (String(e.message).includes("already exists") || String(e.message).includes("duplicate column")) {
      // ignore
    } else {
      console.log(`  ! ${label}: ${e.message}`);
    }
  }
}

console.log("\n== 0072: Rename active_calls.hume_session_id → session_id ==");
if (await colExists("active_calls", "hume_session_id") && !(await colExists("active_calls", "session_id"))) {
  await client.execute("ALTER TABLE active_calls RENAME COLUMN hume_session_id TO session_id");
  console.log("  + renamed");
} else {
  console.log("  ✓ already migrated");
}

console.log("\n== 0075: Feature expansion — calls columns ==");
await addCol("calls", "caller_context_used", "INTEGER DEFAULT 0");
await addCol("calls", "follow_up_created", "INTEGER DEFAULT 0");

console.log("\n== 0075: Feature expansion — invoices columns ==");
await addCol("invoices", "estimate_id", "TEXT REFERENCES estimates(id)");
await addCol("invoices", "invoice_number", "TEXT");
await addCol("invoices", "line_items", "TEXT");
await addCol("invoices", "subtotal", "REAL");
await addCol("invoices", "tax_rate", "REAL DEFAULT 0");
await addCol("invoices", "tax_amount", "REAL DEFAULT 0");
await addCol("invoices", "stripe_payment_link_id", "TEXT");
await addCol("invoices", "stripe_payment_intent_id", "TEXT");
await addCol("invoices", "customer_portal_url", "TEXT");

console.log("\n== 0075: Feature expansion — estimates columns ==");
await addCol("estimates", "line_items", "TEXT");
await addCol("estimates", "subtotal", "REAL");
await addCol("estimates", "tax_rate", "REAL DEFAULT 0");
await addCol("estimates", "tax_amount", "REAL DEFAULT 0");
await addCol("estimates", "valid_until", "TEXT");
await addCol("estimates", "converted_invoice_id", "TEXT");

console.log("\n== 0075: New tables ==");
await exec(`CREATE TABLE IF NOT EXISTS follow_ups (
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
)`, "follow_ups");

await exec(`CREATE TABLE IF NOT EXISTS callbacks (
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
)`, "callbacks");

await exec(`CREATE TABLE IF NOT EXISTS complaint_tickets (
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
)`, "complaint_tickets");

await exec(`CREATE TABLE IF NOT EXISTS recurring_rules (
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
)`, "recurring_rules");

await exec(`CREATE TABLE IF NOT EXISTS sms_templates (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  template_key TEXT NOT NULL,
  name TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_es TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`, "sms_templates");

await exec(`CREATE TABLE IF NOT EXISTS customer_portal_tokens (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`, "customer_portal_tokens");

console.log("\n== 0075: Indexes ==");
await exec("CREATE INDEX IF NOT EXISTS idx_follow_ups_business_status ON follow_ups(business_id, status)", "idx_follow_ups_business_status");
await exec("CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date)", "idx_follow_ups_due_date");
await exec("CREATE INDEX IF NOT EXISTS idx_callbacks_business_status ON callbacks(business_id, status)", "idx_callbacks_business_status");
await exec("CREATE INDEX IF NOT EXISTS idx_callbacks_requested_time ON callbacks(requested_time)", "idx_callbacks_requested_time");
await exec("CREATE INDEX IF NOT EXISTS idx_complaint_tickets_business ON complaint_tickets(business_id, status)", "idx_complaint_tickets_business");
await exec("CREATE INDEX IF NOT EXISTS idx_recurring_rules_next ON recurring_rules(business_id, next_occurrence, is_active)", "idx_recurring_rules_next");
await exec("CREATE INDEX IF NOT EXISTS idx_sms_templates_business ON sms_templates(business_id, template_key)", "idx_sms_templates_business");
await exec("CREATE INDEX IF NOT EXISTS idx_portal_tokens_token ON customer_portal_tokens(token)", "idx_portal_tokens_token");
await exec("CREATE INDEX IF NOT EXISTS idx_portal_tokens_customer ON customer_portal_tokens(customer_id)", "idx_portal_tokens_customer");
await exec("CREATE INDEX IF NOT EXISTS idx_invoices_estimate ON invoices(estimate_id)", "idx_invoices_estimate");
await exec("CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(business_id, invoice_number)", "idx_invoices_number");

console.log("\n== 0076: Journey gaps tables ==");
await exec(`CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  reason TEXT NOT NULL,
  rating INTEGER,
  feedback TEXT,
  recovery_offer_shown INTEGER DEFAULT 0,
  recovery_offer_accepted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`, "cancellation_feedback");

await exec(`CREATE TABLE IF NOT EXISTS win_back_emails (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  email_number INTEGER NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  opened_at TEXT,
  clicked_at TEXT,
  reactivated INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`, "win_back_emails");

await exec(`CREATE TABLE IF NOT EXISTS usage_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  alert_type TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  metric_value TEXT,
  acknowledged INTEGER DEFAULT 0
)`, "usage_alerts");

console.log("\n== 0076: Technician unavailability ==");
await addCol("technicians", "is_unavailable", "INTEGER DEFAULT 0");
await addCol("technicians", "unavailable_reason", "TEXT");
await addCol("technicians", "unavailable_until", "TEXT");

console.log("\n== 0076: Indexes ==");
await exec("CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_business ON cancellation_feedback(business_id)", "idx_cancellation_feedback_business");
await exec("CREATE INDEX IF NOT EXISTS idx_win_back_business ON win_back_emails(business_id, email_number)", "idx_win_back_business");
await exec("CREATE INDEX IF NOT EXISTS idx_usage_alerts_business_type ON usage_alerts(business_id, alert_type, sent_at)", "idx_usage_alerts_business_type");

console.log("\n== 0077: Setup sessions timezone ==");
await addCol("setup_sessions", "timezone", "TEXT DEFAULT 'America/Chicago'");

console.log("\n== 0078: Audit indexes ==");
await exec("CREATE INDEX IF NOT EXISTS idx_calls_after_hours ON calls(business_id, is_after_hours)", "idx_calls_after_hours");
await exec("CREATE INDEX IF NOT EXISTS idx_calls_language ON calls(business_id, language)", "idx_calls_language");
await exec("CREATE INDEX IF NOT EXISTS idx_monthly_digests_biz_month ON monthly_digests(business_id, month_key)", "idx_monthly_digests_biz_month");
await exec("CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(business_id, deleted_at)", "idx_customers_deleted");

console.log("\n== 0070: Audit fix indexes ==");
await exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_phone ON customers (business_id, phone) WHERE deleted_at IS NULL", "idx_customers_business_phone");
await exec("CREATE INDEX IF NOT EXISTS idx_calls_business_created ON calls (business_id, created_at)", "idx_calls_business_created");
await exec("CREATE INDEX IF NOT EXISTS idx_calls_customer_id ON calls (customer_id)", "idx_calls_customer_id");
await exec("CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments (business_id, date)", "idx_appointments_business_date");
await exec("CREATE INDEX IF NOT EXISTS idx_sms_messages_business_created ON sms_messages (business_id, created_at)", "idx_sms_messages_business_created");
await exec("CREATE INDEX IF NOT EXISTS idx_leads_business_phone ON leads (business_id, phone)", "idx_leads_business_phone");
await exec("CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers (business_id)", "idx_customers_business_id");
await exec("CREATE INDEX IF NOT EXISTS idx_estimates_business_status ON estimates (business_id, status)", "idx_estimates_business_status");
await exec("CREATE INDEX IF NOT EXISTS idx_job_cards_business_created ON job_cards (business_id, created_at)", "idx_job_cards_business_created");
await exec("CREATE INDEX IF NOT EXISTS idx_invoices_business_status ON invoices (business_id, status)", "idx_invoices_business_status");
await exec("CREATE INDEX IF NOT EXISTS idx_review_requests_business_sent ON review_requests (business_id, sent_at)", "idx_review_requests_business_sent");
await exec("CREATE INDEX IF NOT EXISTS idx_outbound_calls_business_scheduled ON outbound_calls (business_id, scheduled_for)", "idx_outbound_calls_business_scheduled");
await exec("CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs (phone_number)", "idx_sms_opt_outs_phone");
await exec("CREATE INDEX IF NOT EXISTS idx_data_deletion_status ON data_deletion_requests (status)", "idx_data_deletion_status");
await exec("CREATE INDEX IF NOT EXISTS idx_setup_sessions_status ON setup_sessions (status, last_active_at)", "idx_setup_sessions_status");
await exec("CREATE INDEX IF NOT EXISTS idx_client_feedback_business ON client_feedback (business_id)", "idx_client_feedback_business");
await exec("CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_business ON knowledge_gaps (business_id)", "idx_knowledge_gaps_business");
await exec("CREATE INDEX IF NOT EXISTS idx_outreach_log_business_sent ON outreach_log (business_id, sent_at)", "idx_outreach_log_business_sent");

console.log("\n== 0074: System audit indexes ==");
await exec("CREATE INDEX IF NOT EXISTS idx_active_calls_status ON active_calls(status)", "idx_active_calls_status");
await exec("CREATE INDEX IF NOT EXISTS idx_active_calls_business_id ON active_calls(business_id)", "idx_active_calls_business_id");
await exec("CREATE INDEX IF NOT EXISTS idx_pending_jobs_status_next_retry ON pending_jobs(status, next_retry_at)", "idx_pending_jobs_status_next_retry");
await exec("CREATE INDEX IF NOT EXISTS idx_technicians_business_id ON technicians(business_id)", "idx_technicians_business_id");
await exec("CREATE INDEX IF NOT EXISTS idx_business_partners_business_active ON business_partners(business_id, active)", "idx_business_partners_business_active");
await exec("CREATE INDEX IF NOT EXISTS idx_custom_intake_questions_business_id ON custom_intake_questions(business_id)", "idx_custom_intake_questions_business_id");
await exec("CREATE INDEX IF NOT EXISTS idx_job_intakes_business_created ON job_intakes(business_id, created_at)", "idx_job_intakes_business_created");
await exec("CREATE INDEX IF NOT EXISTS idx_pricing_ranges_business_active ON pricing_ranges(business_id, active)", "idx_pricing_ranges_business_active");
await exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_business_created ON chat_messages(business_id, created_at)", "idx_chat_messages_business_created");
await exec("CREATE INDEX IF NOT EXISTS idx_business_context_notes_business ON business_context_notes(business_id)", "idx_business_context_notes_business");
await exec("CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at)", "idx_weather_cache_expires");
await exec("CREATE INDEX IF NOT EXISTS idx_google_reviews_business_rating ON google_reviews(business_id, rating)", "idx_google_reviews_business_rating");
await exec("CREATE INDEX IF NOT EXISTS idx_seasonal_services_business_active ON seasonal_services(business_id, is_active)", "idx_seasonal_services_business_active");

console.log("\n== 0073: Unique leads constraint ==");
try {
  await client.execute("DROP INDEX IF EXISTS idx_leads_business_phone");
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_business_phone ON leads (business_id, phone)");
  console.log("  + recreated as UNIQUE");
} catch (e) {
  console.log("  ! lead unique:", e.message);
}

console.log("\n✓ Migration sweep complete");
