import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads } from "@/db/schema";
import { eq, and, gte, lt, asc, desc } from "drizzle-orm";
import { z } from "zod";
import {
  DEMO_BUSINESS_ID,
  DEMO_APPOINTMENTS_UPCOMING,
  DEMO_APPOINTMENTS_PAST,
} from "../demo-data";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-appointments-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const filter = req.nextUrl.searchParams.get("filter") || "upcoming";

  if (businessId === DEMO_BUSINESS_ID) {
    const data =
      filter === "past" ? DEMO_APPOINTMENTS_PAST : DEMO_APPOINTMENTS_UPCOMING;
    return NextResponse.json({ appointments: data });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const dateCondition =
      filter === "past"
        ? lt(appointments.date, today)
        : gte(appointments.date, today);

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
        leadName: leads.name,
        leadPhone: leads.phone,
      })
      .from(appointments)
      .leftJoin(leads, eq(appointments.leadId, leads.id))
      .where(and(eq(appointments.businessId, businessId), dateCondition))
      .orderBy(filter === "past" ? desc(appointments.date) : asc(appointments.date))
      .limit(200);

    return NextResponse.json({ appointments: rows });
  } catch (err) {
    reportError("Failed to fetch appointments", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
});

export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-appointments-update-${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { id, status } = parsed.data;

    // Verify the appointment belongs to this business
    const [apt] = await db
      .select({
        id: appointments.id,
        googleCalendarEventId: appointments.googleCalendarEventId,
      })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.businessId, businessId)))
      .limit(1);

    if (!apt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await db
      .update(appointments)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(appointments.id, id));

    // If cancelling and linked to Google Calendar, delete the event
    if (status === "cancelled" && apt.googleCalendarEventId) {
      import("@/lib/calendar/google-calendar").then(({ deleteCalendarEvent }) => {
        deleteCalendarEvent(businessId, apt.googleCalendarEventId!).catch((err) =>
          reportError("Failed to delete Google Calendar event on cancel", err, { businessId }),
        );
      }).catch(() => {});

      await db
        .update(appointments)
        .set({ googleCalendarEventId: null })
        .where(eq(appointments.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError("Failed to update appointment", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
