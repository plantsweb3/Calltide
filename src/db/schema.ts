import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  companyName: text("company_name"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status"),
  planType: text("plan_type").default("monthly"),
  locationCount: integer("location_count").default(1),
  maxLocations: integer("max_locations").default(10),
  passwordHash: text("password_hash"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: text("password_reset_expiry"),
  passwordChangedAt: text("password_changed_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: text("locked_until"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const businesses = sqliteTable("businesses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g. "plumbing", "dental", "salon"
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  ownerEmail: text("owner_email"),
  twilioNumber: text("twilio_number").notNull(),
  humeConfigId: text("hume_config_id"),
  services: text("services", { mode: "json" }).notNull().$type<string[]>(),
  businessHours: text("business_hours", { mode: "json" }).notNull().$type<Record<string, { open: string; close: string }>>(),
  timezone: text("timezone").notNull().default("America/Chicago"),
  defaultLanguage: text("default_language").notNull().default("en"),
  greeting: text("greeting"), // custom greeting override
  greetingEs: text("greeting_es"), // Spanish greeting override
  serviceArea: text("service_area"), // e.g. "San Antonio and surrounding areas"
  additionalInfo: text("additional_info"), // extra context for AI prompt
  emergencyPhone: text("emergency_phone"), // after-hours emergency transfer number
  avgJobValue: integer("avg_job_value").default(250), // average $ per appointment for revenue estimates
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  referralCode: text("referral_code").unique(),
  healthScore: integer("health_score").default(50),
  lastNpsScore: integer("last_nps_score"),
  lastNpsDate: text("last_nps_date"),
  onboardingStep: integer("onboarding_step").default(1),
  onboardingStatus: text("onboarding_status").default("not_started"), // not_started, in_progress, paywall_reached, completed, abandoned
  onboardingStartedAt: text("onboarding_started_at"),
  onboardingPaywallReachedAt: text("onboarding_paywall_reached_at"),
  paywallUnsubscribed: integer("paywall_unsubscribed", { mode: "boolean" }).default(false),
  onboardingCompletedAt: text("onboarding_completed_at"),
  onboardingSkippedSteps: text("onboarding_skipped_steps", { mode: "json" }).$type<number[]>().default([]),
  onboardingQaGrade: text("onboarding_qa_grade"), // A/B/C/D/F
  onboardingQaCompleteAt: text("onboarding_qa_complete_at"),
  // Legal + Compliance
  tosAcceptedVersion: text("tos_accepted_version"),
  tosAcceptedAt: text("tos_accepted_at"),
  privacyAcceptedVersion: text("privacy_accepted_version"),
  privacyAcceptedAt: text("privacy_accepted_at"),
  dpaAcceptedVersion: text("dpa_accepted_version"),
  dpaAcceptedAt: text("dpa_accepted_at"),
  dataDeletedAt: text("data_deleted_at"),
  dataRetentionHoldUntil: text("data_retention_hold_until"),
  // Financial Operations
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status"), // active, past_due, canceled, trialing
  paymentStatus: text("payment_status").default("active"), // active, past_due, grace_period, suspended, canceled
  lastPaymentAt: text("last_payment_at"),
  lastPaymentAmount: integer("last_payment_amount"), // cents
  nextBillingAt: text("next_billing_at"),
  mrr: integer("mrr").default(49700), // cents ($497)
  lifetimeRevenue: integer("lifetime_revenue").default(0), // cents
  cardLast4: text("card_last4"),
  cardExpMonth: integer("card_exp_month"),
  cardExpYear: integer("card_exp_year"),
  // CRM
  personalityNotes: text("personality_notes"),
  receptionistName: text("receptionist_name").default("Maria"),
  personalityPreset: text("personality_preset").default("friendly"),
  hasPricingEnabled: integer("has_pricing_enabled", { mode: "boolean" }).default(false),
  // Plan
  planType: text("plan_type").default("monthly"), // monthly, annual
  annualConvertedAt: text("annual_converted_at"),
  annualPitchedAt: text("annual_pitched_at"),
  trialEndingNotified: integer("trial_ending_notified", { mode: "boolean" }).default(false),
  audioRetentionDays: integer("audio_retention_days").default(90),
  // Outbound calling
  outboundEnabled: integer("outbound_enabled", { mode: "boolean" }).default(false),
  appointmentReminders: integer("appointment_reminders", { mode: "boolean" }).default(true),
  estimateFollowups: integer("estimate_followups", { mode: "boolean" }).default(true),
  seasonalReminders: integer("seasonal_reminders", { mode: "boolean" }).default(false),
  outboundCallingHoursStart: text("outbound_calling_hours_start").default("09:00"),
  outboundCallingHoursEnd: text("outbound_calling_hours_end").default("18:00"),
  outboundMaxCallsPerDay: integer("outbound_max_calls_per_day").default(20),
  // Multi-location
  accountId: text("account_id").references(() => accounts.id),
  locationName: text("location_name"),
  isPrimaryLocation: integer("is_primary_location", { mode: "boolean" }).default(true),
  locationOrder: integer("location_order").default(0),
  // Disaster recovery
  voicemailFallbackActive: integer("voicemail_fallback_active", { mode: "boolean" }).default(false),
  // Weekly digest preferences
  enableWeeklyDigest: integer("enable_weekly_digest", { mode: "boolean" }).default(true),
  digestDeliveryMethod: text("digest_delivery_method").default("both"), // email, sms, both
  // Daily summary text
  enableDailySummary: integer("enable_daily_summary", { mode: "boolean" }).default(true),
  // Google review requests
  googleReviewUrl: text("google_review_url"),
  enableReviewRequests: integer("enable_review_requests", { mode: "boolean" }).default(true),
  // Missed call recovery
  enableMissedCallRecovery: integer("enable_missed_call_recovery", { mode: "boolean" }).default(true),
  // Customer recall / maintenance reminders
  enableCustomerRecall: integer("enable_customer_recall", { mode: "boolean" }).default(true),
  // Notification preferences
  notifyOnEveryCall: integer("notify_on_every_call", { mode: "boolean" }).default(false),
  notifyOnMissedOnly: integer("notify_on_missed_only", { mode: "boolean" }).default(true),
  ownerQuietHoursStart: text("owner_quiet_hours_start").default("21:00"),
  ownerQuietHoursEnd: text("owner_quiet_hours_end").default("08:00"),
  setupChecklistDismissed: integer("setup_checklist_dismissed", { mode: "boolean" }).default(false),
  // Public booking page
  bookingSlug: text("booking_slug").unique(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  phone: text("phone").notNull(),
  name: text("name"),
  email: text("email"),
  language: text("language").notNull().default("en"),
  notes: text("notes"),
  source: text("source").notNull().default("inbound_call"), // inbound_call, outbound_campaign, manual
  smsOptOut: integer("sms_opt_out", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const calls = sqliteTable("calls", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  leadId: text("lead_id").references(() => leads.id),
  humeChitChatId: text("hume_chat_id"),
  humeChatGroupId: text("hume_chat_group_id"),
  direction: text("direction").notNull().default("inbound"), // inbound, outbound
  callerPhone: text("caller_phone"),
  calledPhone: text("called_phone"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, missed, failed
  duration: integer("duration"), // seconds
  language: text("language"),
  summary: text("summary"),
  sentiment: text("sentiment"), // positive, neutral, negative
  transcript: text("transcript", { mode: "json" }).$type<Array<{ speaker: "ai" | "caller"; text: string }>>(),
  transferRequested: integer("transfer_requested", { mode: "boolean" }).default(false),
  // CRM
  outcome: text("outcome"), // appointment_booked, estimate_requested, message_taken, transfer, info_only, spam, unknown
  audioUrl: text("audio_url"),
  customerId: text("customer_id"),
  recordingDisclosed: integer("recording_disclosed", { mode: "boolean" }).default(false),
  aiDisclosed: integer("ai_disclosed", { mode: "boolean" }).default(false),
  // Missed call recovery
  isAbandoned: integer("is_abandoned", { mode: "boolean" }).default(false),
  recoverySmsSentAt: text("recovery_sms_sent_at"),
  recoveryStatus: text("recovery_status"), // null, sms_sent, callback_requested, callback_completed
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const servicePricing = sqliteTable("service_pricing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  serviceName: text("service_name").notNull(),
  priceMin: real("price_min"),
  priceMax: real("price_max"),
  unit: text("unit").default("per_job"), // per_job, per_hour, per_sqft, per_unit
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const outboundCalls = sqliteTable("outbound_calls", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  customerId: text("customer_id"),
  customerPhone: text("customer_phone").notNull(),
  callType: text("call_type").notNull(), // appointment_reminder, estimate_followup, seasonal_reminder
  referenceId: text("reference_id"), // FK → appointments.id or estimates.id
  status: text("status").default("scheduled").notNull(), // scheduled, calling, completed, failed, no_answer, cancelled
  scheduledFor: text("scheduled_for").notNull(),
  attemptedAt: text("attempted_at"),
  completedAt: text("completed_at"),
  duration: integer("duration"), // seconds
  outcome: text("outcome"), // confirmed, rescheduled, cancelled, interested, not_interested, voicemail, no_answer, no_consent
  transcript: text("transcript"),
  recordingUrl: text("recording_url"),
  twilioCallSid: text("twilio_call_sid"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(2),
  consentRecordId: text("consent_record_id"),
  language: text("language").default("en"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const seasonalServices = sqliteTable("seasonal_services", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  serviceName: text("service_name").notNull(),
  reminderIntervalMonths: integer("reminder_interval_months").notNull(),
  reminderMessage: text("reminder_message"),
  seasonStart: integer("season_start"), // month 1-12
  seasonEnd: integer("season_end"), // month 1-12
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Live Call Monitoring ──

export const activeCalls = sqliteTable("active_calls", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  businessName: text("business_name").notNull(),
  callerPhone: text("caller_phone").notNull(),
  customerName: text("customer_name"),
  isReturningCaller: integer("is_returning_caller", { mode: "boolean" }).default(false),
  direction: text("direction").default("inbound"),
  callType: text("call_type"),
  language: text("language").default("en"),
  twilioCallSid: text("twilio_call_sid"),
  humeSessionId: text("hume_session_id"),
  startedAt: text("started_at").notNull().default(sql`(datetime('now'))`),
  lastActivityAt: text("last_activity_at").notNull().default(sql`(datetime('now'))`),
  status: text("status").default("ringing").notNull(),
  currentIntent: text("current_intent"),
  durationSeconds: integer("duration_seconds").default(0),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
});

export const callPeaks = sqliteTable("call_peaks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull().unique(),
  peakConcurrent: integer("peak_concurrent").default(0),
  peakTime: text("peak_time"),
  totalCalls: integer("total_calls").default(0),
  avgDuration: integer("avg_duration").default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  leadId: text("lead_id").notNull().references(() => leads.id),
  callId: text("call_id").references(() => calls.id),
  service: text("service").notNull(),
  date: text("date").notNull(), // ISO date: 2025-06-15
  time: text("time").notNull(), // 24h: 14:00
  duration: integer("duration").notNull().default(60), // minutes
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled, completed, no_show
  notes: text("notes"),
  reminderSent: integer("reminder_sent", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const smsMessages = sqliteTable("sms_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  leadId: text("lead_id").references(() => leads.id),
  callId: text("call_id").references(() => calls.id),
  direction: text("direction").notNull().default("outbound"), // inbound, outbound
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  body: text("body").notNull(),
  templateType: text("template_type"), // missed_call, appointment_confirm, owner_notify, reminder
  twilioSid: text("twilio_sid"),
  status: text("status").notNull().default("sent"), // sent, delivered, failed
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const outboundCampaigns = sqliteTable("outbound_campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("reactivation"), // reactivation, promotion, reminder
  message: text("message").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  totalContacts: integer("total_contacts").default(0),
  contactsReached: integer("contacts_reached").default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const campaignContacts = sqliteTable("campaign_contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => outboundCampaigns.id),
  leadId: text("lead_id").notNull().references(() => leads.id),
  status: text("status").notNull().default("pending"), // pending, called, answered, no_answer, failed
  callId: text("call_id").references(() => calls.id),
  attempts: integer("attempts").default(0),
  lastAttemptAt: text("last_attempt_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 9: CRM ──

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  phone: text("phone").notNull(),
  name: text("name"),
  email: text("email"),
  address: text("address"),
  language: text("language").default("en"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  notes: text("notes"),
  source: text("source").default("inbound_call"),
  totalCalls: integer("total_calls").default(0),
  totalAppointments: integer("total_appointments").default(0),
  totalEstimates: integer("total_estimates").default(0),
  lastCallAt: text("last_call_at"),
  firstCallAt: text("first_call_at"),
  isRepeat: integer("is_repeat", { mode: "boolean" }).default(false),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const estimates = sqliteTable("estimates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  callId: text("call_id").references(() => calls.id),
  service: text("service"),
  description: text("description"),
  status: text("status").notNull().default("new"), // new, sent, follow_up, won, lost, expired
  amount: real("amount"),
  followUpCount: integer("follow_up_count").default(0),
  lastFollowUpAt: text("last_follow_up_at"),
  nextFollowUpAt: text("next_follow_up_at"),
  wonAt: text("won_at"),
  lostAt: text("lost_at"),
  lostReason: text("lost_reason"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 2: Outreach Engine ──

export const prospects = sqliteTable("prospects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  placeId: text("place_id").unique(),
  businessName: text("business_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  vertical: text("vertical"), // plumbing, dental, salon, etc.
  rating: real("rating"),
  reviewCount: integer("review_count"),
  language: text("language").default("en"), // detected primary language
  size: text("size").default("small"), // small, medium, large
  leadScore: integer("lead_score").default(0), // 0-65
  status: text("status").notNull().default("new"), // new, audit_scheduled, audit_complete, outreach_active, outreach_paused, demo_booked, converted, disqualified
  auditResult: text("audit_result"), // answered, missed, voicemail, failed
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  notes: text("notes"),
  source: text("source").notNull().default("google_places"), // google_places, csv_import, manual
  smsOptOut: integer("sms_opt_out", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const prospectAuditCalls = sqliteTable("prospect_audit_calls", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prospectId: text("prospect_id").notNull().references(() => prospects.id),
  twilioCallSid: text("twilio_call_sid"),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  status: text("status").notNull().default("queued"), // queued, ringing, in-progress, completed, no-answer, busy, failed, canceled
  duration: integer("duration"), // seconds
  answeredBy: text("answered_by"), // human, machine, unknown
  ringTime: integer("ring_time"), // seconds before answer/voicemail
  scheduledAt: text("scheduled_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const prospectOutreach = sqliteTable("prospect_outreach", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prospectId: text("prospect_id").notNull().references(() => prospects.id),
  channel: text("channel").notNull(), // email, sms
  templateKey: text("template_key").notNull(), // e.g. missed_call_1, missed_call_2, answered_1
  status: text("status").notNull().default("sent"), // sent, delivered, opened, clicked, bounced, failed, opted_out
  externalId: text("external_id"), // Resend email ID or Twilio SID
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const demos = sqliteTable("demos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prospectId: text("prospect_id").references(() => prospects.id),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  scheduledAt: text("scheduled_at"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, no_show, cancelled, converted
  outcome: text("outcome"), // signed, follow_up, not_interested
  notes: text("notes"),
  revenue: real("revenue"), // MRR if converted
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // prospect_scraped, audit_call, email_sent, sms_sent, demo_booked, status_change, etc.
  entityType: text("entity_type"), // prospect, demo, business
  entityId: text("entity_id"),
  title: text("title").notNull(),
  detail: text("detail"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 3: Admin Portal ──

export const customerNotes = sqliteTable("customer_notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text("customer_id").notNull().references(() => businesses.id),
  noteText: text("note_text").notNull(),
  createdBy: text("created_by").notNull().default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const systemHealthLogs = sqliteTable("system_health_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceName: text("service_name").notNull(),
  status: text("status").notNull().default("operational"), // operational, degraded, down
  latencyMs: integer("latency_ms"),
  errorCount: integer("error_count").default(0),
  uptimePct: real("uptime_pct").default(100),
  checkedAt: text("checked_at").notNull().default(sql`(datetime('now'))`),
});

export const revenueMetrics = sqliteTable("revenue_metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(), // ISO date: 2025-06-15
  mrr: real("mrr").notNull().default(0),
  arr: real("arr").notNull().default(0),
  customerCount: integer("customer_count").notNull().default(0),
  newCustomers: integer("new_customers").default(0),
  churnedCustomers: integer("churned_customers").default(0),
  failedPayments: integer("failed_payments").default(0),
});

export const churnRiskScores = sqliteTable("churn_risk_scores", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text("customer_id").notNull().references(() => businesses.id),
  score: integer("score").notNull().default(0), // 0-10
  factors: text("factors", { mode: "json" }).$type<string[]>().default([]),
  calculatedAt: text("calculated_at").notNull().default(sql`(datetime('now'))`),
});

export const escalations = sqliteTable("escalations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  callId: text("call_id").references(() => calls.id),
  customerId: text("customer_id").notNull().references(() => businesses.id),
  reason: text("reason").notNull(),
  resolutionStatus: text("resolution_status").notNull().default("open"), // open, in_progress, resolved
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 4: Agent System ──

export const agentActivityLog = sqliteTable("agent_activity_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentName: text("agent_name").notNull(), // support, qualify, churn, onboard, health
  actionType: text("action_type").notNull(), // email_sent, sms_sent, escalated, resolved, qualified, nudged, health_check, demo_created
  targetId: text("target_id"),
  targetType: text("target_type"), // client, prospect, system
  inputSummary: text("input_summary"),
  outputSummary: text("output_summary"),
  toolsCalled: text("tools_called", { mode: "json" }).$type<string[]>(),
  escalated: integer("escalated", { mode: "boolean" }).default(false),
  resolvedWithoutEscalation: integer("resolved_without_escalation", { mode: "boolean" }).default(false),
  category: text("category"), // billing, technical, how-to, feature-request, cancellation
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const agentConfig = sqliteTable("agent_config", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentName: text("agent_name").unique().notNull(),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  cronExpression: text("cron_expression"),
  systemPromptOverride: text("system_prompt_override"),
  escalationThreshold: integer("escalation_threshold"),
  lastRunAt: text("last_run_at"),
  lastErrorAt: text("last_error_at"),
  lastErrorMessage: text("last_error_message"),
  config: text("config", { mode: "json" }).$type<Record<string, unknown>>(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 5: Marketing System ──

export const blogPosts = sqliteTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  body: text("body").notNull(),
  language: text("language").notNull().default("en"),
  category: text("category"), // pillar, data-driven, comparison, city-specific, problem-solution
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  published: integer("published", { mode: "boolean" }).default(false),
  publishedAt: text("published_at"),
  authorName: text("author_name").default("Calltide"),
  readingTimeMin: integer("reading_time_min"),
  targetKeyword: text("target_keyword"),
  relatedPostSlugs: text("related_post_slugs", { mode: "json" }).$type<string[]>(),
  auditCtaClicks: integer("audit_cta_clicks").default(0),
  pageViews: integer("page_views").default(0),
  pairedPostId: text("paired_post_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const auditRequests = sqliteTable("audit_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessName: text("business_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  businessType: text("business_type"), // plumber, hvac, electrician, landscaper, general_contractor, other
  language: text("language").default("en"),
  prospectId: text("prospect_id"),
  auditCallSid: text("audit_call_sid"),
  auditCallStatus: text("audit_call_status").default("scheduled"), // scheduled, calling, answered, missed, voicemail, failed
  auditCallAnsweredBy: text("audit_call_answered_by"),
  auditCallRingTime: integer("audit_call_ring_time"),
  auditCallCompletedAt: text("audit_call_completed_at"),
  reportSentAt: text("report_sent_at"),
  reportOpenedAt: text("report_opened_at"),
  demoBookedAt: text("demo_booked_at"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const contentQueue = sqliteTable("content_queue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  platform: text("platform").notNull(), // facebook, instagram, linkedin
  language: text("language").notNull().default("en"),
  title: text("title"),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  scheduledFor: text("scheduled_for"),
  publishedAt: text("published_at"),
  status: text("status").default("draft").notNull(), // draft, approved, published
  category: text("category"), // data-drop, maria-demo, client-win, education, behind-the-scenes
  engagementData: text("engagement_data", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 6: Retention + Onboarding QA ──

export const callQaScores = sqliteTable("call_qa_scores", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  callId: text("call_id").notNull().references(() => calls.id),
  businessId: text("business_id").notNull().references(() => businesses.id),
  score: integer("score").notNull(), // 0-100
  breakdown: text("breakdown", { mode: "json" }).$type<{
    greeting: number;
    languageMatch: number;
    needCapture: number;
    actionTaken: number;
    accuracy: number;
    sentiment: number;
  }>(),
  flags: text("flags", { mode: "json" }).$type<string[]>(),
  fixRecommendation: text("fix_recommendation"),
  summary: text("summary"),
  isFirstWeek: integer("is_first_week", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const clientSuccessLog = sqliteTable("client_success_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  eventType: text("event_type").notNull(), // first_week_report, monthly_report, nps_survey_sent, nps_response, milestone, quarterly_review, anniversary, referral_prompt
  eventData: text("event_data", { mode: "json" }).$type<Record<string, unknown>>(),
  emailSentAt: text("email_sent_at"),
  emailOpenedAt: text("email_opened_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const npsResponses = sqliteTable("nps_responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  score: integer("score").notNull(), // 1-10
  classification: text("classification").notNull(), // promoter, passive, detractor
  feedback: text("feedback"),
  followUpAction: text("follow_up_action"),
  escalated: integer("escalated", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  referrerBusinessId: text("referrer_business_id").notNull().references(() => businesses.id),
  referredBusinessId: text("referred_business_id"),
  referralCode: text("referral_code").notNull(),
  status: text("status").default("pending").notNull(), // pending, signed_up, activated, churned, expired
  referrerCreditAmount: integer("referrer_credit_amount").default(497),
  referrerCreditApplied: integer("referrer_credit_applied", { mode: "boolean" }).default(false),
  referrerCreditAppliedAt: text("referrer_credit_applied_at"),
  referredDiscountApplied: integer("referred_discount_applied", { mode: "boolean" }).default(false),
  signedUpAt: text("signed_up_at"),
  activatedAt: text("activated_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 7: Knowledge Base + Help Center ──

export const helpCategories = sqliteTable("help_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  articleCount: integer("article_count").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const helpArticles = sqliteTable("help_articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id").notNull().references(() => helpCategories.id),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  excerpt: text("excerpt"),
  excerptEs: text("excerpt_es"),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  metaTitle: text("meta_title"),
  metaTitleEs: text("meta_title_es"),
  metaDescription: text("meta_description"),
  metaDescriptionEs: text("meta_description_es"),
  relatedArticles: text("related_articles", { mode: "json" }).$type<string[]>(),
  dashboardContextRoutes: text("dashboard_context_routes", { mode: "json" }).$type<string[]>(),
  status: text("status").default("draft"),
  viewCount: integer("view_count").default(0),
  helpfulYes: integer("helpful_yes").default(0),
  helpfulNo: integer("helpful_no").default(0),
  searchKeywords: text("search_keywords"),
  searchKeywordsEs: text("search_keywords_es"),
  readingTimeMinutes: integer("reading_time_minutes").default(3),
  sortOrder: integer("sort_order").default(0),
  publishedAt: text("published_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const helpArticleFeedback = sqliteTable("help_article_feedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  articleId: text("article_id").notNull().references(() => helpArticles.id),
  helpful: integer("helpful", { mode: "boolean" }).notNull(),
  sessionId: text("session_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const helpSearchMisses = sqliteTable("help_search_misses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  query: text("query").notNull(),
  source: text("source").notNull(),
  resultCount: integer("result_count").default(0),
  businessId: text("business_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ── Phase 8: Incident Response + Status Page ──

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  status: text("status").notNull().default("detected"), // detected, investigating, identified, monitoring, resolved, postmortem
  severity: text("severity").notNull().default("minor"), // critical, major, minor, maintenance
  affectedServices: text("affected_services", { mode: "json" }).notNull().$type<string[]>(),
  startedAt: text("started_at").notNull().default(sql`(datetime('now'))`),
  resolvedAt: text("resolved_at"),
  duration: integer("duration"), // seconds
  clientsAffected: integer("clients_affected").default(0),
  estimatedCallsImpacted: integer("estimated_calls_impacted").default(0),
  postmortem: text("postmortem"),
  postmortemEs: text("postmortem_es"),
  postmortemPublished: integer("postmortem_published", { mode: "boolean" }).default(false),
  postmortemScheduledFor: text("postmortem_scheduled_for"),
  createdBy: text("created_by").default("system"), // system or admin
  consecutiveUnhealthyChecks: integer("consecutive_unhealthy_checks").default(0),
  autoMitigationApplied: text("auto_mitigation_applied"), // JSON description of auto-actions taken
  acknowledgedAt: text("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const incidentUpdates = sqliteTable("incident_updates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  incidentId: text("incident_id").notNull().references(() => incidents.id),
  status: text("status").notNull(),
  message: text("message").notNull(),
  messageEs: text("message_es"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const incidentNotifications = sqliteTable("incident_notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  incidentId: text("incident_id").notNull().references(() => incidents.id),
  notificationType: text("notification_type").notNull(), // client_sms, client_email, owner_sms, owner_email, subscriber_email
  recipientId: text("recipient_id"),
  recipientContact: text("recipient_contact"),
  status: text("status").notNull().default("sent"), // sent, delivered, failed
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
});

export const statusPageSubscribers = sqliteTable("status_page_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  language: text("language").notNull().default("en"),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  verificationToken: text("verification_token"),
  subscribedAt: text("subscribed_at").notNull().default(sql`(datetime('now'))`),
  unsubscribedAt: text("unsubscribed_at"),
});

// ── Phase 9: Legal + Compliance ──

export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id"),
  phoneNumber: text("phone_number"),
  consentType: text("consent_type").notNull(), // tos, privacy_policy, dpa, sms_client, sms_caller, call_recording, marketing_email
  documentVersion: text("document_version"),
  status: text("status").notNull().default("active"), // active, revoked
  consentedAt: text("consented_at").notNull(),
  revokedAt: text("revoked_at"),
  revokedMethod: text("revoked_method"), // sms_stop, email_request, dashboard, verbal, admin
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const legalDocuments = sqliteTable("legal_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentType: text("document_type").notNull(), // tos, privacy_policy, dpa
  version: text("version").notNull(),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  effectiveDate: text("effective_date").notNull(),
  supersededDate: text("superseded_date"),
  isCurrentVersion: integer("is_current_version", { mode: "boolean" }).default(true),
  changeSummary: text("change_summary"),
  changeSummaryEs: text("change_summary_es"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const smsOptOuts = sqliteTable("sms_opt_outs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  phoneNumber: text("phone_number").unique().notNull(),
  optedOutAt: text("opted_out_at").notNull(),
  optedOutMethod: text("opted_out_method").notNull(), // sms_stop, email_request, dashboard, admin
  reoptedInAt: text("reopted_in_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const dataRetentionLog = sqliteTable("data_retention_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  dataType: text("data_type").notNull(),
  recordsDeleted: integer("records_deleted").notNull(),
  deletedAt: text("deleted_at").notNull(),
  retentionPeriodDays: integer("retention_period_days").notNull(),
  oldestRecordDate: text("oldest_record_date"),
  newestRecordDate: text("newest_record_date"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const dataDeletionRequests = sqliteTable("data_deletion_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestedBy: text("requested_by").notNull(),
  requestType: text("request_type").notNull(), // gdpr, ccpa, manual, offboarding
  status: text("status").default("received").notNull(), // received, verified, processing, completed, denied
  dataDescription: text("data_description"),
  verifiedAt: text("verified_at"),
  processingStartedAt: text("processing_started_at"),
  completedAt: text("completed_at"),
  deletedRecords: text("deleted_records", { mode: "json" }).$type<Record<string, number>>(),
  denialReason: text("denial_reason"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const subProcessors = sqliteTable("sub_processors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  dataProcessed: text("data_processed", { mode: "json" }).$type<string[]>(),
  location: text("location"),
  dpaUrl: text("dpa_url"),
  dpaStatus: text("dpa_status").default("active"), // active, pending, expired
  lastReviewedAt: text("last_reviewed_at"),
  addedAt: text("added_at").default(sql`(datetime('now'))`),
});

// ── Phase 10: Financial Operations ──

export const paymentEvents = sqliteTable("payment_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").references(() => businesses.id),
  stripeEventId: text("stripe_event_id"),
  eventType: text("event_type").notNull(), // payment_succeeded, payment_failed, refund, etc.
  amount: integer("amount"), // cents
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // succeeded, failed, refunded
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  invoiceId: text("invoice_id"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const subscriptionEvents = sqliteTable("subscription_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").references(() => businesses.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  changeType: text("change_type").notNull(), // created, activated, past_due, recovered, canceled
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  mrr: integer("mrr"), // cents at time of event
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const dunningState = sqliteTable("dunning_state", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  status: text("status").notNull().default("active"), // active, recovered, canceled
  firstFailedAt: text("first_failed_at").notNull(),
  attemptCount: integer("attempt_count").default(1),
  lastFailureCode: text("last_failure_code"),
  email1SentAt: text("email1_sent_at"),
  email2SentAt: text("email2_sent_at"),
  email3SentAt: text("email3_sent_at"),
  smsSentAt: text("sms_sent_at"),
  recoveredAt: text("recovered_at"),
  canceledAt: text("canceled_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const clientCosts = sqliteTable("client_costs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  month: text("month").notNull(), // YYYY-MM
  callMinutes: real("call_minutes").default(0),
  callCount: integer("call_count").default(0),
  smsCount: integer("sms_count").default(0),
  twilioCost: integer("twilio_cost").default(0), // cents
  humeCost: integer("hume_cost").default(0),
  anthropicCost: integer("anthropic_cost").default(0),
  totalCost: integer("total_cost").default(0),
  revenue: integer("revenue").default(49700), // $497
  margin: integer("margin").default(0), // revenue - totalCost
  marginPct: real("margin_pct").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const mrrSnapshots = sqliteTable("mrr_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  mrr: integer("mrr").notNull(), // cents
  arr: integer("arr"), // cents (mrr * 12)
  activeClients: integer("active_clients").default(0),
  pastDueClients: integer("past_due_clients").default(0),
  newClients: integer("new_clients").default(0),
  churnedClients: integer("churned_clients").default(0),
  recoveredClients: integer("recovered_clients").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const processedStripeEvents = sqliteTable("processed_stripe_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  stripeEventId: text("stripe_event_id").unique().notNull(),
  eventType: text("event_type").notNull(),
  processedAt: text("processed_at").notNull().default(sql`(datetime('now'))`),
});

// ── Phase 11: Capacity Planning ──

export const capacitySnapshots = sqliteTable("capacity_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(),
  currentTier: text("current_tier").notNull(), // seed, growth, scale, enterprise, hypergrowth
  activeClients: integer("active_clients").default(0),
  callsToday: integer("calls_today").default(0),
  peakConcurrent: integer("peak_concurrent").default(0),
  // Hume
  humeMinutesMtd: real("hume_minutes_mtd").default(0),
  humePlanMinutes: integer("hume_plan_minutes").default(1200),
  humeConcurrentPeak: integer("hume_concurrent_peak").default(0),
  humeConcurrentLimit: integer("hume_concurrent_limit").default(10),
  // Anthropic
  anthropicTokensMtd: integer("anthropic_tokens_mtd").default(0),
  anthropicRpmPeak: integer("anthropic_rpm_peak").default(0),
  anthropicSpendMtd: integer("anthropic_spend_mtd").default(0), // cents
  // Turso
  tursoRowReadsMtd: integer("turso_row_reads_mtd").default(0),
  tursoRowWritesMtd: integer("turso_row_writes_mtd").default(0),
  tursoStorageMb: real("turso_storage_mb").default(0),
  // Twilio
  twilioCallsToday: integer("twilio_calls_today").default(0),
  twilioErrorCount: integer("twilio_error_count").default(0),
  twilioSuccessRate: real("twilio_success_rate").default(100),
  // Vercel
  vercelFunctionInvocations: integer("vercel_function_invocations").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const capacityAlerts = sqliteTable("capacity_alerts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: text("provider").notNull(),
  metric: text("metric").notNull(),
  severity: text("severity").notNull(), // warning, critical, emergency
  currentValue: real("current_value").notNull(),
  limitValue: real("limit_value").notNull(),
  pctUsed: real("pct_used").notNull(),
  message: text("message").notNull(),
  acknowledged: integer("acknowledged", { mode: "boolean" }).default(false),
  acknowledgedAt: text("acknowledged_at"),
  resolvedAt: text("resolved_at"),
  incidentId: text("incident_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const scalingPlaybook = sqliteTable("scaling_playbook", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tier: text("tier").notNull(), // seed, growth, scale, enterprise, hypergrowth
  clientRange: text("client_range").notNull(),
  provider: text("provider").notNull(),
  action: text("action").notNull(),
  planRequired: text("plan_required"),
  estimatedMonthlyCost: text("estimated_monthly_cost"),
  priority: text("priority").notNull().default("required"), // required, recommended
  completed: integer("completed", { mode: "boolean" }).default(false),
  completedAt: text("completed_at"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ── Phase 12: Integration ──

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text("source").notNull(), // capacity, incident, financial, retention, compliance, agents, knowledge
  severity: text("severity").notNull(), // info, warning, critical, emergency
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  acknowledged: integer("acknowledged", { mode: "boolean" }).default(false),
  acknowledgedAt: text("acknowledged_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const usedMagicTokens = sqliteTable("used_magic_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tokenHash: text("token_hash").unique().notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const outreachLog = sqliteTable("outreach_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull(),
  source: text("source").notNull(), // dunning, churn_agent, success_agent, nudge_agent, incident
  channel: text("channel").notNull(), // email, sms
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
});

// ── Paywall Retargeting Emails ──

export const paywallEmails = sqliteTable("paywall_emails", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  emailNumber: integer("email_number").notNull(), // 1-4
  templateKey: text("template_key").notNull(), // paywall_1, paywall_2, paywall_3, paywall_4
  status: text("status").notNull().default("sent"), // sent, delivered, opened, clicked, bounced, failed
  resendId: text("resend_id"), // Resend email ID for webhook matching
  language: text("language").notNull().default("en"), // en, es
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Weekly Digests ──

export const weeklyDigests = sqliteTable("weekly_digests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  weekStartDate: text("week_start_date").notNull(),
  weekEndDate: text("week_end_date").notNull(),
  stats: text("stats", { mode: "json" }).notNull().$type<{
    totalCalls: number;
    afterHoursCalls: number;
    appointmentsBooked: number;
    estimatedRevenue: number;
    emergencyCalls: number;
    newCustomers: number;
    busiestDay: string;
    busiestDayCount: number;
    prevWeekCalls: number;
    wowChangePercent: number;
    savedEstimate: number;
  }>(),
  emailSentAt: text("email_sent_at"),
  smsSentAt: text("sms_sent_at"),
  resendId: text("resend_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const monthlyDigests = sqliteTable("monthly_digests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  monthKey: text("month_key").notNull(), // e.g. "2026-02"
  monthLabel: text("month_label").notNull(), // e.g. "February 2026"
  stats: text("stats", { mode: "json" }).notNull().$type<{
    totalCalls: number;
    afterHoursCalls: number;
    appointmentsBooked: number;
    estimatedRevenue: number;
    emergencyCalls: number;
    newCustomers: number;
    savedEstimate: number;
    prevMonthCalls: number;
    momChangePercent: number;
    roiMultiple: number;
    costPerLead: number;
    spanishCallPercent: number;
  }>(),
  emailSentAt: text("email_sent_at"),
  smsSentAt: text("sms_sent_at"),
  resendId: text("resend_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Agent Handoffs ──

export const agentHandoffs = sqliteTable("agent_handoffs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromAgent: text("from_agent").notNull(), // churn, success, onboard, qa, health
  toAgent: text("to_agent").notNull(),
  businessId: text("business_id").notNull().references(() => businesses.id),
  reason: text("reason").notNull(),
  context: text("context", { mode: "json" }).$type<Record<string, unknown>>(),
  priority: text("priority").notNull().default("normal"), // normal, high, urgent
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, expired
  expiresAt: text("expires_at").notNull(),
  completedAt: text("completed_at"),
  completedNote: text("completed_note"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Receptionist Custom Responses ──

export const receptionistCustomResponses = sqliteTable("receptionist_custom_responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  category: text("category").notNull(), // faq, off_limits, phrase, emergency_keyword
  triggerText: text("trigger_text").notNull(),
  responseText: text("response_text"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const rateLimitEntries = sqliteTable("rate_limit_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  count: integer("count").notNull().default(1),
  windowStart: text("window_start").notNull().default(sql`(datetime('now'))`),
  windowEnd: text("window_end").notNull(),
});

export const clientFeedback = sqliteTable("client_feedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull(),
  type: text("type").notNull().default("feedback"), // feedback | feature_request | bug_report
  category: text("category").notNull().default("general"), // general | calls | billing | appointments | sms | other
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"), // new | acknowledged | in_progress | resolved | declined
  adminResponse: text("admin_response"),
  adminRespondedAt: text("admin_responded_at"),
  priority: text("priority").default("medium"), // low | medium | high | critical
  votes: integer("votes").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const testimonials = sqliteTable("testimonials", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  ownerName: text("owner_name").notNull(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type"),
  quote: text("quote").notNull(),
  rating: integer("rating"), // 1-5 stars
  npsScore: integer("nps_score"), // original NPS score that triggered the request
  approved: integer("approved", { mode: "boolean" }).default(false),
  featured: integer("featured", { mode: "boolean" }).default(false),
  submittedAt: text("submitted_at").notNull().default(sql`(datetime('now'))`),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Google Review Requests ──

export const reviewRequests = sqliteTable("review_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  appointmentId: text("appointment_id").notNull().references(() => appointments.id),
  leadId: text("lead_id").notNull().references(() => leads.id),
  customerPhone: text("customer_phone").notNull(),
  language: text("language").notNull().default("en"), // en, es
  status: text("status").notNull().default("sent"), // sent, failed, opted_out
  twilioSid: text("twilio_sid"),
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Setup Sessions (Public Hiring Flow) ──

export const setupSessions = sqliteTable("setup_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text("token").unique().notNull().$defaultFn(() => crypto.randomUUID()),
  // Step 1: Business info
  businessName: text("business_name"),
  businessType: text("business_type"),
  city: text("city"),
  state: text("state"),
  services: text("services", { mode: "json" }).$type<string[]>(),
  // Step 2: Contact info
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  // Step 3: Receptionist name
  receptionistName: text("receptionist_name"),
  // Step 4: Personality
  personalityPreset: text("personality_preset"),
  // Step 5: FAQ + off-limits
  faqAnswers: text("faq_answers", { mode: "json" }).$type<Record<string, string>>(),
  offLimits: text("off_limits", { mode: "json" }).$type<Record<string, boolean>>(),
  // Step 6: Plan selection
  selectedPlan: text("selected_plan"), // monthly | annual
  // Flow tracking
  currentStep: integer("current_step").notNull().default(1),
  maxStepReached: integer("max_step_reached").notNull().default(1),
  status: text("status").notNull().default("active"), // active, converted, abandoned
  // Linked records
  prospectId: text("prospect_id"),
  businessId: text("business_id"),
  // UTM + referral tracking
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  refCode: text("ref_code"),
  // Locale
  language: text("language").notNull().default("en"),
  // Timestamps
  lastActiveAt: text("last_active_at").notNull().default(sql`(datetime('now'))`),
  convertedAt: text("converted_at"),
  abandonedAt: text("abandoned_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const setupRetargetEmails = sqliteTable("setup_retarget_emails", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  setupSessionId: text("setup_session_id").notNull().references(() => setupSessions.id),
  emailNumber: integer("email_number").notNull(), // 1-4
  templateKey: text("template_key").notNull(),
  status: text("status").notNull().default("sent"), // sent, delivered, opened, clicked, bounced, failed
  resendId: text("resend_id"),
  language: text("language").notNull().default("en"),
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const demoSessions = sqliteTable("demo_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ipHash: text("ip_hash").notNull(),
  startedAt: text("started_at").notNull().default(sql`(datetime('now'))`),
  endedAt: text("ended_at"),
  durationSeconds: integer("duration_seconds"),
  businessType: text("business_type"),
  businessName: text("business_name"),
  businessSize: text("business_size"),
  painPoint: text("pain_point"),
  reachedROI: integer("reached_roi", { mode: "boolean" }).default(false),
  reachedRoleplay: integer("reached_roleplay", { mode: "boolean" }).default(false),
  reachedClose: integer("reached_close", { mode: "boolean" }).default(false),
  convertedToSignup: integer("converted_to_signup", { mode: "boolean" }).default(false),
  language: text("language").default("en"),
  userAgent: text("user_agent"),
  estimatedMonthlyLoss: integer("estimated_monthly_loss"),
});

// ── Retry Queue ──
// Stores failed async operations for retry with exponential backoff.
export const pendingJobs = sqliteTable("pending_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // "twilio_provision" | "call_summary" | "consent_record" | "email_send"
  payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "failed"
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  lastError: text("last_error"),
  nextRetryAt: text("next_retry_at").notNull().default(sql`(datetime('now'))`),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

// ── Trade Intake Engine ──
// Structured qualifying questions per trade that Maria uses during calls.

export const tradeIntakeTemplates = sqliteTable("trade_intake_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tradeType: text("trade_type").notNull(),
  scopeLevel: text("scope_level").notNull().default("residential"), // residential | commercial
  questionOrder: integer("question_order").notNull(),
  questionKey: text("question_key").notNull(),
  questionText: text("question_text").notNull(),
  questionTextEs: text("question_text_es").notNull(),
  fieldType: text("field_type").notNull().default("text"), // text | number | select | boolean
  optionsJson: text("options_json", { mode: "json" }).$type<string[]>(),
  required: integer("required", { mode: "boolean" }).notNull().default(true),
  helpText: text("help_text"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const jobIntakes = sqliteTable("job_intakes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  callId: text("call_id").references(() => calls.id),
  leadId: text("lead_id").references(() => leads.id),
  tradeType: text("trade_type").notNull(),
  scopeLevel: text("scope_level").notNull().default("residential"),
  answersJson: text("answers_json", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  scopeDescription: text("scope_description"),
  urgency: text("urgency").default("normal"), // emergency | urgent | normal | flexible
  intakeComplete: integer("intake_complete", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const customIntakeQuestions = sqliteTable("custom_intake_questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("business_id").notNull().references(() => businesses.id),
  questionOrder: integer("question_order").notNull(),
  questionKey: text("question_key").notNull(),
  questionText: text("question_text").notNull(),
  questionTextEs: text("question_text_es").notNull(),
  fieldType: text("field_type").notNull().default("text"),
  optionsJson: text("options_json", { mode: "json" }).$type<string[]>(),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
