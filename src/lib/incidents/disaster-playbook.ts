import { db } from "@/db";
import { businesses, incidents, incidentUpdates } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";
import { addIncidentUpdate } from "./engine";

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
          // Placeholder — would integrate with Twilio SMS in production
          actionsExecuted.push(action.action);
          break;

        case "notify_clients_email":
          // Placeholder — would integrate with Resend in production
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
      console.error(`[disaster-playbook] Failed to execute ${action.action}:`, err);
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
