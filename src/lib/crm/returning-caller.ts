import { db } from "@/db";
import { customers, calls, appointments, estimates } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { getCrossLocationCustomerContext } from "./cross-location-lookup";

/**
 * Query customer by (businessId, phone). Must be fast (<50ms) — uses indexed lookup.
 * If the customer is a returning caller, builds a context string for the AI prompt.
 * Optionally includes cross-location context when accountId is provided.
 */
export async function getReturningCallerContext(
  businessId: string,
  callerPhone: string,
  accountId?: string,
): Promise<string | null> {
  if (!callerPhone) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.phone, callerPhone), isNull(customers.deletedAt)))
    .limit(1);

  if (!customer || (customer.totalCalls || 0) <= 1) return null;

  // Fetch last 3 call summaries
  const recentCalls = await db
    .select({ summary: calls.summary, createdAt: calls.createdAt })
    .from(calls)
    .where(and(eq(calls.businessId, businessId), eq(calls.callerPhone, callerPhone)))
    .orderBy(desc(calls.createdAt))
    .limit(3);

  // Check for upcoming appointments
  const today = new Date().toISOString().slice(0, 10);
  const upcomingAppointments = await db
    .select({ service: appointments.service, date: appointments.date, time: appointments.time })
    .from(appointments)
    .innerJoin(calls, eq(appointments.callId, calls.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.status, "confirmed"),
      )
    )
    .limit(3);

  // Check for open estimates
  const openEstimates = await db
    .select({ service: estimates.service, status: estimates.status, amount: estimates.amount })
    .from(estimates)
    .where(
      and(
        eq(estimates.customerId, customer.id),
        eq(estimates.businessId, businessId),
      )
    )
    .limit(3);

  const activeEstimates = openEstimates.filter((e) => ["new", "sent", "follow_up"].includes(e.status));

  // Build the context string
  const parts: string[] = [];

  parts.push(`Name: ${customer.name || "Unknown"}`);
  parts.push(`Total calls: ${customer.totalCalls}`);
  if (customer.language === "es") parts.push("Preferred language: Spanish");

  if (recentCalls.length > 0) {
    const summaries = recentCalls
      .filter((c) => c.summary)
      .map((c) => `- ${c.summary}`)
      .join("\n");
    if (summaries) parts.push(`Recent call summaries:\n${summaries}`);
  }

  if (activeEstimates.length > 0) {
    const estLines = activeEstimates
      .map((e) => `- ${e.service || "General"} (${e.status}${e.amount ? `, $${e.amount}` : ""})`)
      .join("\n");
    parts.push(`Open estimates:\n${estLines}`);
  }

  const name = customer.name || "the caller";
  let context = `[RETURNING CALLER: This is ${name}, a repeat customer who has called ${customer.totalCalls} times before. Greet them by name and reference their history when relevant.

${parts.join("\n")}]`;

  // Append cross-location context if available
  if (accountId) {
    const crossContext = await getCrossLocationCustomerContext(accountId, callerPhone);
    if (crossContext) context += `\n\n${crossContext}`;
  }

  return context;
}
