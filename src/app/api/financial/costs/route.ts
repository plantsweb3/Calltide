import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, clientCosts, smsMessages } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

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
      // Query call data for previous month (use actual tracked cost from ElevenLabs webhook)
      const [callData] = await db
        .select({
          totalMinutes: sql<number>`COALESCE(SUM(${calls.duration}), 0) / 60.0`,
          callCount: sql<number>`COUNT(*)`,
          voiceCost: sql<number>`COALESCE(SUM(${calls.costCents}), 0)`,
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
      const voiceCostActual = callData?.voiceCost ?? 0;

      // Query SMS count for the month
      const [smsData] = await db
        .select({
          smsCount: sql<number>`COUNT(*)`,
        })
        .from(smsMessages)
        .where(
          and(
            eq(smsMessages.businessId, biz.id),
            gte(smsMessages.createdAt, monthStart),
            lt(smsMessages.createdAt, nextMonthStart),
          ),
        );
      const smsCount = smsData?.smsCount ?? 0;

      // Costs (in cents): actual ElevenLabs cost from webhook, Twilio estimate, Anthropic estimate
      const twilioCost = Math.round(minutes * 1.3 + smsCount * 0.79); // $0.013/min + $0.0079/SMS
      const voiceCost = voiceCostActual; // ElevenLabs cost tracked via webhook
      const anthropicCost = Math.round(callCount * 3); // $0.03/call = 3 cents
      const totalCost = twilioCost + voiceCost + anthropicCost;
      const revenue = biz.mrr ?? 49700;
      const margin = revenue - totalCost;
      const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

      await db.insert(clientCosts).values({
        businessId: biz.id,
        month: monthStr,
        callMinutes: minutes,
        callCount,
        smsCount,
        twilioCost,
        humeCost: voiceCost, // DB column name is legacy from Hume migration
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
    reportError("[costs] Error", err);
    return NextResponse.json(
      { error: "Cost calculation failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
