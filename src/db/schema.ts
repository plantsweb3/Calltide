import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
  avgJobValue: integer("avg_job_value").default(250), // average $ per appointment for revenue estimates
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  referralCode: text("referral_code").unique(),
  healthScore: integer("health_score").default(50),
  lastNpsScore: integer("last_nps_score"),
  lastNpsDate: text("last_nps_date"),
  onboardingQaGrade: text("onboarding_qa_grade"), // A/B/C/D/F
  onboardingQaCompleteAt: text("onboarding_qa_complete_at"),
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
  status: text("status").default("draft"), // draft, approved, published
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
  status: text("status").default("pending"), // pending, signed_up, activated, churned, expired
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
