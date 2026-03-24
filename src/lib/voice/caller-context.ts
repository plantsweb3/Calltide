import { db } from "@/db";
import { customers, appointments, estimates, leads, callbacks, complaintTickets } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { normalizePhone } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";

/**
 * Format a date string (ISO or YYYY-MM-DD) into a human-readable format.
 * e.g. "2026-03-15" → "March 15, 2026"
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Format a 24h time string into 12h format.
 * e.g. "14:00" → "2:00 PM"
 */
function formatTime(time: string): string {
  try {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  } catch {
    return time;
  }
}

/**
 * Format a dollar amount.
 * e.g. 4200 → "$4,200"
 */
function formatMoney(cents: number): string {
  return `$${cents.toLocaleString("en-US")}`;
}

/**
 * Format "customer since" from a date string.
 * e.g. "2025-01-15T..." → "January 2025"
 */
function formatSince(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Build caller context for a returning customer.
 *
 * Looks up the caller in the customers table by businessId + phone,
 * then queries their recent appointments, open estimates, complaints,
 * and callbacks to produce a concise context block for the system prompt.
 *
 * Returns null if the caller is not a known customer.
 */
export async function buildCallerContext(
  businessId: string,
  callerPhone: string,
): Promise<string | null> {
  try {
    const normalized = normalizePhone(callerPhone);
    if (!normalized) return null;

    // Look up the customer — try both raw and normalized phone
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          eq(customers.phone, normalized),
        ),
      )
      .limit(1);

    if (!customer) {
      // Try with the original phone format (some records may have +1 prefix)
      const [customerAlt] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.businessId, businessId),
            eq(customers.phone, callerPhone),
          ),
        )
        .limit(1);

      if (!customerAlt) return null;
      return buildContextFromCustomer(businessId, customerAlt, callerPhone);
    }

    return buildContextFromCustomer(businessId, customer, callerPhone);
  } catch (err) {
    reportError("Failed to build caller context", err, {
      extra: { businessId },
    });
    return null;
  }
}

async function buildContextFromCustomer(
  businessId: string,
  customer: typeof customers.$inferSelect,
  callerPhone: string,
): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const lines: string[] = [];

  lines.push("This is a returning caller. Greet them warmly by name.");

  // Basic info
  if (customer.name) {
    lines.push(`- Name: ${customer.name}`);
  }
  if (customer.createdAt) {
    lines.push(`- Customer since: ${formatSince(customer.createdAt)}`);
  }
  if (customer.tier && customer.tier !== "new") {
    const tierLabel = customer.tier.toUpperCase();
    const valuePart = customer.lifetimeValue
      ? ` (Lifetime value: ${formatMoney(customer.lifetimeValue)})`
      : "";
    lines.push(`- Tier: ${tierLabel}${valuePart}`);
  }

  // Find leads matching this phone to look up appointments
  const normalizedPhone = normalizePhone(callerPhone);
  const matchingLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.businessId, businessId),
        eq(leads.phone, normalizedPhone || callerPhone),
      ),
    )
    .limit(5);

  const leadIds = matchingLeads.map((l) => l.id);

  // Appointments (last completed + upcoming)
  if (leadIds.length > 0) {
    const customerAppts = await db
      .select({
        service: appointments.service,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          inArray(appointments.leadId, leadIds),
        ),
      )
      .orderBy(desc(appointments.date))
      .limit(20);

    const pastCompleted = customerAppts
      .filter((a) => a.date < today || a.status === "completed")
      .slice(0, 3);

    const upcoming = customerAppts
      .filter((a) => a.date >= today && a.status === "confirmed")
      .reverse(); // soonest first

    if (pastCompleted.length > 0) {
      const latest = pastCompleted[0];
      lines.push(`- Last appointment: ${latest.service} on ${formatDate(latest.date)}`);
    }

    if (upcoming.length > 0) {
      const next = upcoming[0];
      lines.push(
        `- Upcoming appointment: ${next.service} on ${formatDate(next.date)} at ${formatTime(next.time)}`,
      );
    }
  }

  // Open estimates
  const openEstimates = await db
    .select({
      service: estimates.service,
      description: estimates.description,
      amount: estimates.amount,
      status: estimates.status,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .where(
      and(
        eq(estimates.businessId, businessId),
        eq(estimates.customerId, customer.id),
      ),
    )
    .orderBy(desc(estimates.createdAt))
    .limit(10);

  const activeEstimates = openEstimates.filter(
    (e) => !["won", "lost", "expired"].includes(e.status),
  );

  if (activeEstimates.length > 0) {
    const est = activeEstimates[0];
    const label = est.service || est.description || "Service";
    const amountPart = est.amount ? ` — ${formatMoney(est.amount)}` : "";
    const sentDate = est.createdAt ? ` (sent ${formatDate(est.createdAt)})` : "";
    lines.push(`- Open estimate: ${label}${amountPart}${sentDate}`);
  }

  // Tags
  const tags = customer.tags as string[] | null;
  if (tags && tags.length > 0) {
    lines.push(`- Tags: ${tags.join(", ")}`);
  }

  // Notes (truncate for prompt efficiency)
  if (customer.notes) {
    const truncated =
      customer.notes.length > 150
        ? customer.notes.slice(0, 147) + "..."
        : customer.notes;
    lines.push(`- Notes: ${truncated}`);
  }

  // Complaint tickets (wrap in try/catch in case table doesn't exist)
  try {
    const openComplaints = await db
      .select({
        description: complaintTickets.description,
        severity: complaintTickets.severity,
        status: complaintTickets.status,
      })
      .from(complaintTickets)
      .where(
        and(
          eq(complaintTickets.businessId, businessId),
          eq(complaintTickets.customerId, customer.id),
        ),
      )
      .limit(5);

    const activeComplaints = openComplaints.filter(
      (c) => c.status === "open" || c.status === "investigating",
    );

    if (activeComplaints.length > 0) {
      const c = activeComplaints[0];
      lines.push(
        `- Open complaint (${c.severity}): ${c.description.slice(0, 80)}`,
      );
      lines.push(
        "- IMPORTANT: Be extra empathetic. This caller has an unresolved issue.",
      );
    }
  } catch {
    // Table may not exist yet — silently skip
  }

  // Scheduled callbacks (wrap in try/catch)
  try {
    const normalized = normalizePhone(callerPhone);
    const scheduledCallbacks = await db
      .select({
        reason: callbacks.reason,
        requestedTime: callbacks.requestedTime,
        status: callbacks.status,
      })
      .from(callbacks)
      .where(
        and(
          eq(callbacks.businessId, businessId),
          eq(callbacks.customerPhone, normalized || callerPhone),
          eq(callbacks.status, "scheduled"),
        ),
      )
      .limit(3);

    if (scheduledCallbacks.length > 0) {
      const cb = scheduledCallbacks[0];
      const reason = cb.reason ? ` about: ${cb.reason}` : "";
      lines.push(
        `- Has a callback scheduled for ${formatDate(cb.requestedTime)}${reason}`,
      );
    }
  } catch {
    // Table may not exist yet — silently skip
  }

  // Add usage guidance
  lines.push("");
  lines.push(
    "Use this context to personalize the conversation. Reference their history naturally.",
  );
  lines.push(
    "If they might be calling about an existing appointment or estimate, ask proactively.",
  );

  return lines.join("\n");
}
