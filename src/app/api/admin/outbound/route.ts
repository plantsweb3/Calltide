import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outboundCalls, businesses, customers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  try {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(outboundCalls);
    const total = countResult?.count ?? 0;

    const rows = await db
      .select({
        id: outboundCalls.id,
        businessId: outboundCalls.businessId,
        businessName: businesses.name,
        customerPhone: outboundCalls.customerPhone,
        customerName: customers.name,
        callType: outboundCalls.callType,
        status: outboundCalls.status,
        outcome: outboundCalls.outcome,
        scheduledFor: outboundCalls.scheduledFor,
        attemptedAt: outboundCalls.attemptedAt,
        completedAt: outboundCalls.completedAt,
        duration: outboundCalls.duration,
        retryCount: outboundCalls.retryCount,
        language: outboundCalls.language,
        createdAt: outboundCalls.createdAt,
      })
      .from(outboundCalls)
      .leftJoin(businesses, eq(outboundCalls.businessId, businesses.id))
      .leftJoin(customers, eq(outboundCalls.customerId, customers.id))
      .orderBy(desc(outboundCalls.createdAt))
      .limit(limit)
      .offset(offset);

    // Stats summary
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${outboundCalls.status} = 'completed' then 1 else 0 end)`,
        answered: sql<number>`sum(case when ${outboundCalls.outcome} = 'answered' then 1 else 0 end)`,
        noAnswer: sql<number>`sum(case when ${outboundCalls.outcome} in ('no_answer', 'busy', 'voicemail') then 1 else 0 end)`,
        failed: sql<number>`sum(case when ${outboundCalls.status} = 'failed' then 1 else 0 end)`,
        consentBlocked: sql<number>`sum(case when ${outboundCalls.status} = 'consent_blocked' then 1 else 0 end)`,
        scheduled: sql<number>`sum(case when ${outboundCalls.status} in ('scheduled', 'retry') then 1 else 0 end)`,
        avgDuration: sql<number>`avg(case when ${outboundCalls.duration} > 0 then ${outboundCalls.duration} end)`,
      })
      .from(outboundCalls);

    return NextResponse.json({
      calls: rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      stats: {
        total: stats?.total ?? 0,
        completed: stats?.completed ?? 0,
        answered: stats?.answered ?? 0,
        noAnswer: stats?.noAnswer ?? 0,
        failed: stats?.failed ?? 0,
        consentBlocked: stats?.consentBlocked ?? 0,
        scheduled: stats?.scheduled ?? 0,
        avgDuration: Math.round(stats?.avgDuration ?? 0),
      },
    });
  } catch (error) {
    reportError("Admin outbound GET error", error);
    return NextResponse.json({ error: "Failed to load outbound calls" }, { status: 500 });
  }
}
