import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";

const encoder = new TextEncoder();

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// GET — initiate OAuth flow
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google Calendar integration is not configured" },
      { status: 503 },
    );
  }

  const oauth2 = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
  );

  // Sign state with HMAC to prevent CSRF
  const statePayload = btoa(JSON.stringify({ businessId, ts: Date.now() }));
  const signature = await hmacSign(statePayload, env.CLIENT_AUTH_SECRET);
  const state = `${statePayload}.${signature}`;

  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    state,
  });

  return NextResponse.json({ url });
}

// DELETE — disconnect Google Calendar
export async function DELETE(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [conn] = await db
      .select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.businessId, businessId))
      .limit(1);

    if (conn) {
      // Best-effort token revocation
      try {
        const oauth2 = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
        );
        oauth2.setCredentials({ access_token: conn.accessToken });
        await oauth2.revokeToken(conn.accessToken);
      } catch {
        // Revocation failure is non-critical
      }

      await db
        .delete(googleCalendarConnections)
        .where(eq(googleCalendarConnections.businessId, businessId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError("Failed to disconnect Google Calendar", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
