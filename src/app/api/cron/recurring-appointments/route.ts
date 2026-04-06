import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recurringRules, appointments, customers, leads } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { reportError, reportWarning } from "@/lib/error-reporting";

/**
 * Calculate the next occurrence after a given date.
 */
function advanceOccurrence(
  currentDate: string,
  frequency: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  preferredTime?: string | null,
): string {
  const current = new Date(currentDate);
  const next = new Date(current);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;

    case "weekly":
      next.setDate(next.getDate() + 7);
      break;

    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;

    case "monthly":
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;

    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;

    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;

    default:
      next.setDate(next.getDate() + 7);
  }

  // Set preferred time
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(":").map(Number);
    if (!isNaN(hours)) next.setHours(hours);
    if (!isNaN(minutes)) next.setMinutes(minutes);
    next.setSeconds(0, 0);
  } else {
    next.setHours(9, 0, 0, 0);
  }

  return next.toISOString();
}

/**
 * GET /api/cron/recurring-appointments
 *
 * Generates appointments from active recurring rules where next_occurrence
 * falls within the next 7 days. Run daily via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("recurring-appointments", "0 6 * * *", async () => {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 7);
    const horizonStr = horizon.toISOString();

    // Find active rules where next_occurrence is within the next 7 days
    const rules = await db
      .select()
      .from(recurringRules)
      .where(
        and(
          eq(recurringRules.isActive, true),
          lte(recurringRules.nextOccurrence, horizonStr),
        ),
      );

    let created = 0;
    let errors = 0;

    for (const rule of rules) {
      try {
        // Get customer info to create a lead for the appointment
        const [customer] = await db
          .select({ id: customers.id, name: customers.name, phone: customers.phone })
          .from(customers)
          .where(eq(customers.id, rule.customerId))
          .limit(1);

        if (!customer) {
          reportWarning("[recurring] Customer not found for rule, skipping", { ruleId: rule.id });
          continue;
        }

        // Parse the occurrence date/time
        const occurrenceDate = new Date(rule.nextOccurrence);
        const dateStr = occurrenceDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = rule.preferredTime || "09:00";

        // Check for existing appointment on the same date/time to avoid duplicates
        const [existing] = await db
          .select({ id: appointments.id })
          .from(appointments)
          .where(
            and(
              eq(appointments.businessId, rule.businessId),
              eq(appointments.date, dateStr),
              eq(appointments.time, timeStr),
              eq(appointments.service, rule.service),
            ),
          )
          .limit(1);

        if (existing) {
          // Already generated, just advance the occurrence
          const nextOccurrence = advanceOccurrence(
            rule.nextOccurrence,
            rule.frequency,
            rule.dayOfWeek,
            rule.dayOfMonth,
            rule.preferredTime,
          );

          await db
            .update(recurringRules)
            .set({
              nextOccurrence,
              lastGenerated: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(recurringRules.id, rule.id));

          continue;
        }

        // Create or find a lead for this customer
        let leadId: string;
        const [existingLead] = await db
          .select({ id: leads.id })
          .from(leads)
          .where(
            and(
              eq(leads.businessId, rule.businessId),
              eq(leads.phone, customer.phone),
            ),
          )
          .limit(1);

        if (existingLead) {
          leadId = existingLead.id;
        } else {
          const [newLead] = await db.insert(leads).values({
            businessId: rule.businessId,
            phone: customer.phone,
            name: customer.name,
            source: "recurring",
          }).returning();
          leadId = newLead.id;
        }

        // Create the appointment
        await db.insert(appointments).values({
          businessId: rule.businessId,
          leadId,
          service: rule.service,
          date: dateStr,
          time: timeStr,
          duration: rule.duration,
          technicianId: rule.technicianId,
          notes: rule.notes ? `[Recurring] ${rule.notes}` : "[Recurring]",
          status: "confirmed",
        });

        // Advance the next occurrence
        const nextOccurrence = advanceOccurrence(
          rule.nextOccurrence,
          rule.frequency,
          rule.dayOfWeek,
          rule.dayOfMonth,
          rule.preferredTime,
        );

        await db
          .update(recurringRules)
          .set({
            nextOccurrence,
            lastGenerated: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(recurringRules.id, rule.id));

        created++;
      } catch (err) {
        errors++;
        reportError("Failed to generate recurring appointment", err, {
          extra: { ruleId: rule.id, businessId: rule.businessId },
        });
      }
    }

    reportWarning("[recurring] Processed rules", { rulesCount: rules.length, created, errors });

    return NextResponse.json({
      ok: true,
      rulesProcessed: rules.length,
      appointmentsCreated: created,
      errors,
    });
  });
}
