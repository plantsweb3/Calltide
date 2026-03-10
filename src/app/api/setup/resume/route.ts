import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { cookies } from "next/headers";

const COOKIE_NAME = "capta_setup";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * GET /api/setup/resume?token=xxx
 * Resume from retarget email link — validates token, sets cookie, redirects to /setup?step=N
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-resume:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta.app";
    return NextResponse.redirect(`${appUrl}/setup`);
  }

  const [session] = await db
    .select()
    .from(setupSessions)
    .where(eq(setupSessions.token, token))
    .limit(1);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta.app";

  if (!session || session.status === "converted") {
    return NextResponse.redirect(`${appUrl}/setup`);
  }

  // Set cookie so the session persists
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Update last active
  await db
    .update(setupSessions)
    .set({
      lastActiveAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(setupSessions.id, session.id));

  // Redirect to setup page at their current step
  const step = session.currentStep || 1;
  return NextResponse.redirect(`${appUrl}/setup?step=${step}`);
}
