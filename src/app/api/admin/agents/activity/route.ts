import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentActivityLog } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * GET /api/admin/agents/activity
 *
 * List agent activity logs with optional filters.
 * Query params: agent, limit, offset
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const agent = params.get("agent");
  const limit = Math.min(parseInt(params.get("limit") ?? "50", 10), 200);
  const offset = Math.max(parseInt(params.get("offset") ?? "0", 10), 0);

  const conditions = [];
  if (agent) {
    conditions.push(eq(agentActivityLog.agentName, agent));
  }

  const query = db
    .select()
    .from(agentActivityLog)
    .orderBy(desc(agentActivityLog.createdAt))
    .limit(limit)
    .offset(offset);

  const activities = agent
    ? await query.where(eq(agentActivityLog.agentName, agent))
    : await query;

  // Get summary counts
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      escalated: sql<number>`sum(case when ${agentActivityLog.escalated} = 1 then 1 else 0 end)`,
      resolved: sql<number>`sum(case when ${agentActivityLog.resolvedWithoutEscalation} = 1 then 1 else 0 end)`,
    })
    .from(agentActivityLog);

  return NextResponse.json({
    activities,
    stats: {
      total: stats?.total ?? 0,
      escalated: stats?.escalated ?? 0,
      resolved: stats?.resolved ?? 0,
    },
  });
}
