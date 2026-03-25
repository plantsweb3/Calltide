import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`google-status:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const [conn] = await db
      .select({
        googleEmail: googleCalendarConnections.googleEmail,
        calendarId: googleCalendarConnections.calendarId,
        connectedAt: googleCalendarConnections.connectedAt,
        lastSyncAt: googleCalendarConnections.lastSyncAt,
        syncEnabled: googleCalendarConnections.syncEnabled,
      })
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.businessId, businessId))
      .limit(1);

    if (!conn) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      googleEmail: conn.googleEmail,
      calendarId: conn.calendarId,
      connectedAt: conn.connectedAt,
      lastSyncAt: conn.lastSyncAt,
      syncEnabled: conn.syncEnabled,
    });
  } catch (err) {
    reportError("Failed to fetch Google Calendar status", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
