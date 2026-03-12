import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemHealthLogs, calls, businesses, appointments, processedStripeEvents } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET() {
  try {
    // Latest health per service (most recent check for each)
    const allLogs = await db
      .select()
      .from(systemHealthLogs)
      .orderBy(desc(systemHealthLogs.checkedAt));

    // Deduplicate to get latest per service
    const latestByService = new Map<string, typeof allLogs[0]>();
    for (const log of allLogs) {
      if (!latestByService.has(log.serviceName)) {
        latestByService.set(log.serviceName, log);
      }
    }
    const serviceHealth = Array.from(latestByService.values());

    // System-wide stats
    const [dbStats] = await db
      .select({
        totalBusinesses: sql<number>`count(*)`,
      })
      .from(businesses);

    const [callStats] = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        callsToday: sql<number>`sum(case when date(${calls.createdAt}) = date('now') then 1 else 0 end)`,
      })
      .from(calls);

    const [aptStats] = await db
      .select({
        totalAppointments: sql<number>`count(*)`,
      })
      .from(appointments);

    // Recent errors (health logs with errors)
    const recentErrors = await db
      .select()
      .from(systemHealthLogs)
      .where(sql`${systemHealthLogs.errorCount} > 0`)
      .orderBy(desc(systemHealthLogs.checkedAt))
      .limit(20);

    // Webhook health stats
    const [webhookStats] = await db
      .select({
        total24h: sql<number>`count(case when datetime(${processedStripeEvents.processedAt}) >= datetime('now', '-24 hours') then 1 end)`,
        lastEvent: sql<string>`max(${processedStripeEvents.processedAt})`,
      })
      .from(processedStripeEvents);

    return NextResponse.json({
      services: serviceHealth,
      systemStats: {
        totalBusinesses: dbStats?.totalBusinesses ?? 0,
        totalCalls: callStats?.totalCalls ?? 0,
        callsToday: callStats?.callsToday ?? 0,
        totalAppointments: aptStats?.totalAppointments ?? 0,
      },
      webhookHealth: {
        eventsLast24h: webhookStats?.total24h ?? 0,
        lastEventAt: webhookStats?.lastEvent ?? null,
      },
      recentErrors,
    });
  } catch (error) {
    reportError("Error fetching ops data", error);
    return NextResponse.json({ error: "Failed to fetch ops data" }, { status: 500 });
  }
}
