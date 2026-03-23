import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activeCalls } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/dashboard/active-calls
 *
 * Returns currently active calls for the business.
 * Used by dashboard overview to show live call indicators.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: activeCalls.id,
      callerPhone: activeCalls.callerPhone,
      customerName: activeCalls.customerName,
      isReturningCaller: activeCalls.isReturningCaller,
      direction: activeCalls.direction,
      language: activeCalls.language,
      status: activeCalls.status,
      currentIntent: activeCalls.currentIntent,
      startedAt: activeCalls.startedAt,
      durationSeconds: activeCalls.durationSeconds,
    })
    .from(activeCalls)
    .where(eq(activeCalls.businessId, businessId));

  return NextResponse.json({ activeCalls: rows });
}
