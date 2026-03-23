import { NextRequest, NextResponse } from "next/server";
import { getConcurrentCallCount, cleanupStaleCalls } from "@/lib/capacity/providers";
import { PROVIDER_LIMITS } from "@/lib/capacity/config";
import { checkThresholds } from "@/lib/capacity/thresholds";
import { reportError } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    // 1. Get concurrent call count
    const concurrent = await getConcurrentCallCount();

    // 2. Check against ElevenLabs concurrent limit
    await checkThresholds([
      {
        provider: "ElevenLabs",
        metric: "concurrent_connections",
        currentValue: concurrent,
        limitValue: PROVIDER_LIMITS.elevenlabs.concurrentLimit,
      },
    ]);

    // 3. Clean up stale calls (>30 min old)
    const staleRemoved = await cleanupStaleCalls();

    return NextResponse.json({
      ok: true,
      concurrent,
      limit: PROVIDER_LIMITS.elevenlabs.concurrentLimit,
      staleRemoved,
    });
  } catch (err) {
    reportError("[capacity real-time] Error", err);
    return NextResponse.json(
      { error: "Real-time check failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
