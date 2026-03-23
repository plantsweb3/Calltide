import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { buildSetupTestPrompt } from "@/lib/receptionist/setup-test-prompt";
import { PERSONALITY_PRESETS, type PersonalityPreset } from "@/lib/receptionist/personalities";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";
import { VOICE_MAP } from "@/lib/elevenlabs/agent-config";
import { cookies } from "next/headers";

const COOKIE_NAME = "capta_setup";
const DEMO_AGENT_ID = process.env.ELEVENLABS_DEMO_AGENT_ID;

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

  // Get ElevenLabs signed URL
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !DEMO_AGENT_ID) {
    return NextResponse.json({ error: "Voice system not configured" }, { status: 500 });
  }

  let signedUrl: string;
  try {
    const client = getElevenLabsClient();
    const response = await client.conversationalAi.getSignedUrl({
      agent_id: DEMO_AGENT_ID,
    });
    signedUrl = response.signed_url;
  } catch {
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
    signedUrl,
    systemPrompt,
    greeting: preset.greetingTemplate[lang](name, bizName),
    voiceId: VOICE_MAP[presetKey] || VOICE_MAP.friendly,
    maxDuration: 120,
  });
}
