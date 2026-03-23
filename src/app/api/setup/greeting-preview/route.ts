import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";
import { VOICE_MAP } from "@/lib/elevenlabs/agent-config";
import { PERSONALITY_PRESETS, type PersonalityPreset } from "@/lib/receptionist/personalities";
import { reportError } from "@/lib/error-reporting";

const schema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  personality: z.enum(["professional", "friendly", "warm"]).optional(),
  receptionistName: z.string().min(1).max(50).optional(),
  lang: z.enum(["en", "es"]).default("en"),
  voiceId: z.string().max(50).optional(),
  text: z.string().min(1).max(500).optional(),
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

  const { businessName, personality, receptionistName, lang, voiceId, text } = parsed.data;

  // Direct text TTS mode (voice preview)
  let greetingText: string;
  if (text) {
    greetingText = text;
  } else if (businessName && personality && receptionistName) {
    const preset = PERSONALITY_PRESETS[personality as PersonalityPreset] || PERSONALITY_PRESETS.friendly;
    greetingText = preset.greetingTemplate[lang](receptionistName, businessName);
  } else {
    return NextResponse.json({ error: "Provide text or businessName+personality+receptionistName" }, { status: 400 });
  }

  // Try ElevenLabs TTS
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const client = getElevenLabsClient();
      const resolvedVoiceId = voiceId || (personality && VOICE_MAP[personality]) || VOICE_MAP.friendly;

      const audioStream = await client.textToSpeech.convert(resolvedVoiceId, {
        text: greetingText,
        model_id: "eleven_flash_v2_5",
      });

      // Collect stream into buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of audioStream) {
        chunks.push(new Uint8Array(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err) {
      reportError("ElevenLabs TTS failed for greeting preview", err);
      // Fall through to text-only response
    }
  }

  // Graceful degradation: return text for browser SpeechSynthesis
  return NextResponse.json({ text: greetingText, fallback: true });
}
