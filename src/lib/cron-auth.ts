import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verify CRON_SECRET using constant-time comparison.
 * Returns null if valid, or a 401 NextResponse if invalid.
 */
export function verifyCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || token.length !== cronSecret.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret));
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
