import { db } from "@/db";
import { capacityAlerts } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { createNotification } from "@/lib/notifications";
import { reportError } from "@/lib/error-reporting";

export type AlertSeverity = "warning" | "critical" | "emergency";

interface ThresholdCheck {
  provider: string;
  metric: string;
  currentValue: number;
  limitValue: number;
}

const SEVERITY_THRESHOLDS: { severity: AlertSeverity; pct: number }[] = [
  { severity: "emergency", pct: 95 },
  { severity: "critical", pct: 85 },
  { severity: "warning", pct: 70 },
];

export async function checkThresholds(checks: ThresholdCheck[]): Promise<void> {
  for (const check of checks) {
    if (check.limitValue <= 0 || !isFinite(check.limitValue)) continue;

    const pctUsed = (check.currentValue / check.limitValue) * 100;

    // Find applicable severity
    const match = SEVERITY_THRESHOLDS.find((t) => pctUsed >= t.pct);
    if (!match) continue;

    // Check for existing unresolved alert at same or higher severity
    const [existing] = await db
      .select()
      .from(capacityAlerts)
      .where(
        and(
          eq(capacityAlerts.provider, check.provider),
          eq(capacityAlerts.metric, check.metric),
          isNull(capacityAlerts.resolvedAt),
        ),
      )
      .limit(1);

    if (existing) {
      // Don't create duplicate — already alerting
      continue;
    }

    const message = `${check.provider} ${check.metric}: ${pctUsed.toFixed(1)}% of limit (${check.currentValue.toLocaleString()} / ${check.limitValue.toLocaleString()})`;

    // Insert alert
    await db.insert(capacityAlerts).values({
      provider: check.provider,
      metric: check.metric,
      severity: match.severity,
      currentValue: check.currentValue,
      limitValue: check.limitValue,
      pctUsed,
      message,
    });

    // Notify admin
    await notifyAdmin(match.severity, message);

    // Unified notification
    await createNotification({
      source: "capacity",
      severity: match.severity === "emergency" ? "emergency" : match.severity === "critical" ? "critical" : "warning",
      title: `${check.provider} at ${pctUsed.toFixed(0)}%`,
      message,
      actionUrl: "/admin/capacity",
    });

    // If critical or emergency, create incident
    if (match.severity === "critical" || match.severity === "emergency") {
      try {
        const { createIncident } = await import("@/lib/incidents/engine");
        // Pass as HealthCheckResult shape
        await createIncident({
          name: check.provider,
          statusCode: match.severity === "emergency" ? 0 : 500,
          responseTimeMs: 0,
          healthy: false,
          error: `${check.metric} at ${pctUsed.toFixed(1)}% of limit`,
        });
      } catch {
        // Incident system may not be available
      }
    }
  }
}

async function notifyAdmin(severity: AlertSeverity, message: string) {
  const ownerEmail = env.OWNER_EMAIL;
  if (!ownerEmail || !env.RESEND_API_KEY) return;

  const from = env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>";
  const severityLabel = severity.toUpperCase();
  const color = severity === "emergency" ? "#ef4444" : severity === "critical" ? "#f59e0b" : "#3b82f6";

  try {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from,
      to: ownerEmail,
      subject: `[${severityLabel}] Calltide Capacity Alert`,
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Calltide</span>
  </div>
  <div style="background:${color}15;border:1px solid ${color}30;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="color:${color};font-weight:600;margin:0 0 8px;">${severityLabel} Capacity Alert</p>
    <p style="color:#1A1D24;margin:0;">${message}</p>
  </div>
  <a href="${env.NEXT_PUBLIC_APP_URL}/admin/capacity" style="display:inline-block;background:#C59A27;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    View Dashboard
  </a>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
  <p style="color:#94A3B8;font-size:11px;">Calltide Inc. &middot; San Antonio, TX</p>
</div>`,
    });
  } catch (e) {
    reportError("[capacity] Failed to send admin notification", e);
  }
}
