import { NextRequest, NextResponse } from "next/server";
import { runRetentionCleanup } from "@/lib/compliance/retention";

/**
 * POST /api/compliance/retention
 * Weekly cron — data retention cleanup
 * Schedule: 0 9 * * 0 (Sundays 9 AM UTC / 3 AM CT)
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runRetentionCleanup();
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Retention cleanup error:", error);
    return NextResponse.json({ error: "Retention cleanup failed" }, { status: 500 });
  }
}
