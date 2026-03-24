import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians, appointments, leads, customers } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * GET /api/dashboard/dispatch?date=YYYY-MM-DD
 * Returns technicians with their assigned appointments for a given date,
 * plus unassigned appointments for that date.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-dispatch:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam && dateSchema.safeParse(dateParam).success
    ? dateParam
    : new Date().toISOString().slice(0, 10);

  try {
    // Fetch active technicians
    const techs = await db
      .select()
      .from(technicians)
      .where(and(eq(technicians.businessId, businessId), eq(technicians.isActive, true)))
      .orderBy(technicians.sortOrder);

    // Fetch all appointments for this date (not cancelled)
    const appts = await db
      .select({
        id: appointments.id,
        service: appointments.service,
        date: appointments.date,
        time: appointments.time,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        technicianId: appointments.technicianId,
        leadId: appointments.leadId,
        createdAt: appointments.createdAt,
        leadName: leads.name,
        leadPhone: leads.phone,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerAddress: customers.address,
      })
      .from(appointments)
      .leftJoin(leads, eq(appointments.leadId, leads.id))
      .leftJoin(customers, eq(leads.phone, customers.phone))
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.date, date),
          sql`${appointments.status} != 'cancelled'`
        )
      )
      .orderBy(asc(appointments.time));

    // Deduplicate customer join (take the one matching the business)
    const enrichedAppts = appts.map((a) => ({
      id: a.id,
      service: a.service,
      date: a.date,
      time: a.time,
      duration: a.duration,
      status: a.status,
      notes: a.notes,
      technicianId: a.technicianId,
      customerName: a.customerName || a.leadName || null,
      customerPhone: a.customerPhone || a.leadPhone || null,
      customerAddress: a.customerAddress || null,
    }));

    // Group appointments by technician
    const techMap = new Map<string, typeof enrichedAppts>();
    const unassigned: typeof enrichedAppts = [];

    for (const appt of enrichedAppts) {
      if (appt.technicianId) {
        const existing = techMap.get(appt.technicianId) || [];
        existing.push(appt);
        techMap.set(appt.technicianId, existing);
      } else {
        unassigned.push(appt);
      }
    }

    const techColumns = techs.map((t) => ({
      ...t,
      appointments: techMap.get(t.id) || [],
    }));

    return NextResponse.json({
      date,
      technicians: techColumns,
      unassigned,
    });
  } catch (err) {
    reportError("Failed to fetch dispatch data", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
