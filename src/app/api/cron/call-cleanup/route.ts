import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { reportWarning } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/call-cleanup
 * Sweeps zombie calls stuck in "in_progress" older than 30 minutes → marks as "failed".
 * Runs every 15 minutes to prevent zombie calls from blocking concurrent call slots.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Query IDs first for logging (with safety bound)
  const zombies = await db
    .select({ id: calls.id })
    .from(calls)
    .where(
      and(
        eq(calls.status, "in_progress"),
        lt(calls.createdAt, thirtyMinAgo),
      ),
    )
    .limit(200);

  let cleaned = 0;
  if (zombies.length > 0) {
    // Batch update all zombie calls at once
    await db
      .update(calls)
      .set({
        status: "failed",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(calls.status, "in_progress"),
          lt(calls.createdAt, thirtyMinAgo),
        ),
      );
    cleaned = zombies.length;

    reportWarning(`[call-cleanup] Cleaned ${cleaned} zombie call(s)`, {
      callIds: zombies.map((z) => z.id),
    });
  }

  return NextResponse.json({ ok: true, cleaned });
}
