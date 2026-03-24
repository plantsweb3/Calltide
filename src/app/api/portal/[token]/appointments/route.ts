import { NextRequest, NextResponse } from "next/server";
import { validatePortalToken } from "@/lib/portal/auth";
import { db } from "@/db";
import { appointments, leads } from "@/db/schema";
import { eq, and, gte, lt, asc, desc } from "drizzle-orm";
import { rateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/portal/[token]/appointments
 * List appointments for the customer linked to this portal token.
 * Query params: ?filter=upcoming|past (default: upcoming)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`portal-appointments:${ip}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { token } = await params;

  try {
    const result = await validatePortalToken(token);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired portal link" },
        { status: 401 }
      );
    }

    const { customer, business } = result;
    const filter = req.nextUrl.searchParams.get("filter") || "upcoming";
    const today = new Date().toISOString().slice(0, 10);

    // Find leads matching this customer's phone for this business
    const customerLeads = await db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.businessId, business.id),
          eq(leads.phone, customer.phone)
        )
      );

    const leadIds = customerLeads.map((l) => l.id);

    if (leadIds.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    // Fetch appointments for all matching leads
    const dateCondition =
      filter === "past"
        ? lt(appointments.date, today)
        : gte(appointments.date, today);

    const allAppointments = [];
    for (const leadId of leadIds) {
      const rows = await db
        .select({
          id: appointments.id,
          service: appointments.service,
          date: appointments.date,
          time: appointments.time,
          duration: appointments.duration,
          status: appointments.status,
          notes: appointments.notes,
          createdAt: appointments.createdAt,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.businessId, business.id),
            eq(appointments.leadId, leadId),
            dateCondition
          )
        )
        .orderBy(
          filter === "past"
            ? desc(appointments.date)
            : asc(appointments.date)
        );
      allAppointments.push(...rows);
    }

    // Sort combined results
    allAppointments.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return filter === "past" ? -cmp : cmp;
    });

    return NextResponse.json({ appointments: allAppointments });
  } catch (err) {
    reportError("Portal: failed to fetch appointments", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
