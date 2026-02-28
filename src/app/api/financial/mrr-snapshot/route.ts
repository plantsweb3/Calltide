import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, mrrSnapshots, subscriptionEvents } from "@/db/schema";
import { eq, sql, and, gte, inArray } from "drizzle-orm";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Calculate current MRR from active + past_due subscriptions
    const [mrrResult] = await db
      .select({
        totalMrr: sql<number>`COALESCE(SUM(${businesses.mrr}), 0)`,
        activeCount: sql<number>`COUNT(CASE WHEN ${businesses.stripeSubscriptionStatus} = 'active' THEN 1 END)`,
        pastDueCount: sql<number>`COUNT(CASE WHEN ${businesses.stripeSubscriptionStatus} = 'past_due' THEN 1 END)`,
      })
      .from(businesses)
      .where(
        inArray(businesses.stripeSubscriptionStatus, ["active", "past_due"]),
      );

    // Count today's subscription events
    const todayStart = `${today}T00:00:00`;
    const [events] = await db
      .select({
        newClients: sql<number>`COUNT(CASE WHEN ${subscriptionEvents.changeType} = 'created' THEN 1 END)`,
        churnedClients: sql<number>`COUNT(CASE WHEN ${subscriptionEvents.changeType} = 'canceled' THEN 1 END)`,
        recoveredClients: sql<number>`COUNT(CASE WHEN ${subscriptionEvents.changeType} = 'recovered' THEN 1 END)`,
      })
      .from(subscriptionEvents)
      .where(gte(subscriptionEvents.createdAt, todayStart));

    const mrr = mrrResult?.totalMrr ?? 0;

    await db.insert(mrrSnapshots).values({
      date: today,
      mrr,
      arr: mrr * 12,
      activeClients: mrrResult?.activeCount ?? 0,
      pastDueClients: mrrResult?.pastDueCount ?? 0,
      newClients: events?.newClients ?? 0,
      churnedClients: events?.churnedClients ?? 0,
      recoveredClients: events?.recoveredClients ?? 0,
    });

    return NextResponse.json({
      ok: true,
      date: today,
      mrr,
      arr: mrr * 12,
      activeClients: mrrResult?.activeCount ?? 0,
      pastDueClients: mrrResult?.pastDueCount ?? 0,
    });
  } catch (err) {
    console.error("[mrr-snapshot] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MRR snapshot failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
