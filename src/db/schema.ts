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
  active: integer("active", { mode: "boolean" }).notNull().default(true),
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
