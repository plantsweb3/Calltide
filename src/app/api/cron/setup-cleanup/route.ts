import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions, setupRetargetEmails, usedMagicTokens } from "@/db/schema";
import { and, eq, lt, inArray, isNull, or, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

/**
 * GET /api/cron/setup-cleanup
 *
 * Weekly cron — cleans up old setup sessions:
 * 1. Deletes abandoned sessions older than 90 days
 * 2. Deletes stale active sessions (no email, older than 30 days)
 *    that can never be retargeted
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("setup-cleanup", "0 0 * * 0", async () => {
    try {
      const abandonedCutoff = new Date();
      abandonedCutoff.setDate(abandonedCutoff.getDate() - 90);

      const staleCutoff = new Date();
      staleCutoff.setDate(staleCutoff.getDate() - 30);

      // Find sessions to delete:
      // 1. Abandoned sessions older than 90 days
      // 2. Active sessions with no email, older than 30 days (anonymous, can't retarget)
      const oldSessions = await db
        .select({ id: setupSessions.id })
        .from(setupSessions)
        .where(
          or(
            and(
              eq(setupSessions.status, "abandoned"),
              lt(setupSessions.createdAt, abandonedCutoff.toISOString()),
            ),
            and(
              eq(setupSessions.status, "active"),
              isNull(setupSessions.ownerEmail),
              lt(setupSessions.createdAt, staleCutoff.toISOString()),
            ),
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
      await db
        .delete(setupSessions)
        .where(inArray(setupSessions.id, sessionIds));

      // Clean up expired magic login tokens (older than 24 hours)
      let expiredTokens = 0;
      try {
        const tokenResult = await db
          .delete(usedMagicTokens)
          .where(lt(usedMagicTokens.createdAt, sql`datetime('now', '-24 hours')`));
        expiredTokens = tokenResult.rowsAffected ?? 0;
      } catch (err) {
        reportError("Magic token cleanup failed", err);
      }

      return NextResponse.json({
        success: true,
        deleted: oldSessions.length,
        expiredTokensDeleted: expiredTokens,
      });
    } catch (error) {
      reportError("Setup cleanup cron error", error);
      return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
    }
  });
}
