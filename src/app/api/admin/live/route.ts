import { NextResponse } from "next/server";
import { db } from "@/db";
import { activeCalls, callPeaks, calls } from "@/db/schema";
import { eq, desc, count, gte } from "drizzle-orm";

/**
 * GET /api/admin/live
 *
 * Returns active calls, today's peak stats, and recent completed calls.
 * Designed for polling at 3–30 second intervals.
 * Auth handled by admin middleware.
 */
export async function GET() {
  try {
    // 1. Active calls — all rows, sorted by newest first
    const active = await db
      .select()
      .from(activeCalls)
      .orderBy(desc(activeCalls.startedAt));

    // 2. Today's peak stats
    const today = new Date().toISOString().slice(0, 10);
    const [peak] = await db
      .select()
      .from(callPeaks)
      .where(eq(callPeaks.date, today));

    // 3. Recent completed calls (last 10)
    const recent = await db
      .select({
        id: calls.id,
        businessId: calls.businessId,
        callerPhone: calls.callerPhone,
        calledPhone: calls.calledPhone,
        status: calls.status,
        duration: calls.duration,
        outcome: calls.outcome,
        transferRequested: calls.transferRequested,
        createdAt: calls.createdAt,
        updatedAt: calls.updatedAt,
      })
      .from(calls)
      .where(eq(calls.status, "completed"))
      .orderBy(desc(calls.updatedAt))
      .limit(10);

    // 4. Today's call count
    const [todayCount] = await db
      .select({ count: count() })
      .from(calls)
      .where(gte(calls.createdAt, today));

    // 5. Count by status for summary
    const activeByStatus = active.reduce<Record<string, number>>((acc, c) => {
      const status = c.status ?? "unknown";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      activeCalls: active,
      activeCount: active.length,
      activeByStatus,
      peak: peak ?? { peakConcurrent: 0, peakTime: null, totalCalls: 0, avgDuration: 0 },
      recentCompleted: recent,
      todayCallCount: todayCount?.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Live monitoring API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
