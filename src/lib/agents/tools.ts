import { env } from "@/lib/env";
import { getTwilioClient } from "@/lib/twilio/client";
import { getResend } from "@/lib/email/client";
import { db } from "@/db";
import {
  prospects,
  demos,
  churnRiskScores,
  agentActivityLog,
  smsMessages,
  businesses,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { createNotification } from "@/lib/notifications";
import { canSendSms } from "@/lib/compliance/sms";
import type { ToolDefinition, AgentName, ActionType, TargetType } from "./types";

// ── Tool Definitions (Anthropic format) ──

export const SHARED_TOOLS: ToolDefinition[] = [
  {
    name: "send_email",
    description: "Send an email to a client or prospect.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "HTML email body" },
        replyTo: { type: "string", description: "Reply-to email address (optional)" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "send_sms",
    description: "Send an SMS message. Will check opt-out status before sending.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Phone number in E.164 format" },
        body: { type: "string", description: "SMS message body (max 1600 chars)" },
      },
      required: ["to", "body"],
    },
  },
  {
    name: "escalate_to_owner",
    description: "Escalate an issue to the Calltide owner via SMS and email.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: { type: "string", description: "Why this is being escalated" },
        urgency: { type: "string", enum: ["low", "medium", "high"], description: "Urgency level" },
        context: { type: "string", description: "Relevant context for the owner" },
      },
      required: ["reason", "urgency", "context"],
    },
  },
  {
    name: "update_prospect_status",
    description: "Update a prospect's pipeline status.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string", description: "Prospect UUID" },
        status: {
          type: "string",
          enum: ["new", "audit_scheduled", "audit_complete", "outreach_active", "outreach_paused", "demo_booked", "converted", "disqualified"],
          description: "New status",
        },
      },
      required: ["prospectId", "status"],
    },
  },
  {
    name: "create_demo",
    description: "Create a demo booking for a prospect.",
    input_schema: {
      type: "object" as const,
      properties: {
        prospectId: { type: "string", description: "Prospect UUID" },
        contactName: { type: "string", description: "Contact person name" },
        contactEmail: { type: "string", description: "Contact email" },
        contactPhone: { type: "string", description: "Contact phone" },
        scheduledDate: { type: "string", description: "ISO date string for the demo (optional)" },
      },
      required: ["prospectId", "contactName"],
    },
  },
  {
    name: "update_churn_score",
    description: "Update or create a churn risk score for a client.",
    input_schema: {
      type: "object" as const,
      properties: {
        businessId: { type: "string", description: "Business UUID" },
        score: { type: "number", description: "Churn risk score 0-10" },
        reasoning: { type: "string", description: "Explanation of the score" },
      },
      required: ["businessId", "score", "reasoning"],
    },
  },
];

// Subsets for specific agents
export const SUPPORT_TOOLS = SHARED_TOOLS.filter((t) =>
  ["send_email", "send_sms", "escalate_to_owner"].includes(t.name),
);

export const QUALIFY_TOOLS = SHARED_TOOLS.filter((t) =>
  ["send_email", "send_sms", "escalate_to_owner", "update_prospect_status", "create_demo"].includes(t.name),
);

export const CHURN_TOOLS = SHARED_TOOLS.filter((t) =>
  ["send_email", "escalate_to_owner", "update_churn_score"].includes(t.name),
);

// ── Tool Executors ──

async function toolSendEmail(input: Record<string, unknown>): Promise<string> {
  const resend = getResend();
  const from = env.OUTREACH_FROM_EMAIL ?? "Calltide Support <support@calltide.app>";

  const { data, error } = await resend.emails.send({
    from,
    to: String(input.to),
    subject: String(input.subject),
    html: String(input.body),
    replyTo: input.replyTo ? String(input.replyTo) : undefined,
  });

  if (error) return `Email failed: ${error.message}`;
  return `Email sent successfully (id: ${data?.id})`;
}

async function toolSendSms(input: Record<string, unknown>): Promise<string> {
  const to = String(input.to);
  const body = String(input.body).slice(0, 1600);
  const twilioNumber = env.TWILIO_PHONE_NUMBER;

  // TCPA compliance check — legally required before every SMS
  const smsCheck = await canSendSms(to);
  if (!smsCheck.allowed) {
    await createNotification({
      source: "compliance",
      severity: "info",
      title: "SMS blocked",
      message: `SMS to ${to.slice(-4)} blocked — ${smsCheck.reason}`,
    });
    return `SMS blocked — ${smsCheck.reason}`;
  }

  // Check prospect SMS opt-out (additional check for outreach recipients)
  const [prospect] = await db
    .select({ smsOptOut: prospects.smsOptOut })
    .from(prospects)
    .where(eq(prospects.phone, to))
    .limit(1);

  if (prospect?.smsOptOut) {
    return "SMS blocked — recipient has opted out";
  }

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({ to, from: twilioNumber, body });
    return `SMS sent (sid: ${message.sid})`;
  } catch (error) {
    return `SMS failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function toolEscalateToOwner(input: Record<string, unknown>, agentName: string): Promise<string> {
  const ownerPhone = env.OWNER_PHONE;
  const ownerEmail = env.OWNER_EMAIL;
  const reason = String(input.reason);
  const urgency = String(input.urgency);
  const context = String(input.context);
  const results: string[] = [];

  const message = `[${urgency.toUpperCase()} ESCALATION — ${agentName} agent]\n${reason}\n\nContext: ${context}`;

  if (ownerPhone) {
    try {
      const client = getTwilioClient();
      await client.messages.create({
        to: ownerPhone,
        from: env.TWILIO_PHONE_NUMBER,
        body: message.slice(0, 1600),
      });
      results.push("SMS sent to owner");
    } catch (err) {
      results.push(`Owner SMS failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    results.push("OWNER_PHONE not set — skipping SMS escalation");
  }

  if (ownerEmail) {
    try {
      const resend = getResend();
      await resend.emails.send({
        from: env.OUTREACH_FROM_EMAIL ?? "Calltide Agents <agents@calltide.app>",
        to: ownerEmail,
        subject: `[${urgency.toUpperCase()}] Agent Escalation: ${reason.slice(0, 80)}`,
        html: `<div style="font-family:sans-serif;max-width:600px;">
          <h3 style="color:#ef4444;">Agent Escalation — ${agentName}</h3>
          <p><strong>Urgency:</strong> ${urgency}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Context:</strong></p>
          <pre style="background:#f1f5f9;padding:12px;border-radius:8px;white-space:pre-wrap;">${context}</pre>
        </div>`,
      });
      results.push("Email sent to owner");
    } catch (err) {
      results.push(`Owner email failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    results.push("OWNER_EMAIL not set — skipping email escalation");
  }

  return results.join("; ");
}

async function toolUpdateProspectStatus(input: Record<string, unknown>): Promise<string> {
  const id = String(input.prospectId);
  const status = String(input.status);

  const [existing] = await db.select({ id: prospects.id }).from(prospects).where(eq(prospects.id, id)).limit(1);
  if (!existing) return `Prospect ${id} not found`;

  await db.update(prospects).set({ status, updatedAt: new Date().toISOString() }).where(eq(prospects.id, id));
  return `Prospect status updated to: ${status}`;
}

async function toolCreateDemo(input: Record<string, unknown>): Promise<string> {
  const [demo] = await db
    .insert(demos)
    .values({
      prospectId: input.prospectId ? String(input.prospectId) : undefined,
      contactName: String(input.contactName),
      contactEmail: input.contactEmail ? String(input.contactEmail) : undefined,
      contactPhone: input.contactPhone ? String(input.contactPhone) : undefined,
      scheduledAt: input.scheduledDate ? String(input.scheduledDate) : undefined,
      status: "scheduled",
    })
    .returning();

  if (input.prospectId) {
    await db
      .update(prospects)
      .set({ status: "demo_booked", updatedAt: new Date().toISOString() })
      .where(eq(prospects.id, String(input.prospectId)));
  }

  return `Demo created (id: ${demo.id}) for ${input.contactName}`;
}

async function toolUpdateChurnScore(input: Record<string, unknown>): Promise<string> {
  const businessId = String(input.businessId);
  const score = Math.min(10, Math.max(0, Number(input.score)));
  const reasoning = String(input.reasoning);

  const [existing] = await db
    .select({ id: churnRiskScores.id })
    .from(churnRiskScores)
    .where(eq(churnRiskScores.customerId, businessId))
    .limit(1);

  if (existing) {
    await db
      .update(churnRiskScores)
      .set({ score, factors: [reasoning], calculatedAt: new Date().toISOString() })
      .where(eq(churnRiskScores.id, existing.id));
  } else {
    await db.insert(churnRiskScores).values({
      customerId: businessId,
      score,
      factors: [reasoning],
    });
  }

  // Notify on high churn risk
  if (score >= 8) {
    await createNotification({
      source: "retention",
      severity: "warning",
      title: "High churn risk",
      message: `Risk score ${score}/10 — ${reasoning}`,
      actionUrl: "/admin/client-success",
    });
  }

  return `Churn score updated to ${score} for business ${businessId}`;
}

// ── Main Executor ──

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  agentName: string = "unknown",
): Promise<string> {
  try {
    switch (toolName) {
      case "send_email":
        return await toolSendEmail(toolInput);
      case "send_sms":
        return await toolSendSms(toolInput);
      case "escalate_to_owner":
        return await toolEscalateToOwner(toolInput, agentName);
      case "update_prospect_status":
        return await toolUpdateProspectStatus(toolInput);
      case "create_demo":
        return await toolCreateDemo(toolInput);
      case "update_churn_score":
        return await toolUpdateChurnScore(toolInput);
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    reportError(`Agent tool execution failed: ${toolName}`, error);
    return `Tool error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// ── Activity Logger ──

export async function logAgentActivity(params: {
  agentName: AgentName;
  actionType: ActionType;
  targetId?: string;
  targetType?: TargetType;
  inputSummary?: string;
  outputSummary?: string;
  toolsCalled?: string[];
  escalated?: boolean;
  resolvedWithoutEscalation?: boolean;
  category?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(agentActivityLog).values({
    agentName: params.agentName,
    actionType: params.actionType,
    targetId: params.targetId,
    targetType: params.targetType,
    inputSummary: params.inputSummary,
    outputSummary: params.outputSummary,
    toolsCalled: params.toolsCalled,
    escalated: params.escalated ?? false,
    resolvedWithoutEscalation: params.resolvedWithoutEscalation ?? false,
    category: params.category,
    metadata: params.metadata,
  });
}
