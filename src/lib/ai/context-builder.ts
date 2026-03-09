import { db } from "@/db";
import { businesses, leads } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { BusinessContext, Language } from "@/types";
import { getBusinessIntakeQuestions, formatIntakeForPrompt } from "@/lib/intake";

/**
 * Look up business by the Twilio number that was called.
 */
export async function getBusinessByPhone(twilioNumber: string): Promise<BusinessContext | null> {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.twilioNumber, twilioNumber), eq(businesses.active, true)))
    .limit(1);

  if (!biz) return null;

  return toBizContext(biz);
}

/**
 * Look up business by ID.
 */
export async function getBusinessById(businessId: string): Promise<BusinessContext | null> {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) return null;

  return toBizContext(biz);
}

function toBizContext(biz: typeof businesses.$inferSelect): BusinessContext {
  return {
    id: biz.id,
    name: biz.name,
    type: biz.type,
    ownerName: biz.ownerName,
    ownerPhone: biz.ownerPhone,
    twilioNumber: biz.twilioNumber,
    services: biz.services as string[],
    businessHours: biz.businessHours as Record<string, { open: string; close: string }>,
    language: biz.defaultLanguage as Language,
    timezone: biz.timezone,
    greeting: biz.greeting || undefined,
    greetingEs: biz.greetingEs || undefined,
    serviceArea: biz.serviceArea || undefined,
    additionalInfo: biz.additionalInfo || undefined,
    emergencyPhone: biz.emergencyPhone || undefined,
    personalityNotes: biz.personalityNotes || undefined,
    receptionistName: biz.receptionistName || undefined,
    personalityPreset: biz.personalityPreset || undefined,
    hasPricingEnabled: biz.hasPricingEnabled ?? false,
    estimateMode: biz.estimateMode || "quick",
    accountId: biz.accountId || undefined,
  };
}

/**
 * Detect language from message content. Simple heuristic — looks for common Spanish words.
 */
export function detectLanguage(text: string): Language {
  const spanishIndicators = [
    "hola", "buenos", "buenas", "necesito", "quiero", "tiene",
    "puede", "cita", "servicio", "ayuda", "gracias", "por favor",
    "llamar", "hablar", "problema", "emergencia", "plomero",
    "cuánto", "cuándo", "dónde", "cómo", "sí", "señor", "señora",
    "disculpe", "perdón", "número", "teléfono", "dirección",
  ];
  const lower = text.toLowerCase();
  const matches = spanishIndicators.filter((w) => lower.includes(w));
  // Single strong indicator (greeting/polite word) is enough to switch
  return matches.length >= 1 ? "es" : "en";
}

/**
 * Build the intake question block for the system prompt.
 * Returns both residential and commercial question sets so Maria can
 * switch mid-call if she detects commercial scope.
 */
export async function buildIntakeContext(businessId: string, tradeType: string, lang: Language = "en"): Promise<string | null> {
  try {
    const [residential, commercial] = await Promise.all([
      getBusinessIntakeQuestions(businessId, tradeType, "residential"),
      getBusinessIntakeQuestions(businessId, tradeType, "commercial"),
    ]);

    if (residential.length === 0 && commercial.length === 0) return null;

    const resBlock = residential.length > 0 ? formatIntakeForPrompt(residential, lang) : "";
    const comBlock = commercial.length > 0 ? formatIntakeForPrompt(commercial, lang) : "";

    const lines: string[] = [];
    if (resBlock) {
      lines.push(lang === "en" ? "### Residential Intake Questions" : "### Preguntas de Intake Residencial");
      lines.push(resBlock);
    }
    if (comBlock) {
      lines.push("");
      lines.push(lang === "en" ? "### Commercial Intake Questions (use if commercial scope detected)" : "### Preguntas de Intake Comercial (usar si se detecta alcance comercial)");
      lines.push(comBlock);
    }

    return lines.join("\n");
  } catch {
    return null;
  }
}

/**
 * Find or create a lead by phone number for a business.
 */
export async function findOrCreateLead(businessId: string, phone: string) {
  const [existing] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.businessId, businessId), eq(leads.phone, phone)))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(leads)
    .values({ businessId, phone, source: "inbound_call" })
    .returning();

  return created;
}
