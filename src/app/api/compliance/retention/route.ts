import { NextRequest, NextResponse } from "next/server";
import { runRetentionCleanup } from "@/lib/compliance/retention";
import { reportError } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/compliance/retention
 * Weekly cron — data retention cleanup
 * Schedule: 0 9 * * 0 (Sundays 9 AM UTC / 3 AM CT)
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    const results = await runRetentionCleanup();
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    reportError("Retention cleanup error", error);
    return NextResponse.json({ error: "Retention cleanup failed" }, { status: 500 });
  }
}
