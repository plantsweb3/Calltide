import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followUps, appointments, invoices, estimates } from "@/db/schema";
import { eq, and, count, sql, isNull, or } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/dashboard/action-items
 * Returns counts of items that need the business owner's attention:
 * - overdueInvoices: invoices past their due date
 * - unassignedToday: today's confirmed appointments without a technician
 * - urgentFollowUps: pending follow-ups with urgent or high priority
 * - expiredEstimates: estimates with expired status
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-action-items:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const today = new Date().toISOString().slice(0, 10);

    const [overdueResult, unassignedResult, followUpResult, expiredEstimatesResult] = await Promise.all([
      // Overdue invoices
      db
        .select({ count: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.businessId, businessId),
            sql`(${invoices.status} = 'overdue' OR ((${invoices.status} = 'sent' OR ${invoices.status} = 'pending') AND ${invoices.dueDate} IS NOT NULL AND ${invoices.dueDate} < ${today}))`,
          ),
        ),
      // Today's unassigned appointments
      db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.businessId, businessId),
            eq(appointments.date, today),
            eq(appointments.status, "confirmed"),
            isNull(appointments.technicianId),
          ),
        ),
      // Urgent/high priority pending follow-ups
      db
        .select({ count: count() })
        .from(followUps)
        .where(
          and(
            eq(followUps.businessId, businessId),
            eq(followUps.status, "pending"),
            or(
              eq(followUps.priority, "urgent"),
              eq(followUps.priority, "high"),
            ),
          ),
        ),
      // Expired estimates
      db
        .select({ count: count() })
        .from(estimates)
        .where(
          and(
            eq(estimates.businessId, businessId),
            eq(estimates.status, "expired"),
          ),
        ),
    ]);

    return NextResponse.json({
      overdueInvoices: overdueResult[0]?.count ?? 0,
      unassignedToday: unassignedResult[0]?.count ?? 0,
      urgentFollowUps: followUpResult[0]?.count ?? 0,
      expiredEstimates: expiredEstimatesResult[0]?.count ?? 0,
    });
  } catch (err) {
    reportError("Failed to fetch action items", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
