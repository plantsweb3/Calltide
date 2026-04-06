import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executeNextStep } from "@/lib/outreach/orchestrator";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/outreach-sequence
 *
 * Auto-advances outreach sequences for all active prospects.
 * Checks each prospect with status "outreach_active" and sends
 * the next message in their sequence if the delay has elapsed.
 *
 * Processes up to 25 prospects per run.
 * Schedule: daily at 10 AM CT (3 PM UTC)
 */
const MAX_PER_RUN = 25;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("outreach-sequence", "0 15 * * *", async () => {
    let advanced = 0;
    let waiting = 0;
    let completed = 0;
    let errors = 0;

    try {
      const activeProspects = await db
        .select({ id: prospects.id, businessName: prospects.businessName })
        .from(prospects)
        .where(eq(prospects.status, "outreach_active"))
        .limit(MAX_PER_RUN);

      for (const prospect of activeProspects) {
        try {
          const result = await executeNextStep(prospect.id);

          if (result.success && result.action === "sequence_complete") {
            // Mark prospect as sequence complete
            await db
              .update(prospects)
              .set({
                status: "outreach_paused",
                updatedAt: new Date().toISOString(),
              })
              .where(eq(prospects.id, prospect.id));
            completed++;
          } else if (result.success) {
            advanced++;
          } else if (result.error === "Waiting for delay period") {
            waiting++;
          } else {
            reportWarning("[outreach-sequence] Skip prospect", { businessName: prospect.businessName, error: result.error });
          }
        } catch (err) {
          errors++;
          reportError(`[outreach-sequence] Failed for ${prospect.businessName}`, err);
        }
      }

      reportWarning("[outreach-sequence] Done", { advanced, waiting, completed, errors });

      return NextResponse.json({
        success: true,
        advanced,
        waiting,
        completed,
        errors,
        total: activeProspects.length,
      });
    } catch (err) {
      reportError("[outreach-sequence] Fatal error", err);
      return NextResponse.json({ error: "Outreach sequence failed" }, { status: 500 });
    }
  });
}
