import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, manualTouches } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * POST /api/admin/outreach/fix-awaiting
 *
 * One-time fix: move prospects with outreachStatus="attempted" that were
 * texted today to "awaiting", and ensure they have a touch logged.
 */
export async function POST(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all prospects that are "attempted" and were created/updated today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stuckProspects = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.outreachStatus, "attempted"),
        sql`${prospects.updatedAt} >= ${todayStart.toISOString()}`
      )
    );

  let fixed = 0;
  const errors: string[] = [];

  for (const prospect of stuckProspects) {
    try {
      await db
        .update(prospects)
        .set({
          outreachStatus: "awaiting",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(prospects.id, prospect.id));

      const [existingTouch] = await db
        .select({ count: sql<number>`count(*)` })
        .from(manualTouches)
        .where(
          and(
            eq(manualTouches.prospectId, prospect.id),
            sql`${manualTouches.createdAt} >= ${todayStart.toISOString()}`
          )
        );

      if ((existingTouch?.count ?? 0) === 0) {
        await db.insert(manualTouches).values({
          prospectId: prospect.id,
          channel: "sms",
          outcome: "awaiting_response",
          notes: "SMS sent (backfilled)",
        });
      }

      fixed++;
    } catch (err) {
      reportError("fix-awaiting: per-prospect update failed", err, { extra: { prospectId: prospect.id } });
      errors.push(prospect.id);
    }
  }

  return NextResponse.json({
    fixed,
    errorCount: errors.length,
    prospects: stuckProspects.map((p) => p.businessName),
  });
}
