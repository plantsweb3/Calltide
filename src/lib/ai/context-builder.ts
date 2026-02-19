import { db } from "@/db";
import { businesses, leads } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { BusinessContext, Language } from "@/types";

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
  };
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
    "cuánto", "cuándo", "dónde", "cómo",
  ];
  const lower = text.toLowerCase();
  const matches = spanishIndicators.filter((w) => lower.includes(w));
  return matches.length >= 2 ? "es" : "en";
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
