import { db } from "@/db";
import {
  calls,
  appointments,
  jobCards,
  jobIntakes,
  customers,
  leads,
} from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { getBusinessDateRange } from "@/lib/timezone";

export interface NewLead {
  callerName: string;
  callerPhone: string;
  jobType: string;
  scopeLevel: string;
  estimateRange: string | null;
  urgency: string;
  status: string;
  photoCount: number;
}

export interface TomorrowAppointment {
  customerName: string;
  time: string;
  jobType: string;
  address: string | null;
}

export interface ActionItem {
  type: "pending_job_card" | "missed_callback" | "appointment_tomorrow" | "review_request";
  description: string;
  callerPhone?: string;
}

export interface DigestData {
  totalCalls: number;
  callBreakdown: {
    newLeads: NewLead[];
    existingCustomers: Array<{ callerName: string; reason: string }>;
    suppliers: Array<{ callerName: string; reason: string }>;
    missed: number;
    spam: number;
  };
  appointmentsBooked: number;
  tomorrowAppointments: TomorrowAppointment[];
  pendingJobCards: number;
  confirmedToday: number;
  totalEstimateValue: { min: number; max: number } | null;
  estimatedRevenueCaptured: number | null;
  actionItems: ActionItem[];
}

const SUPPLIER_KEYWORDS = ["order", "delivery", "supply", "material", "schedule pickup", "shipment", "inventory", "warehouse"];

/**
 * Aggregate all data for a business's daily digest.
 */
export async function aggregateDailyDigest(
  businessId: string,
  timezone: string,
): Promise<DigestData> {
  const todayRange = getBusinessDateRange(timezone, 0);
  const tomorrowRange = getBusinessDateRange(timezone, 1);

  // Fetch all today's calls + job intakes + job cards in parallel
  const [todayCalls, todayIntakes, todayJobCards, tomorrowAppts, pendingCards, monthConfirmed] = await Promise.all([
    db.select().from(calls).where(
      and(
        eq(calls.businessId, businessId),
        gte(calls.createdAt, todayRange.start),
        lt(calls.createdAt, todayRange.end),
      ),
    ),
    db.select().from(jobIntakes).where(
      and(
        eq(jobIntakes.businessId, businessId),
        gte(jobIntakes.createdAt, todayRange.start),
        lt(jobIntakes.createdAt, todayRange.end),
      ),
    ),
    db.select().from(jobCards).where(
      and(
        eq(jobCards.businessId, businessId),
        gte(jobCards.createdAt, todayRange.start),
        lt(jobCards.createdAt, todayRange.end),
      ),
    ),
    // Tomorrow's appointments
    db.select({
      id: appointments.id,
      service: appointments.service,
      date: appointments.date,
      time: appointments.time,
      leadId: appointments.leadId,
    }).from(appointments).where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.date, tomorrowRange.dateStr),
        sql`${appointments.status} != 'cancelled'`,
      ),
    ),
    // Pending job cards (any date, not just today)
    db.select({ id: jobCards.id }).from(jobCards).where(
      and(
        eq(jobCards.businessId, businessId),
        eq(jobCards.status, "pending_review"),
      ),
    ),
    // Confirmed job cards this month for revenue calculation
    db.select({
      estimateMin: jobCards.estimateMin,
      estimateMax: jobCards.estimateMax,
      ownerAdjustedMin: jobCards.ownerAdjustedMin,
      ownerAdjustedMax: jobCards.ownerAdjustedMax,
    }).from(jobCards).where(
      and(
        eq(jobCards.businessId, businessId),
        sql`${jobCards.status} IN ('confirmed', 'adjusted')`,
        gte(jobCards.createdAt, getMonthStart(timezone)),
      ),
    ),
  ]);

  // Get existing customer phones for categorization
  const existingCustomerPhones = new Set<string>();
  const custRows = await db
    .select({ phone: customers.phone })
    .from(customers)
    .where(
      and(
        eq(customers.businessId, businessId),
        sql`${customers.deletedAt} IS NULL`,
        sql`${customers.totalCalls} > 1`,
      ),
    );
  for (const c of custRows) {
    existingCustomerPhones.add(c.phone);
  }

  // Build intake/jobCard lookups by callId
  const intakeByCallId = new Map<string, typeof todayIntakes[0]>();
  for (const intake of todayIntakes) {
    if (intake.callId) intakeByCallId.set(intake.callId, intake);
  }
  const jobCardByCallId = new Map<string, typeof todayJobCards[0]>();
  for (const card of todayJobCards) {
    if (card.callId) jobCardByCallId.set(card.callId, card);
  }

  // Categorize calls
  const newLeads: NewLead[] = [];
  const existingCustomerCalls: Array<{ callerName: string; reason: string }> = [];
  const supplierCalls: Array<{ callerName: string; reason: string }> = [];
  let missed = 0;
  let spam = 0;

  for (const call of todayCalls) {
    // Spam
    if (call.outcome === "spam") {
      spam++;
      continue;
    }

    // Missed: duration < 15 seconds or status=missed
    if (call.status === "missed" || (call.duration != null && call.duration < 15 && call.outcome === "unknown")) {
      missed++;
      continue;
    }

    const intake = intakeByCallId.get(call.id);
    const jobCard = jobCardByCallId.get(call.id);
    const callerPhone = call.callerPhone || "Unknown";

    // Get lead name for this call
    let callerName = "Unknown caller";
    if (call.leadId) {
      const [lead] = await db.select({ name: leads.name }).from(leads).where(eq(leads.id, call.leadId)).limit(1);
      if (lead?.name) callerName = lead.name;
    }

    // New lead: has intake or job card
    if (intake || jobCard) {
      let estimateRange: string | null = null;
      let status = "pending";

      if (jobCard) {
        if (jobCard.estimateMin != null && jobCard.estimateMax != null) {
          const min = jobCard.ownerAdjustedMin || jobCard.estimateMin;
          const max = jobCard.ownerAdjustedMax || jobCard.estimateMax;
          estimateRange = `$${formatNum(min)}\u2013$${formatNum(max)}`;
        }
        status = jobCard.status || "pending_review";
      }

      newLeads.push({
        callerName,
        callerPhone,
        jobType: intake?.scopeDescription || jobCard?.jobTypeLabel || call.summary?.slice(0, 40) || "Service requested",
        scopeLevel: intake?.scopeLevel || jobCard?.scopeLevel || "residential",
        estimateRange,
        urgency: intake?.urgency || "normal",
        status,
        photoCount: jobCard?.photoCount || 0,
      });
      continue;
    }

    // Existing customer
    if (call.callerPhone && existingCustomerPhones.has(call.callerPhone)) {
      existingCustomerCalls.push({
        callerName,
        reason: call.summary?.slice(0, 60) || "Called in",
      });
      continue;
    }

    // Supplier detection
    const summaryLower = (call.summary || "").toLowerCase();
    if (SUPPLIER_KEYWORDS.some((kw) => summaryLower.includes(kw)) && !intake) {
      supplierCalls.push({
        callerName,
        reason: call.summary?.slice(0, 60) || "Vendor call",
      });
      continue;
    }

    // Default: treat as new lead without structured intake
    newLeads.push({
      callerName,
      callerPhone,
      jobType: call.summary?.slice(0, 40) || "General inquiry",
      scopeLevel: "residential",
      estimateRange: null,
      urgency: "normal",
      status: "no_intake",
      photoCount: 0,
    });
  }

  // Appointments booked today
  const appointmentsBookedToday = todayCalls.filter((c) => c.outcome === "appointment_booked").length;

  // Tomorrow appointments with lead names
  const tomorrowAppointments: TomorrowAppointment[] = [];
  for (const appt of tomorrowAppts) {
    let customerName = "Customer";
    if (appt.leadId) {
      const [lead] = await db.select({ name: leads.name }).from(leads).where(eq(leads.id, appt.leadId)).limit(1);
      if (lead?.name) customerName = lead.name;
    }
    tomorrowAppointments.push({
      customerName,
      time: appt.time,
      jobType: appt.service,
      address: null, // appointments don't have address field
    });
  }

  // Confirmed today
  const confirmedToday = todayJobCards.filter((c) =>
    c.status === "confirmed" || c.status === "adjusted",
  ).length;

  // Total estimate value from today's job cards
  let totalEstimateValue: { min: number; max: number } | null = null;
  const cardsWithEstimates = todayJobCards.filter((c) => c.estimateMin != null && c.estimateMax != null);
  if (cardsWithEstimates.length > 0) {
    let totalMin = 0;
    let totalMax = 0;
    for (const c of cardsWithEstimates) {
      totalMin += c.ownerAdjustedMin || c.estimateMin!;
      totalMax += c.ownerAdjustedMax || c.estimateMax!;
    }
    totalEstimateValue = { min: totalMin, max: totalMax };
  }

  // Monthly revenue captured (from confirmed/adjusted job cards)
  let estimatedRevenueCaptured: number | null = null;
  if (monthConfirmed.length > 0) {
    let total = 0;
    for (const c of monthConfirmed) {
      const min = c.ownerAdjustedMin || c.estimateMin || 0;
      const max = c.ownerAdjustedMax || c.estimateMax || 0;
      total += (min + max) / 2; // midpoint
    }
    estimatedRevenueCaptured = Math.round(total);
  }

  // Action items
  const actionItems: ActionItem[] = [];

  if (pendingCards.length > 0) {
    actionItems.push({
      type: "pending_job_card",
      description: `${pendingCards.length} job card${pendingCards.length > 1 ? "s" : ""} pending your review \u2014 reply to the texts Maria sent`,
    });
  }

  // Missed calls needing callback
  const missedWithPhone = todayCalls.filter(
    (c) => (c.status === "missed" || (c.duration != null && c.duration < 15 && c.outcome === "unknown")) && c.callerPhone,
  );
  for (const mc of missedWithPhone.slice(0, 3)) {
    actionItems.push({
      type: "missed_callback",
      description: `Call back ${mc.callerPhone}`,
      callerPhone: mc.callerPhone || undefined,
    });
  }

  if (tomorrowAppointments.length > 0) {
    actionItems.push({
      type: "appointment_tomorrow",
      description: `${tomorrowAppointments.length} appointment${tomorrowAppointments.length > 1 ? "s" : ""} tomorrow`,
    });
  }

  return {
    totalCalls: todayCalls.length,
    callBreakdown: {
      newLeads,
      existingCustomers: existingCustomerCalls,
      suppliers: supplierCalls,
      missed,
      spam,
    },
    appointmentsBooked: appointmentsBookedToday,
    tomorrowAppointments,
    pendingJobCards: pendingCards.length,
    confirmedToday,
    totalEstimateValue,
    estimatedRevenueCaptured,
    actionItems,
  };
}

function formatNum(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n.toFixed(0);
}

function getMonthStart(timezone: string): string {
  const now = new Date();
  const localDate = now.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const [year, month] = localDate.split("-");
  return `${year}-${month}-01T00:00:00.000Z`;
}
