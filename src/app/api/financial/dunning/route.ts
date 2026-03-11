import { NextRequest, NextResponse } from "next/server";
import { processDunning } from "@/lib/financial/dunning";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  return withCronMonitor("dunning", "30 16 * * *", async () => {
    try {
      const results = await processDunning();
      return NextResponse.json({ ok: true, ...results });
    } catch (err) {
      reportError("[dunning cron] Error", err);
      return NextResponse.json(
        { error: "Dunning processing failed" },
        { status: 500 },
      );
    }
  });
}

// Allow GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
