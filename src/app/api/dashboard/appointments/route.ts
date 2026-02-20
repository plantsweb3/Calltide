import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads } from "@/db/schema";
import { eq, and, gte, lt, asc, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = req.nextUrl.searchParams.get("filter") || "upcoming";
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
    .orderBy(filter === "past" ? desc(appointments.date) : asc(appointments.date));

  return NextResponse.json({ appointments: rows });
}
