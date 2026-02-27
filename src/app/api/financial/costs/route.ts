import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, clientCosts } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate for previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${monthStr}-01T00:00:00`;
    const nextMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00`;

    // Get all active businesses
    const activeBiz = await db
      .select()
      .from(businesses)
      .where(eq(businesses.active, true));

    let processed = 0;

    for (const biz of activeBiz) {
      // Query call data for previous month
      const [callData] = await db
        .select({
          totalMinutes: sql<number>`COALESCE(SUM(${calls.duration}), 0) / 60.0`,
          callCount: sql<number>`COUNT(*)`,
        })
        .from(calls)
        .where(
          and(
            eq(calls.businessId, biz.id),
            gte(calls.createdAt, monthStart),
            lt(calls.createdAt, nextMonthStart),
          ),
        );

      const minutes = callData?.totalMinutes ?? 0;
      const callCount = callData?.callCount ?? 0;

      // Estimate costs (in cents)
      const twilioCost = Math.round(minutes * 1.3); // $0.013/min = 1.3 cents
      const humeCost = Math.round(minutes * 5); // $0.05/min = 5 cents
      const anthropicCost = Math.round(callCount * 3); // $0.03/call = 3 cents
      const totalCost = twilioCost + humeCost + anthropicCost;
      const revenue = biz.mrr ?? 49700;
      const margin = revenue - totalCost;
      const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

      await db.insert(clientCosts).values({
        businessId: biz.id,
        month: monthStr,
        callMinutes: minutes,
        callCount,
        smsCount: 0, // TODO: query SMS count when SMS logging is available
        twilioCost,
        humeCost,
        anthropicCost,
        totalCost,
        revenue,
        margin,
        marginPct,
      });

      processed++;
    }

    return NextResponse.json({ ok: true, month: monthStr, processed });
  } catch (err) {
    console.error("[costs] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cost calculation failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
