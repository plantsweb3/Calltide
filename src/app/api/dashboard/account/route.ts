import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments } from "@/db/schema";
import { eq, count, and, sql } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      name: "Demo Plumbing Co.",
      type: "plumbing",
      ownerName: "Demo User",
      ownerEmail: "demo@captahq.com",
      ownerPhone: "(555) 000-0000",
      twilioNumber: "(555) 000-0001",
      timezone: "America/Chicago",
      defaultLanguage: "en",
      services: ["AC Repair", "Pipe Leak Repair", "Drain Cleaning", "Water Heater Install"],
      businessHours: {
        Mon: { open: "08:00", close: "17:00" },
        Tue: { open: "08:00", close: "17:00" },
        Wed: { open: "08:00", close: "17:00" },
        Thu: { open: "08:00", close: "17:00" },
        Fri: { open: "08:00", close: "17:00" },
      },
      active: true,
      totalCalls: 47,
      totalAppointments: 23,
      memberSince: "2025-01-15",
    });
  }

  const rl = await rateLimit(`dashboard-account-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const [totalCallsResult] = await db
    .select({ count: count() })
    .from(calls)
    .where(eq(calls.businessId, businessId));

  const [totalApptsResult] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        sql`${appointments.status} IN ('confirmed', 'completed')`,
      ),
    );

  return NextResponse.json({
    name: biz.name,
    type: biz.type,
    ownerName: biz.ownerName,
    ownerEmail: biz.ownerEmail,
    ownerPhone: biz.ownerPhone,
    twilioNumber: biz.twilioNumber,
    timezone: biz.timezone,
    defaultLanguage: biz.defaultLanguage,
    services: biz.services,
    businessHours: biz.businessHours,
    active: biz.active,
    totalCalls: totalCallsResult.count,
    totalAppointments: totalApptsResult.count,
    memberSince: biz.createdAt.slice(0, 10),
  });
}
