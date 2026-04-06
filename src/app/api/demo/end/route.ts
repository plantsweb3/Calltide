import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRADE_PROFILES, calculateROI, type TradeType } from "@/lib/receptionist/trade-profiles";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const endSchema = z.object({
  sessionId: z.string().min(1),
  durationSeconds: z.number().min(0).optional(),
  transcript: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .optional(),
});

// Fuzzy-match user input to a trade key
const TRADE_ALIASES: Record<string, TradeType> = {
  hvac: "hvac",
  "air conditioning": "hvac",
  ac: "hvac",
  heating: "hvac",
  "heating and cooling": "hvac",
  plumbing: "plumbing",
  plumber: "plumbing",
  electrical: "electrical",
  electrician: "electrical",
  roofing: "roofing",
  roofer: "roofing",
  "general contractor": "general_contractor",
  "general contracting": "general_contractor",
  contractor: "general_contractor",
  gc: "general_contractor",
  remodel: "general_contractor",
  remodeling: "general_contractor",
  restoration: "restoration",
  "water damage": "restoration",
  "fire damage": "restoration",
  mold: "restoration",
  landscaping: "landscaping",
  landscaper: "landscaping",
  "lawn care": "landscaping",
  "pest control": "pest_control",
  pest: "pest_control",
  exterminator: "pest_control",
  "garage door": "garage_door",
  "garage doors": "garage_door",
};

function detectTrade(transcript: { role: string; content: string }[]): TradeType | null {
  const userText = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // Check exact trade labels first
  for (const [key, profile] of Object.entries(TRADE_PROFILES)) {
    if (userText.includes(profile.label.toLowerCase())) return key as TradeType;
  }
  // Check aliases
  for (const [alias, trade] of Object.entries(TRADE_ALIASES)) {
    if (userText.includes(alias)) return trade;
  }
  return null;
}

function detectBusinessName(transcript: { role: string; content: string }[]): string | null {
  const userText = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  // Common patterns: "My business is X", "It's called X", "We're X", business name after "called"
  const patterns = [
    /(?:my (?:business|company|shop) is(?: called)?)\s+([A-Z][A-Za-z\s&'.-]{2,30})/i,
    /(?:it'?s called|we'?re called|name is)\s+([A-Z][A-Za-z\s&'.-]{2,30})/i,
    /(?:we'?re|I'?m with|I run|I own)\s+([A-Z][A-Za-z\s&'.-]{2,30})/i,
  ];
  for (const p of patterns) {
    const match = userText.match(p);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function detectBusinessSize(
  transcript: { role: string; content: string }[],
): string | null {
  const userText = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (/just me|solo|one.?man|by myself|one person/.test(userText)) return "solo";
  if (/small|few guys|couple (?:of )?(?:guys|people|techs)|2|3|4|5/.test(userText)) return "small";
  if (/medium|(?:1[0-9]|2[0-9]|30)\s*(?:guys|people|employees|techs)/.test(userText)) return "medium";
  if (/large|big|multiple locations|50|100/.test(userText)) return "large";
  return null;
}

function estimatePhaseReached(
  transcript: { role: string; content: string }[],
): { reachedROI: boolean; reachedRoleplay: boolean; reachedClose: boolean } {
  const aiText = transcript
    .filter((m) => m.role === "assistant")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  const reachedROI =
    aiText.includes("conservative estimate") ||
    aiText.includes("potential revenue") ||
    aiText.includes("pays for herself") ||
    aiText.includes("monthly loss") ||
    aiText.includes("$497");
  const reachedRoleplay =
    aiText.includes("pretend you") ||
    aiText.includes("roleplay") ||
    aiText.includes("thank you for calling") ||
    aiText.includes("how can i help you today");
  const reachedClose =
    aiText.includes("free trial") ||
    aiText.includes("no charge until day") ||
    aiText.includes("sign up right here") ||
    aiText.includes("$397 on annual") ||
    aiText.includes("no commitment");

  return { reachedROI, reachedRoleplay, reachedClose };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`demo-end:${ip}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  let body: z.infer<typeof endSchema>;
  try {
    body = endSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, durationSeconds, transcript } = body;

  // Extract intelligence from transcript
  let businessType: TradeType | null = null;
  let businessName: string | null = null;
  let businessSize: string | null = null;
  let phases = { reachedROI: false, reachedRoleplay: false, reachedClose: false };
  let estimatedMonthlyLoss: number | null = null;
  let painPoint: string | null = null;

  if (transcript && transcript.length > 0) {
    businessType = detectTrade(transcript);
    businessName = detectBusinessName(transcript);
    businessSize = detectBusinessSize(transcript);
    phases = estimatePhaseReached(transcript);

    if (businessType) {
      const sizeKey = businessSize === "medium" ? "medium" : businessSize === "large" ? "large" : "small";
      const roi = calculateROI(businessType, sizeKey);
      estimatedMonthlyLoss = roi.estimatedMonthlyLoss;
    }

    // Detect pain point from user text
    const userTexts = transcript.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()).join(" ");
    if (userTexts.includes("after hours") || userTexts.includes("night") || userTexts.includes("weekend")) {
      painPoint = "after-hours coverage";
    } else if (userTexts.includes("miss") || userTexts.includes("voicemail")) {
      painPoint = "missed calls";
    } else if (userTexts.includes("spanish") || userTexts.includes("bilingual")) {
      painPoint = "bilingual support";
    } else if (userTexts.includes("busy") || userTexts.includes("field") || userTexts.includes("job site")) {
      painPoint = "can't answer while working";
    }
  }

  // Detect language
  const language = transcript?.some((m) =>
    m.role === "user" &&
    /[áéíóúñ¿¡]|hola|buenos|gracias|llamada/.test(m.content.toLowerCase()),
  )
    ? "es"
    : "en";

  // Update the session record
  await db
    .update(demoSessions)
    .set({
      endedAt: new Date().toISOString(),
      durationSeconds: durationSeconds ?? null,
      businessType,
      businessName,
      businessSize,
      painPoint,
      reachedROI: phases.reachedROI,
      reachedRoleplay: phases.reachedRoleplay,
      reachedClose: phases.reachedClose,
      language,
      estimatedMonthlyLoss,
    })
    .where(eq(demoSessions.id, sessionId));

  // Build conversion card data
  const tradeProfile = businessType ? TRADE_PROFILES[businessType] : null;
  const roi = businessType
    ? calculateROI(businessType, (businessSize === "medium" ? "medium" : businessSize === "large" ? "large" : "small"))
    : null;

  return NextResponse.json({
    businessType,
    businessName,
    businessSize,
    tradeLabel: tradeProfile?.label ?? null,
    estimatedMonthlyLoss,
    callsToPayForMaria: roi?.callsToPayForMaria ?? null,
    roiMultiple: roi?.roiMultiple ?? null,
    roiNote: roi?.note ?? null,
  });
}
