import { NextResponse } from "next/server";
import { getConcurrentCallCount, cleanupStaleCalls } from "@/lib/capacity/providers";
import { PROVIDER_LIMITS } from "@/lib/capacity/config";
import { checkThresholds } from "@/lib/capacity/thresholds";
import { reportError } from "@/lib/error-reporting";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get concurrent call count
    const concurrent = await getConcurrentCallCount();

    // 2. Check against Hume concurrent limit
    await checkThresholds([
      {
        provider: "Hume",
        metric: "concurrent_connections",
        currentValue: concurrent,
        limitValue: PROVIDER_LIMITS.hume.concurrentLimit,
      },
    ]);

    // 3. Clean up stale calls (>30 min old)
    const staleRemoved = await cleanupStaleCalls();

    return NextResponse.json({
      ok: true,
      concurrent,
      limit: PROVIDER_LIMITS.hume.concurrentLimit,
      staleRemoved,
    });
  } catch (err) {
    reportError("[capacity real-time] Error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Real-time check failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
