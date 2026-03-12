import { db } from "@/db";
import {
  calls, leads, appointments, customers,
  jobCards, smsMessages, businessContextNotes,
  businesses,
} from "@/db/schema";
import { eq, and, desc, gte, sql, count, ne, or, like } from "drizzle-orm";
import { z } from "zod";
import { getWeather } from "./weather";
import { searchHelp } from "./help-kb";
import { checkAvailability } from "@/lib/calendar/availability";
import { reportError } from "@/lib/error-reporting";
import type { BusinessContext } from "@/types";
import type Anthropic from "@anthropic-ai/sdk";

// ── Tool Definitions for Anthropic API ──

export const MARIA_TOOLS: Anthropic.Tool[] = [
  // 1. Morning briefing
  {
    name: "get_morning_briefing",
    description: "Get today's business overview: calls today, appointments, pending estimates, recent activity. Use when the owner asks about their day, how things are going, or for a summary.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  // 2. Recent leads
  {
    name: "get_recent_leads",
    description: "Get the most recent leads/callers with their details. Use when asked about recent calls, new leads, or who called.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Number of leads to return (default 5, max 20)" },
      },
      required: [],
    },
  },
  // 3. Today's schedule
  {
    name: "get_todays_schedule",
    description: "Get today's confirmed appointments. Use when asked about today's schedule, upcoming appointments, or what's on the calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "ISO date (YYYY-MM-DD). Defaults to today." },
      },
      required: [],
    },
  },
  // 4. Check availability
  {
    name: "check_availability",
    description: "Check open appointment slots for a specific date. Use when the owner wants to see availability or schedule something.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "ISO date to check (YYYY-MM-DD)" },
      },
      required: ["date"],
    },
  },
  // 5. Block time
  {
    name: "block_time",
    description: "Block a time slot by creating a 'blocked' appointment. Use when the owner says they need time off, a lunch break, or want to block their calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "ISO date (YYYY-MM-DD)" },
        time: { type: "string", description: "24h time (HH:MM)" },
        duration: { type: "number", description: "Duration in minutes (default 60)" },
        reason: { type: "string", description: "Why they're blocking (e.g. 'Lunch', 'Personal')" },
      },
      required: ["date", "time"],
    },
  },
  // 6. Move appointment
  {
    name: "move_appointment",
    description: "Reschedule an appointment to a new date/time. Use when the owner wants to move or reschedule an appointment.",
    input_schema: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "string", description: "The appointment ID to move" },
        new_date: { type: "string", description: "New ISO date (YYYY-MM-DD)" },
        new_time: { type: "string", description: "New 24h time (HH:MM)" },
      },
      required: ["appointment_id", "new_date", "new_time"],
    },
  },
  // 7. Cancel appointment (requires explicit instruction)
  {
    name: "cancel_appointment",
    description: "Cancel an appointment. ONLY use when the owner explicitly says to cancel. Never cancel proactively.",
    input_schema: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "string", description: "The appointment ID to cancel" },
        reason: { type: "string", description: "Reason for cancellation" },
      },
      required: ["appointment_id"],
    },
  },
  // 8. Business stats
  {
    name: "get_business_stats",
    description: "Get business performance metrics: call counts, appointment rate, estimate conversion, revenue estimates. Use when asked about performance, stats, how they're doing, or ROI.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: { type: "string", description: "Time period: 'today', 'week', 'month', '30days' (default 'week')" },
      },
      required: [],
    },
  },
  // 9. Customer lookup
  {
    name: "lookup_customer",
    description: "Look up a customer by name or phone number. Use when the owner asks about a specific person or caller.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Customer name or phone number to search" },
      },
      required: ["query"],
    },
  },
  // 10. Pending estimates
  {
    name: "get_pending_estimates",
    description: "Get estimates waiting for review or follow-up. Use when asked about pending quotes, estimates to review, or open proposals.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by status: 'pending_review', 'sent', 'all' (default 'all')" },
      },
      required: [],
    },
  },
  // 11. Weather
  {
    name: "get_weather",
    description: "Get current weather and forecast with trade-specific advisories. Use when asked about weather or to proactively share relevant weather impacts.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: { type: "string", description: "City and state (e.g. 'San Antonio, TX'). Uses business service area if not specified." },
      },
      required: [],
    },
  },
  // 12. Save note
  {
    name: "save_note",
    description: "Save a context note or preference about the business. Use when the owner tells you something you should remember (preferences, instructions, business context).",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "The note content to remember" },
        category: { type: "string", description: "'preference', 'context', 'instruction', or 'insight'" },
      },
      required: ["content"],
    },
  },
  // 13. Get notes
  {
    name: "get_notes",
    description: "Retrieve saved context notes about this business. Use to recall owner preferences or important context.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Filter by category: 'preference', 'context', 'instruction', 'insight', or 'all'" },
      },
      required: [],
    },
  },
  // 14. Capta help search
  {
    name: "search_capta_help",
    description: "Search Capta's help articles to answer questions about features, billing, troubleshooting, or how things work. Use when the owner asks how to do something in Capta.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query about Capta features or how-to" },
      },
      required: ["query"],
    },
  },
  // 15. Job cards
  {
    name: "get_job_cards",
    description: "Get recent job cards with intake details, estimates, and photo counts. Use when asked about jobs, work orders, or intake details.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "'pending_review', 'confirmed', 'adjusted', 'declined', or 'all'" },
        limit: { type: "number", description: "Number of job cards (default 5, max 20)" },
      },
      required: [],
    },
  },
  // 16. Call history
  {
    name: "get_call_history",
    description: "Get recent call history with summaries and outcomes. Use when asked about recent calls or call details.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Number of calls (default 10, max 30)" },
        direction: { type: "string", description: "'inbound', 'outbound', or 'all'" },
      },
      required: [],
    },
  },
  // 17. SMS history
  {
    name: "get_sms_history",
    description: "Get recent SMS messages sent/received. Use when asked about text messages or communication history.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Number of messages (default 10, max 30)" },
        phone: { type: "string", description: "Filter by phone number" },
      },
      required: [],
    },
  },
  // 18. Activate business (onboarding)
  {
    name: "activate_business",
    description: "Activate the business so it starts receiving calls. Use ONLY when the owner confirms they have set up call forwarding (e.g. 'I set up forwarding', 'it's working', 'calls are forwarding', 'done'). This is a one-time action during onboarding.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ── Zod Schemas for Tool Params ──

const RecentLeadsSchema = z.object({
  limit: z.number().min(1).max(20).optional(),
});

const TodaysScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
});

const CheckAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

const BlockTimeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  duration: z.number().min(1).max(480).optional(),
  reason: z.string().max(200).optional(),
});

const MoveAppointmentSchema = z.object({
  appointment_id: z.string().min(1),
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  new_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
});

const CancelAppointmentSchema = z.object({
  appointment_id: z.string().min(1),
  reason: z.string().max(500).optional(),
});

const BusinessStatsSchema = z.object({
  period: z.enum(["today", "week", "month", "30days"]).optional(),
});

const LookupCustomerSchema = z.object({
  query: z.string().min(1),
});

const PendingEstimatesSchema = z.object({
  status: z.enum(["pending_review", "sent", "all"]).optional(),
});

const WeatherSchema = z.object({
  location: z.string().max(200).optional(),
});

const SaveNoteSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.enum(["preference", "context", "instruction", "insight"]).optional(),
});

const GetNotesSchema = z.object({
  category: z.enum(["preference", "context", "instruction", "insight", "all"]).optional(),
});

const SearchCaptaHelpSchema = z.object({
  query: z.string().min(1).max(500),
});

const JobCardsSchema = z.object({
  status: z.enum(["pending_review", "confirmed", "adjusted", "declined", "all"]).optional(),
  limit: z.number().min(1).max(20).optional(),
});

const CallHistorySchema = z.object({
  limit: z.number().min(1).max(30).optional(),
  direction: z.enum(["inbound", "outbound", "all"]).optional(),
});

const SmsHistorySchema = z.object({
  limit: z.number().min(1).max(30).optional(),
  phone: z.string().optional(),
});

// ── Tool Handlers ──

export async function handleToolCall(
  toolName: string,
  input: Record<string, unknown>,
  biz: BusinessContext,
  businessId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "get_morning_briefing":
        // No params to validate
        return await getMorningBriefing(businessId, biz);

      case "get_recent_leads": {
        const parsed = RecentLeadsSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getRecentLeads(businessId, parsed.data.limit);
      }

      case "get_todays_schedule": {
        const parsed = TodaysScheduleSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getTodaysSchedule(businessId, biz, parsed.data.date);
      }

      case "check_availability": {
        const parsed = CheckAvailabilitySchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await checkAvailabilityTool(biz, parsed.data.date);
      }

      case "block_time": {
        const parsed = BlockTimeSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await blockTime(businessId, parsed.data);
      }

      case "move_appointment": {
        const parsed = MoveAppointmentSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await moveAppointment(biz, parsed.data);
      }

      case "cancel_appointment": {
        const parsed = CancelAppointmentSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await cancelAppointment(businessId, parsed.data);
      }

      case "get_business_stats": {
        const parsed = BusinessStatsSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getBusinessStats(businessId, biz, parsed.data.period);
      }

      case "lookup_customer": {
        const parsed = LookupCustomerSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await lookupCustomer(businessId, parsed.data.query);
      }

      case "get_pending_estimates": {
        const parsed = PendingEstimatesSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getPendingEstimates(businessId, parsed.data.status);
      }

      case "get_weather": {
        const parsed = WeatherSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getWeatherTool(biz, parsed.data.location);
      }

      case "save_note": {
        const parsed = SaveNoteSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await saveNote(businessId, parsed.data);
      }

      case "get_notes": {
        const parsed = GetNotesSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getNotes(businessId, parsed.data.category);
      }

      case "search_capta_help": {
        const parsed = SearchCaptaHelpSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await searchCaptaHelp(parsed.data.query);
      }

      case "get_job_cards": {
        const parsed = JobCardsSchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getJobCards(businessId, parsed.data);
      }

      case "get_call_history": {
        const parsed = CallHistorySchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getCallHistory(businessId, parsed.data);
      }

      case "get_sms_history": {
        const parsed = SmsHistorySchema.safeParse(input);
        if (!parsed.success) return JSON.stringify({ error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}` });
        return await getSmsHistory(businessId, parsed.data);
      }

      case "activate_business":
        // No params to validate
        return await activateBusiness(businessId);

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    reportError(`Maria tool error: ${toolName}`, err, { extra: { businessId } });
    return JSON.stringify({ error: "Something went wrong. Please try again." });
  }
}

// ── Individual Tool Implementations ──

function todayISO(timezone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

function periodStart(period: string, tz: string): string {
  const now = new Date();
  switch (period) {
    case "today":
      return todayISO(tz);
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split("T")[0];
    }
    case "month":
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.toISOString().split("T")[0];
    }
    default:
      return new Date(now.setDate(now.getDate() - 7)).toISOString().split("T")[0];
  }
}

async function getMorningBriefing(businessId: string, biz: BusinessContext): Promise<string> {
  const today = todayISO(biz.timezone);

  const [todayCalls, todayAppts, pendingCards, recentCalls] = await Promise.all([
    db.select({ cnt: count() }).from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, today))),
    db.select().from(appointments)
      .where(and(eq(appointments.businessId, businessId), eq(appointments.date, today), ne(appointments.status, "cancelled")))
      .orderBy(appointments.time),
    db.select({ cnt: count() }).from(jobCards)
      .where(and(eq(jobCards.businessId, businessId), eq(jobCards.status, "pending_review"))),
    db.select({ cnt: count() }).from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, periodStart("week", biz.timezone)))),
  ]);

  const callsToday = todayCalls[0]?.cnt ?? 0;
  const callsThisWeek = recentCalls[0]?.cnt ?? 0;
  const pendingReview = pendingCards[0]?.cnt ?? 0;

  const apptList = todayAppts.map((a) => ({
    time: a.time,
    service: a.service,
    status: a.status,
    id: a.id,
  }));

  return JSON.stringify({
    date: today,
    callsToday,
    callsThisWeek,
    appointmentsToday: apptList,
    jobCardsPendingReview: pendingReview,
  });
}

async function getRecentLeads(businessId: string, limit?: number): Promise<string> {
  const n = Math.min(limit || 5, 20);
  const rows = await db.select({
    id: leads.id,
    phone: leads.phone,
    name: leads.name,
    source: leads.source,
    createdAt: leads.createdAt,
  })
    .from(leads)
    .where(eq(leads.businessId, businessId))
    .orderBy(desc(leads.createdAt))
    .limit(n);

  return JSON.stringify({ leads: rows });
}

async function getTodaysSchedule(businessId: string, biz: BusinessContext, date?: string): Promise<string> {
  const target = date || todayISO(biz.timezone);
  const rows = await db.select({
    id: appointments.id,
    service: appointments.service,
    date: appointments.date,
    time: appointments.time,
    duration: appointments.duration,
    status: appointments.status,
    notes: appointments.notes,
    leadId: appointments.leadId,
  })
    .from(appointments)
    .where(and(eq(appointments.businessId, businessId), eq(appointments.date, target)))
    .orderBy(appointments.time);

  // Batch-fetch lead names for all appointments
  const leadIds = [...new Set(rows.map((a) => a.leadId).filter(Boolean))];
  const leadMap = new Map<string, { name: string | null; phone: string | null }>();
  if (leadIds.length > 0) {
    const leadRows = await db.select({ id: leads.id, name: leads.name, phone: leads.phone })
      .from(leads)
      .where(or(...leadIds.map((id) => eq(leads.id, id))));
    for (const l of leadRows) {
      leadMap.set(l.id, { name: l.name, phone: l.phone });
    }
  }

  const enriched = rows.map((a) => {
    const lead = leadMap.get(a.leadId);
    return { ...a, customerName: lead?.name, customerPhone: lead?.phone };
  });

  return JSON.stringify({ date: target, appointments: enriched });
}

async function checkAvailabilityTool(biz: BusinessContext, date: string): Promise<string> {
  const slots = await checkAvailability(biz, date);
  const available = slots.filter((s) => s.available);
  return JSON.stringify({ date, availableSlots: available, totalSlots: slots.length });
}

async function blockTime(
  businessId: string,
  input: { date: string; time: string; duration?: number; reason?: string }
): Promise<string> {
  // Create a "blocked" lead placeholder for the block
  const [blockedLead] = await db.select().from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.phone, "blocked")))
    .limit(1);

  let leadId: string;
  if (blockedLead) {
    leadId = blockedLead.id;
  } else {
    const [newLead] = await db.insert(leads).values({
      businessId,
      phone: "blocked",
      name: "Time Block",
      source: "manual",
    }).returning();
    leadId = newLead.id;
  }

  const [apt] = await db.insert(appointments).values({
    businessId,
    leadId,
    service: input.reason || "Time Block",
    date: input.date,
    time: input.time,
    duration: input.duration || 60,
    status: "confirmed",
    notes: `Blocked by owner: ${input.reason || "Personal"}`,
  }).returning();

  return JSON.stringify({ success: true, appointmentId: apt.id, message: `Time blocked on ${input.date} at ${input.time}` });
}

async function moveAppointment(
  biz: BusinessContext,
  input: { appointment_id: string; new_date: string; new_time: string }
): Promise<string> {
  // Verify appointment exists and belongs to business
  const [apt] = await db.select().from(appointments)
    .where(and(eq(appointments.id, input.appointment_id), eq(appointments.businessId, biz.id)))
    .limit(1);

  if (!apt) return JSON.stringify({ error: "Appointment not found" });
  if (apt.status === "cancelled") return JSON.stringify({ error: "Cannot move a cancelled appointment" });

  // Check availability at new time
  const slots = await checkAvailability(biz, input.new_date);
  const targetSlot = slots.find((s) => s.time === input.new_time);
  if (targetSlot && !targetSlot.available) {
    return JSON.stringify({ error: `Time slot ${input.new_time} on ${input.new_date} is already booked` });
  }

  await db.update(appointments).set({
    date: input.new_date,
    time: input.new_time,
    updatedAt: new Date().toISOString(),
  }).where(eq(appointments.id, input.appointment_id));

  return JSON.stringify({
    success: true,
    message: `Appointment moved from ${apt.date} ${apt.time} to ${input.new_date} ${input.new_time}`,
  });
}

async function cancelAppointment(
  businessId: string,
  input: { appointment_id: string; reason?: string }
): Promise<string> {
  const [apt] = await db.select().from(appointments)
    .where(and(eq(appointments.id, input.appointment_id), eq(appointments.businessId, businessId)))
    .limit(1);

  if (!apt) return JSON.stringify({ error: "Appointment not found" });
  if (apt.status === "cancelled") return JSON.stringify({ error: "Already cancelled" });

  await db.update(appointments).set({
    status: "cancelled",
    notes: apt.notes ? `${apt.notes} | Cancelled: ${input.reason || "Owner request"}` : `Cancelled: ${input.reason || "Owner request"}`,
    updatedAt: new Date().toISOString(),
  }).where(eq(appointments.id, input.appointment_id));

  return JSON.stringify({
    success: true,
    message: `Appointment on ${apt.date} at ${apt.time} cancelled.`,
  });
}

async function getBusinessStats(businessId: string, biz: BusinessContext, period?: string): Promise<string> {
  const p = period || "week";
  const start = periodStart(p, biz.timezone);

  const [callCount, appointmentCount, estimateCount, customerCount] = await Promise.all([
    db.select({ cnt: count() }).from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, start))),
    db.select({ cnt: count() }).from(appointments)
      .where(and(eq(appointments.businessId, businessId), gte(appointments.createdAt, start), ne(appointments.status, "cancelled"))),
    db.select({ cnt: count() }).from(jobCards)
      .where(and(eq(jobCards.businessId, businessId), gte(jobCards.createdAt, start))),
    db.select({ cnt: count() }).from(customers)
      .where(and(eq(customers.businessId, businessId), gte(customers.createdAt, start))),
  ]);

  const avgJobValue = 250; // default estimate per job

  return JSON.stringify({
    period: p,
    since: start,
    calls: callCount[0]?.cnt ?? 0,
    appointments: appointmentCount[0]?.cnt ?? 0,
    jobCards: estimateCount[0]?.cnt ?? 0,
    newCustomers: customerCount[0]?.cnt ?? 0,
    estimatedRevenue: (appointmentCount[0]?.cnt ?? 0) * avgJobValue,
  });
}

async function lookupCustomer(businessId: string, query: string): Promise<string> {
  const normalizedQuery = query.trim();
  const queryDigits = normalizedQuery.replace(/\D/g, "");

  // Build SQL conditions — search by name or phone at the DB level
  const searchConditions = [eq(customers.businessId, businessId)];
  const matchConditions = [];

  if (normalizedQuery.length > 0) {
    matchConditions.push(like(customers.name, `%${normalizedQuery}%`));
  }
  if (queryDigits.length >= 4) {
    matchConditions.push(like(customers.phone, `%${queryDigits}%`));
  }

  if (matchConditions.length === 0) {
    return JSON.stringify({ found: false, message: `No customer found matching "${query}"` });
  }

  const matches = await db.select({
    id: customers.id,
    name: customers.name,
    phone: customers.phone,
    email: customers.email,
    totalCalls: customers.totalCalls,
    totalAppointments: customers.totalAppointments,
    lastCallAt: customers.lastCallAt,
    tags: customers.tags,
    notes: customers.notes,
  })
    .from(customers)
    .where(and(...searchConditions, or(...matchConditions)))
    .limit(5);

  if (matches.length === 0) {
    return JSON.stringify({ found: false, message: `No customer found matching "${query}"` });
  }

  return JSON.stringify({ found: true, customers: matches });
}

async function getPendingEstimates(businessId: string, status?: string): Promise<string> {
  const filter = status === "pending_review"
    ? eq(jobCards.status, "pending_review")
    : status === "sent"
      ? eq(jobCards.status, "confirmed")
      : undefined;

  const conditions = [eq(jobCards.businessId, businessId)];
  if (filter) conditions.push(filter);

  const cards = await db.select({
    id: jobCards.id,
    callerName: jobCards.callerName,
    callerPhone: jobCards.callerPhone,
    jobTypeLabel: jobCards.jobTypeLabel,
    estimateMin: jobCards.estimateMin,
    estimateMax: jobCards.estimateMax,
    status: jobCards.status,
    photoCount: jobCards.photoCount,
    createdAt: jobCards.createdAt,
  })
    .from(jobCards)
    .where(and(...conditions))
    .orderBy(desc(jobCards.createdAt))
    .limit(10);

  return JSON.stringify({ estimates: cards });
}

async function getWeatherTool(biz: BusinessContext, location?: string): Promise<string> {
  const loc = location || biz.serviceArea || "San Antonio, TX";
  const result = await getWeather(loc, biz.type);

  if (!result) {
    return JSON.stringify({ error: "Could not fetch weather data. Try specifying a city and state." });
  }

  return JSON.stringify({
    location: result.location,
    current: {
      temperature: result.weather.temperature,
      feelsLike: result.weather.feelsLike,
      description: result.weather.description,
      humidity: result.weather.humidity,
      windSpeed: result.weather.windSpeed,
    },
    today: {
      high: result.weather.highToday,
      low: result.weather.lowToday,
      precipitationChance: result.weather.precipitationChance,
    },
    tomorrow: {
      high: result.weather.highTomorrow,
      low: result.weather.lowTomorrow,
      precipitationChance: result.weather.precipChanceTomorrow,
    },
    tradeAdvisory: result.advisory,
  });
}

async function saveNote(
  businessId: string,
  input: { content: string; category?: string }
): Promise<string> {
  const category = input.category || "context";
  await db.insert(businessContextNotes).values({
    businessId,
    category,
    content: input.content,
    source: "chat",
  });

  return JSON.stringify({ success: true, message: "Got it, I'll remember that." });
}

async function getNotes(businessId: string, category?: string): Promise<string> {
  const conditions = [eq(businessContextNotes.businessId, businessId)];
  if (category && category !== "all") {
    conditions.push(eq(businessContextNotes.category, category));
  }

  const notes = await db.select({
    id: businessContextNotes.id,
    category: businessContextNotes.category,
    content: businessContextNotes.content,
    source: businessContextNotes.source,
    createdAt: businessContextNotes.createdAt,
  })
    .from(businessContextNotes)
    .where(and(...conditions))
    .orderBy(desc(businessContextNotes.createdAt))
    .limit(20);

  return JSON.stringify({ notes });
}

async function searchCaptaHelp(query: string): Promise<string> {
  const results = await searchHelp(query);

  if (results.length === 0) {
    return JSON.stringify({
      found: false,
      message: "No help articles found. For specific questions, contact support@capta.app",
    });
  }

  // Return condensed content — first 500 chars per article
  return JSON.stringify({
    found: true,
    articles: results.map((r) => ({
      title: r.title,
      category: r.category,
      content: r.content.slice(0, 500) + (r.content.length > 500 ? "..." : ""),
    })),
  });
}

async function getJobCards(
  businessId: string,
  input: { status?: string; limit?: number }
): Promise<string> {
  const n = Math.min(input.limit || 5, 20);
  const conditions = [eq(jobCards.businessId, businessId)];
  if (input.status && input.status !== "all") {
    conditions.push(eq(jobCards.status, input.status));
  }

  const cards = await db.select({
    id: jobCards.id,
    callerName: jobCards.callerName,
    callerPhone: jobCards.callerPhone,
    jobTypeLabel: jobCards.jobTypeLabel,
    scopeDescription: jobCards.scopeDescription,
    estimateMin: jobCards.estimateMin,
    estimateMax: jobCards.estimateMax,
    status: jobCards.status,
    ownerResponse: jobCards.ownerResponse,
    photoCount: jobCards.photoCount,
    createdAt: jobCards.createdAt,
  })
    .from(jobCards)
    .where(and(...conditions))
    .orderBy(desc(jobCards.createdAt))
    .limit(n);

  return JSON.stringify({ jobCards: cards });
}

async function getCallHistory(
  businessId: string,
  input: { limit?: number; direction?: string }
): Promise<string> {
  const n = Math.min(input.limit || 10, 30);
  const conditions = [eq(calls.businessId, businessId)];
  if (input.direction && input.direction !== "all") {
    conditions.push(eq(calls.direction, input.direction));
  }

  const rows = await db.select({
    id: calls.id,
    direction: calls.direction,
    callerPhone: calls.callerPhone,
    status: calls.status,
    duration: calls.duration,
    language: calls.language,
    summary: calls.summary,
    sentiment: calls.sentiment,
    outcome: calls.outcome,
    createdAt: calls.createdAt,
  })
    .from(calls)
    .where(and(...conditions))
    .orderBy(desc(calls.createdAt))
    .limit(n);

  return JSON.stringify({ calls: rows });
}

async function getSmsHistory(
  businessId: string,
  input: { limit?: number; phone?: string }
): Promise<string> {
  const n = Math.min(input.limit || 10, 30);
  const conditions = [eq(smsMessages.businessId, businessId)];
  if (input.phone) {
    // Match either from or to
    conditions.push(
      sql`(${smsMessages.fromNumber} = ${input.phone} OR ${smsMessages.toNumber} = ${input.phone})`
    );
  }

  const rows = await db.select({
    id: smsMessages.id,
    direction: smsMessages.direction,
    fromNumber: smsMessages.fromNumber,
    toNumber: smsMessages.toNumber,
    body: smsMessages.body,
    templateType: smsMessages.templateType,
    createdAt: smsMessages.createdAt,
  })
    .from(smsMessages)
    .where(and(...conditions))
    .orderBy(desc(smsMessages.createdAt))
    .limit(n);

  return JSON.stringify({ messages: rows });
}

async function activateBusiness(businessId: string): Promise<string> {
  const [biz] = await db
    .select({ active: businesses.active, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) return JSON.stringify({ error: "Business not found" });
  if (biz.active) return JSON.stringify({ success: true, message: "Business is already active!" });

  await db
    .update(businesses)
    .set({
      active: true,
      onboardingCompletedAt: new Date().toISOString(),
      onboardingStatus: "completed",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, businessId));

  // Import lazily to avoid circular deps
  const { logActivity } = await import("@/lib/activity");
  const { createNotification } = await import("@/lib/notifications");

  await logActivity({
    type: "business_activated",
    entityType: "business",
    entityId: businessId,
    title: `${biz.name} activated via SMS`,
    detail: "Owner confirmed call forwarding — Maria activated business via text.",
  });

  await createNotification({
    source: "agents",
    severity: "info",
    title: "Business activated via Maria SMS",
    message: `${biz.name} is now live — owner confirmed forwarding via text.`,
    actionUrl: "/admin/clients",
  });

  return JSON.stringify({
    success: true,
    message: `${biz.name} is now active! I'll start answering calls immediately.`,
  });
}
