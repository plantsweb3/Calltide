import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/hume/token — DEPRECATED
 * Redirects to /api/voice/token for backwards compatibility.
 */
export async function GET(req: NextRequest) {
  const url = new URL("/api/voice/token", req.url);
  return NextResponse.redirect(url, 307);
}
