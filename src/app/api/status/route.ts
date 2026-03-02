import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incidents, incidentUpdates, systemHealthLogs } from "@/db/schema";
import { sql, desc, eq, and, inArray } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`status:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    // Latest health per service
    const allLogs = await db
      .select()
      .from(systemHealthLogs)
      .orderBy(desc(systemHealthLogs.checkedAt))
      .limit(100);

    const latestByService = new Map<string, typeof allLogs[0]>();
    for (const log of allLogs) {
      if (!latestByService.has(log.serviceName)) {
        latestByService.set(log.serviceName, log);
      }
    }
    const services = Array.from(latestByService.values()).map((s) => ({
      name: s.serviceName,
      status: s.status,
      latencyMs: s.latencyMs,
      checkedAt: s.checkedAt,
    }));

    // Active incidents (open statuses)
    const openStatuses = ["detected", "investigating", "identified", "monitoring"];
    const activeIncidents = await db
      .select()
      .from(incidents)
      .where(inArray(incidents.status, openStatuses))
      .orderBy(desc(incidents.startedAt));

    // Get updates for active incidents
    const activeWithUpdates = await Promise.all(
      activeIncidents.map(async (inc) => {
        const updates = await db
          .select()
          .from(incidentUpdates)
          .where(
            and(
              eq(incidentUpdates.incidentId, inc.id),
              eq(incidentUpdates.isPublic, true),
            ),
          )
          .orderBy(desc(incidentUpdates.createdAt));
        return { ...inc, updates };
      }),
    );

    // Recent resolved incidents (last 90 days)
    const recentIncidents = await db
      .select()
      .from(incidents)
      .where(
        and(
          inArray(incidents.status, ["resolved", "postmortem"]),
          sql`${incidents.resolvedAt} > datetime('now', '-90 days')`,
        ),
      )
      .orderBy(desc(incidents.resolvedAt))
      .limit(50);

    const recentWithUpdates = await Promise.all(
      recentIncidents.map(async (inc) => {
        const updates = await db
          .select()
          .from(incidentUpdates)
          .where(
            and(
              eq(incidentUpdates.incidentId, inc.id),
              eq(incidentUpdates.isPublic, true),
            ),
          )
          .orderBy(desc(incidentUpdates.createdAt));
        return {
          ...inc,
          updates,
          postmortem: inc.postmortemPublished ? inc.postmortem : null,
          postmortemEs: inc.postmortemPublished ? inc.postmortemEs : null,
        };
      }),
    );

    // Daily health per service (last 90 days)
    const dailyHealth = await db
      .select({
        serviceName: systemHealthLogs.serviceName,
        day: sql<string>`date(${systemHealthLogs.checkedAt})`.as("day"),
        hasUnhealthy: sql<number>`max(case when ${systemHealthLogs.status} = 'down' then 1 else 0 end)`.as("has_unhealthy"),
        hasDegraded: sql<number>`max(case when ${systemHealthLogs.status} = 'degraded' then 1 else 0 end)`.as("has_degraded"),
        maxLatency: sql<number>`max(${systemHealthLogs.latencyMs})`.as("max_latency"),
      })
      .from(systemHealthLogs)
      .where(sql`${systemHealthLogs.checkedAt} > datetime('now', '-90 days')`)
      .groupBy(systemHealthLogs.serviceName, sql`date(${systemHealthLogs.checkedAt})`)
      .orderBy(sql`date(${systemHealthLogs.checkedAt})`);

    const dailyByService: Record<string, Array<{ date: string; status: string }>> = {};
    for (const row of dailyHealth) {
      if (!dailyByService[row.serviceName]) dailyByService[row.serviceName] = [];
      let status = "operational";
      if (row.hasUnhealthy) status = "outage";
      else if (row.hasDegraded || (row.maxLatency && row.maxLatency > 5000)) status = "degraded";
      dailyByService[row.serviceName].push({ date: row.day, status });
    }

    // Overall status
    let overallStatus = "All Systems Operational";
    let overallColor = "green";
    if (activeIncidents.some((i) => i.severity === "critical")) {
      overallStatus = "Major System Outage";
      overallColor = "red";
    } else if (activeIncidents.some((i) => i.severity === "major")) {
      overallStatus = "Partial System Outage";
      overallColor = "amber";
    } else if (activeIncidents.some((i) => i.severity === "minor")) {
      overallStatus = "Degraded Performance";
      overallColor = "amber";
    }

    return NextResponse.json({
      overallStatus,
      overallColor,
      services,
      activeIncidents: activeWithUpdates,
      recentIncidents: recentWithUpdates,
      dailyHealth: dailyByService,
    });
  } catch (error) {
    reportError("Status API error", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
