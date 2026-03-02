import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientFeedback, businesses } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!req.cookies.has("calltide_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams;
  const statusParam = url.get("status");
  const parsedLimit = parseInt(url.get("limit") ?? "50", 10);
  const limit = Math.min(Math.max(1, Number.isNaN(parsedLimit) ? 50 : parsedLimit), 200);

  const validStatuses = ["new", "in_progress", "resolved", "declined"] as const;
  const conditions = [];
  if (statusParam && validStatuses.includes(statusParam as (typeof validStatuses)[number])) {
    conditions.push(eq(clientFeedback.status, statusParam));
  }

  const items = await db
    .select({
      id: clientFeedback.id,
      businessId: clientFeedback.businessId,
      businessName: businesses.name,
      type: clientFeedback.type,
      category: clientFeedback.category,
      title: clientFeedback.title,
      description: clientFeedback.description,
      status: clientFeedback.status,
      adminResponse: clientFeedback.adminResponse,
      adminRespondedAt: clientFeedback.adminRespondedAt,
      priority: clientFeedback.priority,
      votes: clientFeedback.votes,
      createdAt: clientFeedback.createdAt,
      updatedAt: clientFeedback.updatedAt,
    })
    .from(clientFeedback)
    .leftJoin(businesses, eq(clientFeedback.businessId, businesses.id))
    .where(conditions.length > 0 ? sql`${conditions[0]}` : undefined)
    .orderBy(desc(clientFeedback.createdAt))
    .limit(limit);

  // Summary stats
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      newCount: sql<number>`sum(case when ${clientFeedback.status} = 'new' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when ${clientFeedback.status} = 'in_progress' then 1 else 0 end)`,
      resolved: sql<number>`sum(case when ${clientFeedback.status} = 'resolved' then 1 else 0 end)`,
    })
    .from(clientFeedback);

  return NextResponse.json({
    items,
    stats: {
      total: stats?.total ?? 0,
      new: stats?.newCount ?? 0,
      inProgress: stats?.inProgress ?? 0,
      resolved: stats?.resolved ?? 0,
    },
  });
}
