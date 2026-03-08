import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions, setupRetargetEmails } from "@/db/schema";
import { and, eq, lt, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/cron/setup-cleanup
 *
 * Weekly cron — deletes setup sessions older than 90 days
 * with status 'abandoned'. Cleans up associated retarget emails.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString();

    // Find old abandoned sessions
    const oldSessions = await db
      .select({ id: setupSessions.id })
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.status, "abandoned"),
          lt(setupSessions.createdAt, cutoffStr),
        ),
      );

    if (oldSessions.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    const sessionIds = oldSessions.map((s) => s.id);

    // Delete retarget emails first (FK constraint)
    await db
      .delete(setupRetargetEmails)
      .where(inArray(setupRetargetEmails.setupSessionId, sessionIds));

    // Delete sessions
    const result = await db
      .delete(setupSessions)
      .where(inArray(setupSessions.id, sessionIds));

    return NextResponse.json({
      success: true,
      deleted: oldSessions.length,
    });
  } catch (error) {
    reportError("Setup cleanup cron error", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
