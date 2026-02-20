import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, appointments } from "@/db/schema";
import { eq, and, sql, gte, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Start of this week (Monday)
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const [callsToday] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        sql`date(${calls.createdAt}) = ${today}`,
      ),
    );

  const [appointmentsThisWeek] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.status, "confirmed"),
        gte(appointments.date, weekStartStr),
        sql`${appointments.date} <= ${weekEndStr}`,
      ),
    );

  const [missedCallsSaved] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.status, "missed"),
        sql`${calls.summary} IS NOT NULL`,
      ),
    );

  const [totalCalls] = await db
    .select({ count: count() })
    .from(calls)
    .where(eq(calls.businessId, businessId));

  return NextResponse.json({
    callsToday: callsToday.count,
    appointmentsThisWeek: appointmentsThisWeek.count,
    missedCallsSaved: missedCallsSaved.count,
    totalCalls: totalCalls.count,
  });
}
