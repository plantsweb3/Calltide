import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { cookies } from "next/headers";

const COOKIE_NAME = "capta_setup";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * POST /api/setup/session
 * Create a new setup session, set cookie.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-session:${ip}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json().catch(() => ({}));
    const { utmSource, utmMedium, utmCampaign, refCode, language } = body as {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      refCode?: string;
      language?: string;
    };

    const [session] = await db
      .insert(setupSessions)
      .values({
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        refCode: refCode || null,
        language: language === "es" ? "es" : "en",
      })
      .returning();

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      token: session.token,
      currentStep: session.currentStep,
      language: session.language,
    });
  } catch (err) {
    reportError("[setup/session] Failed to create session", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

/**
 * PATCH /api/setup/session
 * Update session language. Separate from step saves to avoid polluting step data.
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-session-patch:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { language } = body as { language?: string };
    if (language !== "en" && language !== "es") {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    await db
      .update(setupSessions)
      .set({ language, updatedAt: new Date().toISOString() })
      .where(eq(setupSessions.token, token));

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError("[setup/session] Failed to update language", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/**
 * GET /api/setup/session
 * Load session from cookie or ?token= param.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-session-get:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    // Try token from query param first (resume links), then cookie
    const tokenParam = req.nextUrl.searchParams.get("token");
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
    const token = tokenParam || cookieToken;

    if (!token) {
      return NextResponse.json({ session: null });
    }

    const [session] = await db
      .select()
      .from(setupSessions)
      .where(eq(setupSessions.token, token))
      .limit(1);

    // Filter out converted sessions unless explicitly requested (post-payment celebration needs this)
    const includeConverted = req.nextUrl.searchParams.get("include_converted") === "1";
    if (!session || (!includeConverted && session.status === "converted")) {
      return NextResponse.json({ session: null });
    }

    // If we found session via token param but cookie doesn't match, set cookie
    if (tokenParam && tokenParam !== cookieToken) {
      cookieStore.set(COOKIE_NAME, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return NextResponse.json({ session });
  } catch (err) {
    reportError("[setup/session] Failed to load session", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
