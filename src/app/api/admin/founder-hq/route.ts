import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, prospects, manualTouches, founderStreaks, revenueMetrics, activityLog } from "@/db/schema";
import { eq, sql, desc, and, gte, inArray } from "drizzle-orm";
import { computeTouchXp, computeLevel } from "@/lib/xp";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use CT timezone for "today" boundaries
    const ctNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const todayStr = `${ctNow.getFullYear()}-${String(ctNow.getMonth() + 1).padStart(2, "0")}-${String(ctNow.getDate()).padStart(2, "0")}`;
    const todayISO = todayStr + "T00:00:00.000Z";

    // Get last week's date for MRR delta
    const ctLastWeek = new Date(ctNow);
    ctLastWeek.setDate(ctLastWeek.getDate() - 7);
    const lastWeekStr = `${ctLastWeek.getFullYear()}-${String(ctLastWeek.getMonth() + 1).padStart(2, "0")}-${String(ctLastWeek.getDate()).padStart(2, "0")}`;

    const [
      streakRow,
      activeClientsResult,
      todayTouchRows,
      pipelineCounts,
      latestMrr,
      lastWeekMrr,
      todayActivityRows,
      overdueFollowUps,
    ] = await Promise.all([
      // Streak data
      db.select().from(founderStreaks).where(eq(founderStreaks.streakType, "outreach")).limit(1),

      // Active clients count
      db.select({ count: sql<number>`count(*)` }).from(businesses).where(eq(businesses.active, true)),

      // Today's touches (for XP calculation)
      db.select().from(manualTouches).where(gte(manualTouches.createdAt, todayISO)),

      // Pipeline counts by outreach_status
      db.select({
        status: prospects.outreachStatus,
        count: sql<number>`count(*)`,
      }).from(prospects).where(
        sql`${prospects.outreachStatus} NOT IN ('not_interested', 'disqualified')`
      ).groupBy(prospects.outreachStatus),

      // Latest MRR
      db.select({ mrr: revenueMetrics.mrr }).from(revenueMetrics).orderBy(desc(revenueMetrics.date)).limit(1),

      // Last week MRR for delta
      db.select({ mrr: revenueMetrics.mrr }).from(revenueMetrics).where(
        sql`${revenueMetrics.date} <= ${lastWeekStr}`
      ).orderBy(desc(revenueMetrics.date)).limit(1),

      // Today's activity log entries (manual touches)
      db.select().from(activityLog).where(
        and(
          gte(activityLog.createdAt, todayISO),
          eq(activityLog.type, "manual_touch"),
        )
      ).orderBy(desc(activityLog.createdAt)).limit(50),

      // Overdue follow-ups count
      db.select({ count: sql<number>`count(*)` }).from(prospects).where(
        and(
          eq(prospects.outreachStatus, "follow_up"),
          sql`${prospects.nextFollowUpAt} < ${todayISO}`,
        )
      ),
    ]);

    // Compute today's XP from touches
    let todayXp = 0;
    for (const t of todayTouchRows) {
      todayXp += computeTouchXp(t.channel, t.outcome);
    }

    const streak = streakRow[0] ?? { currentStreak: 0, longestStreak: 0, lastHitDate: null, totalXp: 0 };
    const activeClients = activeClientsResult[0]?.count ?? 0;
    const { level, nextLevelAt } = computeLevel(activeClients);

    // revenueMetrics.mrr is stored in dollars
    const currentMrr = latestMrr[0]?.mrr ?? 0;
    const prevMrr = lastWeekMrr[0]?.mrr ?? 0;
    const mrrDelta = currentMrr - prevMrr;

    // Build pipeline object
    const pipelineMap: Record<string, number> = {};
    for (const row of pipelineCounts) {
      if (row.status) pipelineMap[row.status] = row.count;
    }

    const freshCount = pipelineMap["fresh"] ?? 0;
    const contactedCount = (pipelineMap["attempted"] ?? 0) + (pipelineMap["follow_up"] ?? 0);
    const interestedCount = pipelineMap["interested"] ?? 0;
    const demoCount = pipelineMap["demo_booked"] ?? 0;
    const wonCount = pipelineMap["onboarded"] ?? 0;

    // Fetch top 3 prospect names per pipeline stage
    const [freshTop3, contactedTop3, interestedTop3, demoTop3, wonTop3] = await Promise.all([
      db.select({ id: prospects.id, name: prospects.businessName }).from(prospects).where(eq(prospects.outreachStatus, "fresh")).limit(3),
      db.select({ id: prospects.id, name: prospects.businessName }).from(prospects).where(inArray(prospects.outreachStatus, ["attempted", "follow_up"])).limit(3),
      db.select({ id: prospects.id, name: prospects.businessName }).from(prospects).where(eq(prospects.outreachStatus, "interested")).limit(3),
      db.select({ id: prospects.id, name: prospects.businessName }).from(prospects).where(eq(prospects.outreachStatus, "demo_booked")).limit(3),
      db.select({ id: prospects.id, name: prospects.businessName }).from(prospects).where(eq(prospects.outreachStatus, "onboarded")).limit(3),
    ]);

    // Total pipeline (non-terminal prospects)
    const totalPipeline = freshCount + contactedCount + interestedCount + demoCount;

    // Today's touches count
    const todayTouches = todayTouchRows.length;

    // Build activity log with XP from metadata
    const todayActivity = todayActivityRows.map((a) => {
      const meta = a.metadata as Record<string, unknown> | null;
      const xp = typeof meta?.xp === "number"
        ? meta.xp
        : computeTouchXp(
            (meta?.channel as string) ?? "email",
            (meta?.outcome as string) ?? "no_answer",
          );
      return {
        id: a.id,
        description: a.title,
        xp,
        createdAt: a.createdAt,
      };
    });

    // Time-based action card (CT timezone)
    const hour = ctNow.getHours();
    const overdueCount = overdueFollowUps[0]?.count ?? 0;

    let action: { title: string; description: string; link: string };

    if (overdueCount > 0) {
      action = {
        title: `You have ${overdueCount} overdue follow-up${overdueCount > 1 ? "s" : ""}`,
        description: "Circle back before they go cold",
        link: "/admin/outreach?tab=follow-ups",
      };
    } else if (hour < 12) {
      const touchesRemaining = Math.max(0, 100 - todayTouches);
      action = {
        title: `Start outreach — ${touchesRemaining} touches to go`,
        description: "Hit your Rule of 100 before lunch",
        link: "/admin/outreach",
      };
    } else if (hour < 17) {
      action = {
        title: `Work your pipeline — ${interestedCount} interested lead${interestedCount !== 1 ? "s" : ""}`,
        description: "Move interested prospects toward a demo",
        link: "/admin/outreach?tab=interested",
      };
    } else {
      action = {
        title: "Review today's wins",
        description: `You logged ${todayTouches} touch${todayTouches !== 1 ? "es" : ""} and earned ${todayXp} XP today`,
        link: "/admin/ops-dashboard",
      };
    }

    return NextResponse.json({
      xp: {
        today: todayXp,
        allTime: streak.totalXp ?? 0,
        level,
        nextLevelAt,
      },
      streak: {
        current: streak.currentStreak ?? 0,
        longest: streak.longestStreak ?? 0,
        lastHitDate: streak.lastHitDate,
      },
      metrics: {
        mrr: currentMrr,
        mrrDelta,
        pipeline: totalPipeline,
        todayTouches,
        activeClients,
      },
      pipeline: {
        fresh: { count: freshCount, top3: freshTop3 },
        contacted: { count: contactedCount, top3: contactedTop3 },
        interested: { count: interestedCount, top3: interestedTop3 },
        demo: { count: demoCount, top3: demoTop3 },
        won: { count: wonCount, top3: wonTop3 },
      },
      todayActivity,
      action,
    });
  } catch (error) {
    reportError("Error fetching founder HQ data", error);
    return NextResponse.json({ error: "Failed to load HQ data" }, { status: 500 });
  }
}
