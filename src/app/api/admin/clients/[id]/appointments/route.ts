import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")), 100);
  const offset = (page - 1) * limit;

  const [totalResult] = await db
    .select({ count: count() })
    .from(appointments)
    .where(eq(appointments.businessId, businessId));

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
    .where(eq(appointments.businessId, businessId))
    .orderBy(desc(appointments.date))
    .limit(limit)
    .offset(offset);

  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({ appointments: rows, total, page, totalPages });
}
