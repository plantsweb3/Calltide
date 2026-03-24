import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followUps, appointments, invoices } from "@/db/schema";
import { eq, and, count, sql, isNull } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/dashboard/nav-badges
 * Returns badge counts for nav items that need attention:
 * - followUps: count of pending follow-ups
 * - dispatch: count of today's unassigned appointments
 * - invoices: count of overdue invoices
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-nav-badges:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Run all three counts in parallel
    const [followUpResult, dispatchResult, invoiceResult] = await Promise.all([
      // Pending follow-ups
      db
        .select({ count: count() })
        .from(followUps)
        .where(
          and(
            eq(followUps.businessId, businessId),
            eq(followUps.status, "pending"),
          ),
        ),
      // Today's unassigned appointments (confirmed, no technician)
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
      // Overdue invoices (status=overdue OR (sent/pending with past dueDate))
      db
        .select({ count: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.businessId, businessId),
            sql`(${invoices.status} = 'overdue' OR ((${invoices.status} = 'sent' OR ${invoices.status} = 'pending') AND ${invoices.dueDate} IS NOT NULL AND ${invoices.dueDate} < ${today}))`,
          ),
        ),
    ]);

    return NextResponse.json({
      followUps: followUpResult[0]?.count ?? 0,
      dispatch: dispatchResult[0]?.count ?? 0,
      invoices: invoiceResult[0]?.count ?? 0,
    });
  } catch (err) {
    reportError("Failed to fetch nav badges", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
