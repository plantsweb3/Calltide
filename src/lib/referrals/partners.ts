import { db } from "@/db";
import { businessPartners, partnerReferrals, businesses, leads } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";
import { TRADE_PROFILES } from "@/lib/receptionist/trade-profiles";

// ── Types ──

interface Partner {
  id: string;
  partnerName: string;
  partnerTrade: string;
  partnerPhone: string;
  partnerContactName: string | null;
  partnerEmail: string | null;
  partnerBusinessId: string | null;
  relationship: string;
  notes: string | null;
}

interface LogReferralParams {
  referringBusinessId: string;
  partnerId: string;
  callId?: string;
  callerName?: string;
  callerPhone?: string;
  requestedTrade: string;
  jobDescription?: string;
  referralMethod?: string;
}

interface NotifyPartnerParams {
  referralId: string;
}

interface SendPartnerInfoParams {
  callerPhone: string;
  businessId: string;
  partner: Partner;
  language: "en" | "es";
  leadId?: string;
  callId?: string;
}

// ── Partner Lookup ──

/**
 * Get all active partners for a business, optionally filtered by trade.
 * Ordered by relationship priority: preferred → trusted → occasional.
 */
export async function getPartners(businessId: string, tradeFilter?: string): Promise<Partner[]> {
  const conditions = [
    eq(businessPartners.businessId, businessId),
    eq(businessPartners.active, true),
  ];

  if (tradeFilter) {
    conditions.push(eq(businessPartners.partnerTrade, tradeFilter));
  }

  const rows = await db
    .select({
      id: businessPartners.id,
      partnerName: businessPartners.partnerName,
      partnerTrade: businessPartners.partnerTrade,
      partnerPhone: businessPartners.partnerPhone,
      partnerContactName: businessPartners.partnerContactName,
      partnerEmail: businessPartners.partnerEmail,
      partnerBusinessId: businessPartners.partnerBusinessId,
      relationship: businessPartners.relationship,
      notes: businessPartners.notes,
    })
    .from(businessPartners)
    .where(and(...conditions));

  // Sort by relationship priority
  const priority: Record<string, number> = { preferred: 0, trusted: 1, occasional: 2 };
  return rows.sort((a, b) => (priority[a.relationship] ?? 3) - (priority[b.relationship] ?? 3));
}

/**
 * Find the best partner for a specific trade.
 * Returns the highest-priority active partner, or null if none found.
 */
export async function findBestPartner(businessId: string, requestedTrade: string): Promise<Partner | null> {
  // Try exact trade match first
  const exact = await getPartners(businessId, requestedTrade);
  if (exact.length > 0) return exact[0];

  // Try matching by trade label (e.g. "Plumbing" → "plumbing")
  const tradeKey = requestedTrade.toLowerCase().replace(/\s+/g, "_");
  const profile = TRADE_PROFILES[tradeKey as keyof typeof TRADE_PROFILES];
  if (profile) {
    const byLabel = await getPartners(businessId);
    const match = byLabel.find(
      (p) =>
        p.partnerTrade.toLowerCase() === tradeKey ||
        p.partnerTrade.toLowerCase() === profile.label.toLowerCase(),
    );
    if (match) return match;
  }

  return null;
}

// ── Referral Logging ──

/**
 * Record a referral in the database.
 */
export async function logReferral(params: LogReferralParams): Promise<string> {
  const [row] = await db
    .insert(partnerReferrals)
    .values({
      referringBusinessId: params.referringBusinessId,
      partnerId: params.partnerId,
      callId: params.callId,
      callerName: params.callerName,
      callerPhone: params.callerPhone,
      requestedTrade: params.requestedTrade,
      jobDescription: params.jobDescription,
      referralMethod: params.referralMethod || "info_shared",
    })
    .returning({ id: partnerReferrals.id });

  return row.id;
}

// ── Partner Notification ──

/**
 * Notify a partner about a new referral via SMS.
 * If the partner is also a Capta client, create a lead in their system too.
 */
export async function notifyPartner(params: NotifyPartnerParams): Promise<void> {
  const [referral] = await db
    .select()
    .from(partnerReferrals)
    .where(eq(partnerReferrals.id, params.referralId))
    .limit(1);

  if (!referral) return;

  const [partner] = await db
    .select()
    .from(businessPartners)
    .where(eq(businessPartners.id, referral.partnerId))
    .limit(1);

  if (!partner) return;

  // Get the referring business info
  const [referringBiz] = await db
    .select({ name: businesses.name, twilioNumber: businesses.twilioNumber })
    .from(businesses)
    .where(eq(businesses.id, referral.referringBusinessId))
    .limit(1);

  if (!referringBiz?.twilioNumber) return;

  // TCPA check for partner phone
  try {
    const smsCheck = await canSendSms(partner.partnerPhone);
    if (!smsCheck.allowed) {
      console.log(`Partner notification blocked by compliance: ${smsCheck.reason}`);
      return;
    }
  } catch {
    return;
  }

  const callerDesc = referral.callerName
    ? `${referral.callerName}${referral.callerPhone ? ` (${referral.callerPhone})` : ""}`
    : referral.callerPhone || (partner.language === "es" ? "un cliente" : "a caller");

  const jobDesc = referral.jobDescription
    ? ` — ${referral.jobDescription.length > 80 ? referral.jobDescription.slice(0, 77) + "..." : referral.jobDescription}`
    : "";

  const contactName = partner.partnerContactName ? ` ${partner.partnerContactName}` : "";
  const body = partner.language === "es"
    ? `Hola${contactName}, ${referringBiz.name} acaba de referir a ${callerDesc} para ${referral.requestedTrade}${jobDesc}. Por favor comuníquese pronto!`
    : `Hi${contactName}, ${referringBiz.name} just referred ${callerDesc} to you for ${referral.requestedTrade}${jobDesc}. Please reach out to them soon!`;

  await sendSMS({
    to: partner.partnerPhone,
    from: referringBiz.twilioNumber,
    body: body.length > 320 ? body.slice(0, 317) + "..." : body,
    businessId: referral.referringBusinessId,
    callId: referral.callId || undefined,
    templateType: "partner_referral",
  });

  // Mark as notified
  await db
    .update(partnerReferrals)
    .set({ partnerNotified: true, referralMethod: "partner_notified" })
    .where(eq(partnerReferrals.id, referral.id));

  // If partner is a Capta client, create a lead in their system
  if (partner.partnerBusinessId && referral.callerPhone) {
    await handleCaptaPartnerReferral(
      partner.partnerBusinessId,
      referral.callerPhone,
      referral.callerName,
      referral.requestedTrade,
      referral.jobDescription,
      referringBiz.name,
    );
  }

  console.log("Partner notified", { referralId: referral.id, partnerId: partner.id });
}

/**
 * Send the caller a text with the partner's contact info.
 */
export async function sendPartnerInfoToCaller(params: SendPartnerInfoParams): Promise<void> {
  const { callerPhone, businessId, partner, language, leadId, callId } = params;

  const [biz] = await db
    .select({ twilioNumber: businesses.twilioNumber })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz?.twilioNumber) return;

  // TCPA check
  try {
    const smsCheck = await canSendSms(callerPhone);
    if (!smsCheck.allowed) return;
  } catch {
    return;
  }

  const tradeLabel =
    TRADE_PROFILES[partner.partnerTrade as keyof typeof TRADE_PROFILES]?.label ||
    partner.partnerTrade;

  const body =
    language === "es"
      ? `Como prometimos, aquí está la información de nuestro socio de ${tradeLabel}: ${partner.partnerName} — ${partner.partnerPhone}. Dígales que lo referimos nosotros!`
      : `As promised, here's our ${tradeLabel} partner's info: ${partner.partnerName} — ${partner.partnerPhone}. Let them know we referred you!`;

  await sendSMS({
    to: callerPhone,
    from: biz.twilioNumber,
    body,
    businessId,
    leadId,
    callId,
    templateType: "partner_info",
  });
}

// ── Cross-Client Intelligence ──

/**
 * When a partner is also a Capta client, create a lead in their system
 * so the referral shows up in their dashboard.
 */
async function handleCaptaPartnerReferral(
  partnerBusinessId: string,
  callerPhone: string,
  callerName: string | null,
  requestedTrade: string,
  jobDescription: string | null,
  referringBusinessName: string,
): Promise<void> {
  try {
    // Check if lead already exists
    const [existing] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.businessId, partnerBusinessId), eq(leads.phone, callerPhone)))
      .limit(1);

    if (existing) return; // Lead already in their system

    await db.insert(leads).values({
      businessId: partnerBusinessId,
      phone: callerPhone,
      name: callerName,
      source: "partner_referral",
      notes: `Referred by ${referringBusinessName} for ${requestedTrade}${jobDescription ? `: ${jobDescription}` : ""}`,
    });
  } catch (err) {
    reportError("Failed to create partner referral lead", err, {
      extra: { partnerBusinessId },
    });
  }
}

// ── Partner Context for System Prompt ──

/**
 * Build the partner context block for the system prompt.
 * Returns a formatted list of available partners so Maria knows who to refer to.
 */
export async function buildPartnerContext(businessId: string, lang: "en" | "es" = "en"): Promise<string | null> {
  const partners = await getPartners(businessId);
  if (partners.length === 0) return null;

  const lines: string[] = [];

  if (lang === "es") {
    lines.push("## Socios de Referencia");
    lines.push("Si el cliente necesita un servicio que NO ofrecemos, puedes referirlo a estos socios:");
  } else {
    lines.push("## Referral Partners");
    lines.push("If the caller needs a service we DON'T offer, you can refer them to these partners:");
  }

  for (const p of partners) {
    const tradeLabel =
      TRADE_PROFILES[p.partnerTrade as keyof typeof TRADE_PROFILES]?.label || p.partnerTrade;
    const priority = p.relationship === "preferred" ? " ⭐" : "";
    lines.push(`- ${tradeLabel}: ${p.partnerName}${priority}`);
  }

  if (lang === "es") {
    lines.push("");
    lines.push("Usa la herramienta `refer_partner` para compartir la información del socio y notificarlo.");
    lines.push("NUNCA inventes socios — solo refiere a los listados arriba.");
  } else {
    lines.push("");
    lines.push("Use the `refer_partner` tool to share partner info and notify them.");
    lines.push("NEVER make up partners — only refer to those listed above.");
  }

  return lines.join("\n");
}

/**
 * Get recent referrals for a business (for dashboard/admin).
 */
export async function getRecentReferrals(businessId: string, limit = 50) {
  return db
    .select({
      id: partnerReferrals.id,
      partnerId: partnerReferrals.partnerId,
      partnerName: businessPartners.partnerName,
      partnerTrade: businessPartners.partnerTrade,
      callId: partnerReferrals.callId,
      callerName: partnerReferrals.callerName,
      callerPhone: partnerReferrals.callerPhone,
      requestedTrade: partnerReferrals.requestedTrade,
      jobDescription: partnerReferrals.jobDescription,
      referralMethod: partnerReferrals.referralMethod,
      partnerNotified: partnerReferrals.partnerNotified,
      outcome: partnerReferrals.outcome,
      createdAt: partnerReferrals.createdAt,
    })
    .from(partnerReferrals)
    .innerJoin(businessPartners, eq(partnerReferrals.partnerId, businessPartners.id))
    .where(eq(partnerReferrals.referringBusinessId, businessId))
    .orderBy(desc(partnerReferrals.createdAt))
    .limit(limit);
}
