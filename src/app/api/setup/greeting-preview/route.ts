import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getHumeClient } from "@/lib/hume/client";
import { PERSONALITY_PRESETS, type PersonalityPreset } from "@/lib/receptionist/personalities";
import { reportError } from "@/lib/error-reporting";

const schema = z.object({
  businessName: z.string().min(1).max(200),
  personality: z.enum(["professional", "friendly", "warm"]),
  receptionistName: z.string().min(1).max(50),
  lang: z.enum(["en", "es"]).default("en"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`greeting-preview:${ip}`, { limit: 10, windowSeconds: 900 });
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { businessName, personality, receptionistName, lang } = parsed.data;

  const preset = PERSONALITY_PRESETS[personality as PersonalityPreset] || PERSONALITY_PRESETS.friendly;
  const greetingText = preset.greetingTemplate[lang](receptionistName, businessName);

  // Try Hume TTS
  if (process.env.HUME_API_KEY) {
    try {
      const client = getHumeClient();
      const response = await client.tts.synthesizeFile({
        utterances: [
          {
            text: greetingText,
            description: personality === "professional"
              ? "A polished, confident female receptionist voice"
              : personality === "warm"
                ? "A warm, gentle, caring female voice"
                : "A friendly, welcoming female voice",
          },
        ],
      });

      const audioData = await response.arrayBuffer();
      const audioBuffer = Buffer.from(audioData);

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mp3",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err) {
      reportError("Hume TTS failed for greeting preview", err);
      // Fall through to text-only response
    }
  }

  // Graceful degradation: return text for browser SpeechSynthesis
  return NextResponse.json({ text: greetingText, fallback: true });
}
