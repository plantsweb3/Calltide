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
): string {
  const lines: string[] = [];
  const isCommercial = card.scopeLevel === "commercial";

  lines.push(isCommercial ? "\u{1F4CB} NEW LEAD \u2014 COMMERCIAL" : "\u{1F4CB} NEW LEAD");

  // Caller line
  const callerInfo = card.callerName || "Unknown caller";
  const phonePart = card.callerPhone ? ` (${card.callerPhone})` : "";
  lines.push(`${receptionistName} just talked to ${callerInfo}${phonePart}`);

  // Job line
  const jobLine = card.scopeDescription || card.jobTypeLabel || "Service requested";
  lines.push(`Job: ${jobLine}`);

  // Estimate line
  if (card.estimateMin != null && card.estimateMax != null) {
    lines.push(`Estimate: ${formatDollars(card.estimateMin)}\u2013${formatDollars(card.estimateMax)}`);

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
      lines.push(`Breakdown: ${breakdown}`);
    }
  }

  // Urgency
  const urgencyLabel = urgency === "emergency" ? "EMERGENCY" : urgency === "urgent" ? "Urgent" : "Normal";
  lines.push(`Urgency: ${urgencyLabel}`);

  // Action buttons
  lines.push("Reply 1 to confirm | 2 to adjust | 3 to schedule site visit");

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
