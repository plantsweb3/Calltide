import { NextRequest, NextResponse } from "next/server";
import { fetchAccessToken } from "hume";
import { db } from "@/db";
import { setupSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { buildSetupTestPrompt } from "@/lib/receptionist/setup-test-prompt";
import { PERSONALITY_PRESETS, type PersonalityPreset } from "@/lib/receptionist/personalities";
import { cookies } from "next/headers";

const COOKIE_NAME = "capta_setup";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-test-call:${ip}`, { limit: 3, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  // Load session from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "No setup session found" }, { status: 401 });
  }

  const [session] = await db
    .select()
    .from(setupSessions)
    .where(eq(setupSessions.token, token))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Require at least business name and personality to be set
  if (!session.businessName || !session.personalityPreset) {
    return NextResponse.json({ error: "Complete steps 1-3 first" }, { status: 400 });
  }

  // Get Hume access token
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: "Voice system not configured" }, { status: 500 });
  }

  const accessToken = await fetchAccessToken({ apiKey, secretKey });
  if (!accessToken) {
    return NextResponse.json({ error: "Failed to initialize voice connection" }, { status: 500 });
  }

  const lang = (session.language === "es" ? "es" : "en") as "en" | "es";
  const presetKey = (session.personalityPreset || "friendly") as PersonalityPreset;
  const preset = PERSONALITY_PRESETS[presetKey] || PERSONALITY_PRESETS.friendly;
  const name = session.receptionistName || "Maria";
  const bizName = session.businessName;

  const systemPrompt = buildSetupTestPrompt({
    businessName: bizName,
    businessType: session.businessType || "home services",
    services: (session.services as string[] | null) || [],
    ownerName: session.ownerName || "the owner",
    receptionistName: name,
    personalityPreset: session.personalityPreset || "friendly",
    faqAnswers: (session.faqAnswers as Record<string, string> | null) || {},
    city: session.city || undefined,
  }, lang);

  return NextResponse.json({
    accessToken,
    configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
    systemPrompt,
    greeting: preset.greetingTemplate[lang](name, bizName),
    maxDuration: 120,
  });
}
