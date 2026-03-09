import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { processAllDigests } from "@/lib/digest/send";

/**
 * GET /api/cron/daily-summary
 * Sends a contractor-oriented daily digest to every active business owner.
 * Runs at 23:00 UTC (6 PM Central) — all current clients are in Texas.
 * Replaces the generic stats SMS with a rich briefing from Maria including
 * new leads, job card estimates, tomorrow's appointments, and action items.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
