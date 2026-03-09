import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobIntakes, calls, leads } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50")), 100);

  const [totalResult] = await db
    .select({ count: count() })
    .from(jobIntakes)
    .where(eq(jobIntakes.businessId, businessId));

  const [completedResult] = await db
    .select({ count: count() })
    .from(jobIntakes)
    .where(and(eq(jobIntakes.businessId, businessId), eq(jobIntakes.intakeComplete, true)));

  const intakes = await db
    .select({
      id: jobIntakes.id,
      tradeType: jobIntakes.tradeType,
      scopeLevel: jobIntakes.scopeLevel,
      answersJson: jobIntakes.answersJson,
      scopeDescription: jobIntakes.scopeDescription,
      urgency: jobIntakes.urgency,
      intakeComplete: jobIntakes.intakeComplete,
      createdAt: jobIntakes.createdAt,
      callId: jobIntakes.callId,
      leadId: jobIntakes.leadId,
      callerPhone: calls.callerPhone,
      leadName: leads.name,
    })
    .from(jobIntakes)
    .leftJoin(calls, eq(jobIntakes.callId, calls.id))
    .leftJoin(leads, eq(jobIntakes.leadId, leads.id))
    .where(eq(jobIntakes.businessId, businessId))
    .orderBy(desc(jobIntakes.createdAt))
    .limit(limit);

  return NextResponse.json({
    intakes,
    total: totalResult.count,
    completed: completedResult.count,
    completionRate: totalResult.count > 0
      ? Math.round((completedResult.count / totalResult.count) * 100)
      : 0,
  });
}
