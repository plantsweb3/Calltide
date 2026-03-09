import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobIntakes, calls, leads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")), 100);
  const offset = (page - 1) * limit;
  const callId = req.nextUrl.searchParams.get("call_id");

  // If call_id is provided, return intakes for that specific call
  if (callId) {
    const intakes = await db
      .select()
      .from(jobIntakes)
      .where(eq(jobIntakes.callId, callId))
      .orderBy(desc(jobIntakes.createdAt));

    return NextResponse.json({ intakes });
  }

  // Otherwise return paginated intakes for the business
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
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ intakes, page, limit });
}
