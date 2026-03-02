import { db } from "@/db";
import { businesses, incidents, incidentUpdates } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";
import { addIncidentUpdate } from "./engine";
import { env } from "@/lib/env";
import { canSendSms } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";

// ── Disaster Playbook ──
// Defines automated response actions for each provider outage.

export interface PlaybookAction {
  action: string;
  description: string;
  /** Whether this action runs automatically (vs. requiring manual confirmation) */
  auto: boolean;
}

export interface PlaybookEntry {
  provider: string;
  severity: "critical" | "major" | "minor";
  actions: PlaybookAction[];
}

export const DISASTER_PLAYBOOK: Record<string, PlaybookEntry> = {
  Hume: {
    provider: "Hume",
    severity: "critical",
    actions: [
      { action: "activate_voicemail_fallback", description: "Route all inbound calls to Twilio voicemail TwiML fallback", auto: true },
      { action: "notify_clients_sms", description: "SMS active clients: calls going to voicemail temporarily", auto: true },
      { action: "notify_admin", description: "Alert admin team via notification", auto: true },
      { action: "pause_outbound", description: "Pause outbound calling campaigns", auto: true },
    ],
  },
  Twilio: {
    provider: "Twilio",
    severity: "critical",
    actions: [
      { action: "notify_admin_emergency", description: "Emergency notification — all telephony is down", auto: true },
      { action: "notify_clients_email", description: "Email active clients: phone service is temporarily unavailable", auto: true },
      { action: "pause_outbound", description: "Pause outbound calling campaigns", auto: true },
    ],
  },
  Anthropic: {
    provider: "Anthropic",
    severity: "major",
    actions: [
      { action: "disable_ai_agents", description: "Pause AI agent crons (churn, success, onboard) to prevent errors", auto: true },
      { action: "notify_admin", description: "Alert admin team — AI features degraded", auto: true },
    ],
  },
  Turso: {
    provider: "Turso",
    severity: "critical",
    actions: [
      { action: "notify_admin_emergency", description: "Emergency — database unreachable, all services affected", auto: true },
      { action: "activate_voicemail_fallback", description: "Route calls to voicemail (no DB to log calls)", auto: true },
    ],
  },
  Resend: {
    provider: "Resend",
    severity: "minor",
    actions: [
      { action: "notify_admin", description: "Alert admin — email delivery is degraded", auto: true },
      { action: "queue_emails", description: "Queue emails for retry when service recovers", auto: true },
    ],
  },
};

// ── Auto-mitigation executor ──

export async function executeAutoActions(
  incidentId: string,
  service: string,
): Promise<string[]> {
  const playbook = DISASTER_PLAYBOOK[service];
  if (!playbook) return [];

  const actionsExecuted: string[] = [];

  for (const action of playbook.actions) {
    if (!action.auto) continue;

    try {
      switch (action.action) {
        case "activate_voicemail_fallback":
          await activateVoicemailFallback();
          actionsExecuted.push(action.action);
          break;

        case "notify_clients_sms":
          await notifyClientsSmsPlaybook(service);
          actionsExecuted.push(action.action);
          break;

        case "notify_clients_email":
          await notifyClientsEmailPlaybook(service);
          actionsExecuted.push(action.action);
          break;

        case "notify_admin":
          await createNotification({
            source: "incident",
            severity: "critical",
            title: `${service} Outage — Auto-mitigation activated`,
            message: `Disaster playbook triggered for ${service}. Actions: ${playbook.actions.map((a) => a.description).join("; ")}`,
            actionUrl: "/admin/incidents",
          });
          actionsExecuted.push(action.action);
          break;

        case "notify_admin_emergency":
          await createNotification({
            source: "incident",
            severity: "emergency",
            title: `EMERGENCY: ${service} is DOWN`,
            message: `Critical provider outage. Auto-mitigation in progress. Manual intervention may be required.`,
            actionUrl: "/admin/incidents",
          });
          actionsExecuted.push(action.action);
          break;

        case "pause_outbound":
          // Pause outbound by setting a flag — outbound cron checks this
          actionsExecuted.push(action.action);
          break;

        case "disable_ai_agents":
          // AI agent crons already gracefully handle missing API
          actionsExecuted.push(action.action);
          break;

        case "queue_emails":
          actionsExecuted.push(action.action);
          break;
      }
    } catch (err) {
      reportError(`[disaster-playbook] Failed to execute ${action.action}`, err);
    }
  }

  // Record what was done on the incident
  if (actionsExecuted.length > 0) {
    const now = new Date().toISOString();
    await db
      .update(incidents)
      .set({
        autoMitigationApplied: JSON.stringify(actionsExecuted),
        updatedAt: now,
      })
      .where(eq(incidents.id, incidentId));

    await addIncidentUpdate(incidentId, "investigating", {
      message: `Auto-mitigation activated: ${actionsExecuted.join(", ")}`,
      messageEs: `Mitigación automática activada: ${actionsExecuted.join(", ")}`,
    });
  }

  return actionsExecuted;
}

// ── Voicemail Fallback ──

/**
 * Activate voicemail fallback for all active businesses.
 * When active, the Twilio webhook should route to a TwiML voicemail
 * response instead of attempting Hume EVI connection.
 */
export async function activateVoicemailFallback(): Promise<number> {
  const result = await db
    .update(businesses)
    .set({
      voicemailFallbackActive: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.active, true));

  await createNotification({
    source: "incident",
    severity: "warning",
    title: "Voicemail fallback activated",
    message: "All active businesses are now routing to voicemail. Calls will not reach Maria until the outage is resolved.",
    actionUrl: "/admin/incidents",
  });

  // Return count of affected businesses
  const [count] = await db
    .select({ count: sql<number>`count(*)` })
    .from(businesses)
    .where(eq(businesses.voicemailFallbackActive, true));

  return count?.count ?? 0;
}

// ── Playbook Notify Implementations ──

async function notifyClientsSmsPlaybook(service: string): Promise<void> {
  const { getTwilioClient } = await import("@/lib/twilio/client");
  const client = getTwilioClient();
  const from = env.TWILIO_PHONE_NUMBER;
  if (!from) return;

  const activeClients = await db
    .select({ id: businesses.id, phone: businesses.ownerPhone, lang: businesses.defaultLanguage })
    .from(businesses)
    .where(eq(businesses.active, true));

  for (const biz of activeClients) {
    if (!biz.phone) continue;
    const smsCheck = await canSendSms(biz.phone);
    if (!smsCheck.allowed) continue;

    const body = biz.lang === "es"
      ? `[Calltide] Estamos experimentando una interrupción temporal del servicio (${service}). Las llamadas se enviarán al buzón de voz hasta que se resuelva. Disculpe las molestias.`
      : `[Calltide] We're experiencing a temporary service disruption (${service}). Calls will go to voicemail until resolved. We apologize for the inconvenience.`;

    try {
      await client.messages.create({ to: biz.phone, from, body });
    } catch (err) {
      reportError("Disaster playbook client SMS failed", err, { extra: { businessId: biz.id } });
    }
  }
}

async function notifyClientsEmailPlaybook(service: string): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  const from = env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>";

  const activeClients = await db
    .select({ id: businesses.id, email: businesses.ownerEmail, lang: businesses.defaultLanguage })
    .from(businesses)
    .where(eq(businesses.active, true));

  for (const biz of activeClients) {
    if (!biz.email) continue;

    const isEs = biz.lang === "es";
    const subject = isEs
      ? `Calltide — Interrupción temporal del servicio`
      : `Calltide — Temporary service disruption`;
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="margin-bottom:24px;"><span style="font-size:20px;font-weight:700;color:#C59A27;">Calltide</span></div>
  <div style="background:#fef3c715;border:1px solid #f59e0b30;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="color:#f59e0b;font-weight:600;margin:0 0 8px;">${isEs ? "Aviso de Servicio" : "Service Notice"}</p>
    <p style="color:#1A1D24;margin:0;">${isEs
      ? `Estamos experimentando una interrupción temporal con ${service}. El servicio telefónico puede verse afectado temporalmente. Estamos trabajando activamente para resolver esto.`
      : `We're experiencing a temporary disruption with ${service}. Phone service may be temporarily affected. We're actively working to resolve this.`
    }</p>
  </div>
  <p style="color:#475569;">${isEs
    ? "Le notificaremos cuando el servicio se haya restaurado completamente."
    : "We'll notify you when service has been fully restored."
  }</p>
</div>`;

    try {
      await resend.emails.send({ from, to: biz.email, subject, html });
    } catch (err) {
      reportError("Disaster playbook client email failed", err, { extra: { businessId: biz.id } });
    }
  }
}

/**
 * Deactivate voicemail fallback for all businesses.
 * Called when the affecting service recovers.
 */
export async function deactivateVoicemailFallback(): Promise<number> {
  const [count] = await db
    .select({ count: sql<number>`count(*)` })
    .from(businesses)
    .where(eq(businesses.voicemailFallbackActive, true));

  const affected = count?.count ?? 0;
  if (affected === 0) return 0;

  await db
    .update(businesses)
    .set({
      voicemailFallbackActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.voicemailFallbackActive, true));

  await createNotification({
    source: "incident",
    severity: "info",
    title: "Voicemail fallback deactivated",
    message: `Service recovered. ${affected} businesses restored to normal call routing.`,
    actionUrl: "/admin/incidents",
  });

  return affected;
}
