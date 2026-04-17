import { db } from "@/db";
import { jobCards, jobIntakes, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateEstimate } from "./generator";

interface BuildJobCardParams {
  businessId: string;
  callId: string;
  jobIntakeId: string;
  leadId?: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
}

export interface JobCard {
  id: string;
  businessId: string;
  callId: string;
  leadId: string | null;
  jobIntakeId: string;
  callerName: string | null;
  callerPhone: string | null;
  jobTypeKey: string | null;
  jobTypeLabel: string | null;
  scopeLevel: string | null;
  scopeDescription: string | null;
  estimateMode: string | null;
  estimateMin: number | null;
  estimateMax: number | null;
  estimateUnit: string | null;
  estimateConfidence: string | null;
  estimateCalculationJson: Record<string, unknown> | null;
  status: string | null;
}

/**
 * Build a job card from a completed intake, generating an estimate if pricing is configured.
 */
export async function buildJobCard(params: BuildJobCardParams): Promise<JobCard | null> {
  // Fetch intake data
  const [intake] = await db
    .select()
    .from(jobIntakes)
    .where(eq(jobIntakes.id, params.jobIntakeId));

  if (!intake) return null;

  const answers = (intake.answersJson || {}) as Record<string, unknown>;

  // Generate estimate
  const estimate = await generateEstimate(
    params.businessId,
    params.jobIntakeId,
    answers,
    intake.tradeType,
    intake.scopeLevel,
  );

  // Resolve caller info from lead if not provided directly
  let callerName = params.callerName || null;
  let callerPhone = params.callerPhone || null;
  let callerEmail = params.callerEmail || null;

  if (params.leadId && (!callerName || !callerPhone)) {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, params.leadId));
    if (lead) {
      callerName = callerName || lead.name || null;
      callerPhone = callerPhone || lead.phone || null;
      callerEmail = callerEmail || lead.email || null;
    }
  }

  // Determine job type from answers
  const jobTypeKey = estimate.jobTypeKey || (answers.project_type as string) || (answers.job_type as string) || null;
  const jobTypeLabel = estimate.jobTypeLabel || jobTypeKey?.replace(/_/g, " ") || null;

  // Insert job card
  const [card] = await db.insert(jobCards).values({
    businessId: params.businessId,
    callId: params.callId,
    leadId: params.leadId || null,
    jobIntakeId: params.jobIntakeId,
    callerName,
    callerPhone,
    callerEmail,
    jobTypeKey,
    jobTypeLabel,
    scopeLevel: intake.scopeLevel,
    scopeDescription: intake.scopeDescription,
    estimateMode: estimate.matched ? estimate.mode || null : null,
    estimateMin: estimate.matched ? estimate.min ?? null : null,
    estimateMax: estimate.matched ? estimate.max ?? null : null,
    estimateUnit: estimate.matched ? estimate.unit || null : null,
    estimateCalculationJson: estimate.calculation || null,
    estimateConfidence: estimate.confidence || "no_match",
    status: "pending_review",
  }).returning();

  return card as unknown as JobCard;
}

/**
 * Format a job card into a clean SMS for the business owner.
 * Truncates to 300 chars for SMS safety.
 */
export function formatJobCardSMS(
  card: JobCard,
  receptionistName: string = "Maria",
  urgency: string = "normal",
  lang: "en" | "es" = "en",
): string {
  const lines: string[] = [];
  const isCommercial = card.scopeLevel === "commercial";
  const es = lang === "es";

  const L = es
    ? {
        newLead: "\u{1F4CB} NUEVO PROSPECTO",
        newLeadCommercial: "\u{1F4CB} NUEVO PROSPECTO \u2014 COMERCIAL",
        talkedTo: (r: string, c: string, p: string) => `${r} acaba de hablar con ${c}${p}`,
        unknownCaller: "llamante desconocido",
        jobLabel: "Trabajo",
        serviceRequested: "Servicio solicitado",
        estimateLabel: "Estimado",
        breakdownLabel: "Desglose",
        urgencyLabel: "Urgencia",
        urgencyEmergency: "EMERGENCIA",
        urgencyUrgent: "Urgente",
        urgencyNormal: "Normal",
        reply: "Responda 1 para confirmar | 2 para ajustar | 3 para programar visita",
      }
    : {
        newLead: "\u{1F4CB} NEW LEAD",
        newLeadCommercial: "\u{1F4CB} NEW LEAD \u2014 COMMERCIAL",
        talkedTo: (r: string, c: string, p: string) => `${r} just talked to ${c}${p}`,
        unknownCaller: "Unknown caller",
        jobLabel: "Job",
        serviceRequested: "Service requested",
        estimateLabel: "Estimate",
        breakdownLabel: "Breakdown",
        urgencyLabel: "Urgency",
        urgencyEmergency: "EMERGENCY",
        urgencyUrgent: "Urgent",
        urgencyNormal: "Normal",
        reply: "Reply 1 to confirm | 2 to adjust | 3 to schedule site visit",
      };

  lines.push(isCommercial ? L.newLeadCommercial : L.newLead);

  // Caller line
  const callerInfo = card.callerName || L.unknownCaller;
  const phonePart = card.callerPhone ? ` (${card.callerPhone})` : "";
  lines.push(L.talkedTo(receptionistName, callerInfo, phonePart));

  // Job line
  const jobLine = card.scopeDescription || card.jobTypeLabel || L.serviceRequested;
  lines.push(`${L.jobLabel}: ${jobLine}`);

  // Estimate line
  if (card.estimateMin != null && card.estimateMax != null) {
    lines.push(`${L.estimateLabel}: ${formatDollars(card.estimateMin)}\u2013${formatDollars(card.estimateMax)}`);

    // Breakdown for advanced mode
    if (card.estimateMode === "advanced" && card.estimateCalculationJson) {
      const calc = card.estimateCalculationJson as Record<string, unknown>;
      const baseRate = calc.base_rate as number;
      const baseUnits = calc.base_units as number;
      const baseUnit = calc.base_unit as string;
      const additional = calc.additional as Array<{ label: string; amount: number }> | undefined;

      let breakdown = `$${baseRate}/${baseUnit} \u00D7 ${baseUnits}`;
      if (additional && additional.length > 0) {
        for (const add of additional) {
          breakdown += ` + $${add.amount.toLocaleString()} ${add.label}`;
        }
      }
      lines.push(`${L.breakdownLabel}: ${breakdown}`);
    }
  }

  // Urgency
  const urgencyLabel = urgency === "emergency" ? L.urgencyEmergency : urgency === "urgent" ? L.urgencyUrgent : L.urgencyNormal;
  lines.push(`${L.urgencyLabel}: ${urgencyLabel}`);

  // Action buttons
  lines.push(L.reply);

  const replyLine = lines[lines.length - 1]; // "Reply 1 to confirm | 2 to adjust | 3 to schedule site visit"
  const result = lines.join("\n");
  // Truncate to 300 chars for SMS safety, but always preserve the reply instructions
  if (result.length > 300) {
    const maxBodyLen = 300 - replyLine.length - 5; // 5 = "\n...\n"
    const body = lines.slice(0, -1).join("\n");
    return body.slice(0, maxBodyLen) + "...\n" + replyLine;
  }
  return result;
}

function formatDollars(n: number): string {
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${n.toFixed(0)}`;
}
