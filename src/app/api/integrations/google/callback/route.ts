import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/db";
import { googleCalendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";

const encoder = new TextEncoder();

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
}

// GET — OAuth callback from Google
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/settings#integrations`;

  if (error) {
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=missing_params`);
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=not_configured`);
  }

  // Verify HMAC-signed state
  const lastDot = state.lastIndexOf(".");
  if (lastDot === -1) {
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=invalid_state`);
  }

  const statePayload = state.slice(0, lastDot);
  const stateSignature = state.slice(lastDot + 1);

  const valid = await hmacVerify(statePayload, stateSignature, env.CLIENT_AUTH_SECRET);
  if (!valid) {
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=invalid_state`);
  }

  let businessId: string;
  try {
    const parsed = JSON.parse(atob(statePayload));
    businessId = parsed.businessId;
    // Reject state tokens older than 15 minutes
    if (Date.now() - parsed.ts > 15 * 60 * 1000) {
      return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=expired`);
    }
  } catch {
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=invalid_state`);
  }

  try {
    const oauth2 = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
    );

    // Exchange code for tokens
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=no_tokens`);
    }

    // Fetch user email
    oauth2.setCredentials(tokens);
    const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
    const userInfo = await oauth2Api.userinfo.get();
    const googleEmail = userInfo.data.email || "unknown";

    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000).toISOString();

    // Upsert connection
    const [existing] = await db
      .select({ id: googleCalendarConnections.id })
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.businessId, businessId))
      .limit(1);

    if (existing) {
      await db
        .update(googleCalendarConnections)
        .set({
          googleEmail,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: expiresAt,
          syncEnabled: true,
          connectedAt: new Date().toISOString(),
        })
        .where(eq(googleCalendarConnections.id, existing.id));
    } else {
      await db.insert(googleCalendarConnections).values({
        businessId,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
      });
    }

    return NextResponse.redirect(`${dashboardUrl}&gcal=connected`);
  } catch (err) {
    reportError("Google Calendar OAuth callback failed", err, { businessId });
    return NextResponse.redirect(`${dashboardUrl}&gcal=error&reason=exchange_failed`);
  }
}
