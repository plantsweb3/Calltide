import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { processAllDigests } from "@/lib/digest/send";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/daily-summary
 * Sends a daily digest to every active business owner.
 * Runs at 23:00 UTC (6 PM Central) — all current clients are in Texas.
 * Replaces the generic stats SMS with a rich briefing from Maria including
 * new leads, job card estimates, tomorrow's appointments, and action items.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("daily-summary", "0 23 * * *", async () => {
    try {
      const result = await processAllDigests();

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (err) {
      reportError("[daily-summary] Fatal error", err);
      return NextResponse.json({ error: "Daily summary failed" }, { status: 500 });
    }
  });
}
