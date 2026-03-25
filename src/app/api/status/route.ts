import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incidents, incidentUpdates, systemHealthLogs } from "@/db/schema";
import { sql, desc, eq, and, inArray } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

/**
 * Maps internal service names to user-facing categories.
 * Users don't need to know about individual subprocessors — they care about
 * whether their phone answering, SMS, dashboard, etc. are working.
 */
const SERVICE_CATEGORY_MAP: Record<string, string[]> = {
  "Phone Answering": ["Twilio", "ElevenLabs"],
  "SMS & Notifications": ["Twilio", "Resend"],
  "Dashboard & CRM": ["Turso"],
  "AI Intelligence": ["Anthropic"],
};

const CATEGORY_ORDER = ["Phone Answering", "SMS & Notifications", "Dashboard & CRM", "AI Intelligence"];

function aggregateCategoryStatus(
  categoryServices: string[],
  latestByService: Map<string, { status: string; latencyMs: number | null; checkedAt: string | null }>,
): { status: string; latencyMs: number | null; checkedAt: string | null } {
  let worstStatus = "operational";
  let maxLatency: number | null = null;
  let latestCheck: string | null = null;

  for (const svc of categoryServices) {
    const log = latestByService.get(svc);
    if (!log) continue;

    // Worst status wins
    if (log.status === "down") worstStatus = "down";
    else if (log.status === "degraded" && worstStatus !== "down") worstStatus = "degraded";

    // Max latency
    if (log.latencyMs != null && (maxLatency == null || log.latencyMs > maxLatency)) {
      maxLatency = log.latencyMs;
    }

    // Latest check time
    if (log.checkedAt && (!latestCheck || log.checkedAt > latestCheck)) {
      latestCheck = log.checkedAt;
    }
  }

  return { status: worstStatus, latencyMs: maxLatency, checkedAt: latestCheck };
}

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

    // Build user-facing categories from internal service health
    const services = CATEGORY_ORDER.map((category) => {
      const categoryServices = SERVICE_CATEGORY_MAP[category] || [];
      const agg = aggregateCategoryStatus(categoryServices, latestByService);
      return {
        name: category,
        status: agg.status,
        latencyMs: agg.latencyMs,
        checkedAt: agg.checkedAt,
      };
    });

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

    // Daily health per category (last 90 days)
    // Aggregate from internal services into user-facing categories
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

    // Group daily data by internal service first
    const dailyByInternalService: Record<string, Record<string, string>> = {};
    for (const row of dailyHealth) {
      if (!dailyByInternalService[row.serviceName]) dailyByInternalService[row.serviceName] = {};
      let status = "operational";
      if (row.hasUnhealthy) status = "outage";
      else if (row.hasDegraded || (row.maxLatency && row.maxLatency > 5000)) status = "degraded";
      dailyByInternalService[row.serviceName][row.day] = status;
    }

    // Aggregate into categories — worst status per day across member services
    const dailyByCategory: Record<string, Array<{ date: string; status: string }>> = {};
    for (const category of CATEGORY_ORDER) {
      const memberServices = SERVICE_CATEGORY_MAP[category] || [];
      const allDates = new Set<string>();
      for (const svc of memberServices) {
        if (dailyByInternalService[svc]) {
          for (const d of Object.keys(dailyByInternalService[svc])) allDates.add(d);
        }
      }
      const sorted = Array.from(allDates).sort();
      dailyByCategory[category] = sorted.map((date) => {
        let worst = "operational";
        for (const svc of memberServices) {
          const s = dailyByInternalService[svc]?.[date];
          if (s === "outage") worst = "outage";
          else if (s === "degraded" && worst !== "outage") worst = "degraded";
        }
        return { date, status: worst };
      });
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
      dailyHealth: dailyByCategory,
    });
  } catch (error) {
    reportError("Status API error", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
