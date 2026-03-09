import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outboundCalls } from "@/db/schema";
import { and, lte, inArray } from "drizzle-orm";
import { initiateOutboundCall } from "@/lib/outbound/engine";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

/**
 * GET /api/cron/outbound-dispatch
 *
 * Dispatches scheduled outbound calls that are ready to be initiated.
 * Runs every 15 minutes between 10AM-5PM CT.
 * Picks up calls with status "scheduled" or "retry" whose scheduledFor has passed.
 * Processes up to 10 calls per run to stay within execution limits.
 */
const MAX_PER_RUN = 10;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronMonitor("outbound-dispatch", "0 17 * * *", async () => {
    const now = new Date().toISOString();
    let initiated = 0;
    let failed = 0;

    try {
      // Find calls ready to dispatch
      const readyCalls = await db
        .select({ id: outboundCalls.id })
        .from(outboundCalls)
        .where(
          and(
            inArray(outboundCalls.status, ["scheduled", "retry"]),
            lte(outboundCalls.scheduledFor, now),
          ),
        )
        .limit(MAX_PER_RUN);

      for (const call of readyCalls) {
        try {
          const result = await initiateOutboundCall(call.id);
          if (result.success) {
            initiated++;
          } else {
            failed++;
          }
        } catch (err) {
          reportError("Outbound dispatch error", err, {
            extra: { outboundCallId: call.id },
          });
          failed++;
        }
      }

      return NextResponse.json({
        success: true,
        found: readyCalls.length,
        initiated,
        failed,
      });
    } catch (error) {
      reportError("Outbound dispatch cron failed", error);
      return NextResponse.json({ error: "Cron failed" }, { status: 500 });
    }
  });
}
