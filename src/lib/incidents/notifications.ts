import { getResend } from "@/lib/email/client";
import { getTwilioClient } from "@/lib/twilio/client";
import { db } from "@/db";
import {
  incidents,
  incidentNotifications,
  businesses,
  statusPageSubscribers,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { formatDuration } from "./engine";
import { canSendSms } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";

// ── Types ──

type IncidentRow = typeof incidents.$inferSelect;
type NotificationEvent = "created" | "update" | "resolved";

const FROM_EMAIL = "Capta Status <status@contact.captahq.com>";
const OWNER_PHONE = env.OWNER_PHONE;
const OWNER_EMAIL = env.OWNER_EMAIL;

// ── Notify Owner (always SMS + email) ──

export async function notifyOwner(incident: IncidentRow, event: NotificationEvent): Promise<void> {
  const smsBody = getOwnerSmsBody(incident, event);
  const { subject, html } = getOwnerEmailContent(incident, event);

  if (OWNER_PHONE) {
    const smsCheck = await canSendSms(OWNER_PHONE);
    if (smsCheck.allowed) {
      try {
        const client = getTwilioClient();
        await client.messages.create({
          to: OWNER_PHONE,
          from: env.TWILIO_PHONE_NUMBER,
          body: smsBody,
        });
        await logNotification(incident.id, "owner_sms", undefined, OWNER_PHONE, "sent");
      } catch (err) {
        reportError("Owner SMS failed", err);
        await logNotification(incident.id, "owner_sms", undefined, OWNER_PHONE, "failed");
      }
    } else {
      await logNotification(incident.id, "owner_sms", undefined, OWNER_PHONE, `skipped:${smsCheck.reason}`);
    }
  }

  if (OWNER_EMAIL) {
    try {
      const resend = getResend();
      await resend.emails.send({ from: FROM_EMAIL, to: OWNER_EMAIL, subject, html });
      await logNotification(incident.id, "owner_email", undefined, OWNER_EMAIL, "sent");
    } catch (err) {
      reportError("Owner email failed", err);
      await logNotification(incident.id, "owner_email", undefined, OWNER_EMAIL, "failed");
    }
  }
}

// ── Notify Clients (critical: SMS + email, major: email only, minor: skip) ──

export async function notifyClients(incident: IncidentRow, event: NotificationEvent): Promise<void> {
  const severity = incident.severity as string;
  if (severity === "minor" || severity === "maintenance") return;

  const clientRows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      phone: businesses.ownerPhone,
      email: businesses.ownerEmail,
      lang: businesses.defaultLanguage,
    })
    .from(businesses)
    .where(eq(businesses.active, true));

  // Batch in chunks of 50
  for (let i = 0; i < clientRows.length; i += 50) {
    const batch = clientRows.slice(i, i + 50);
    const promises: Promise<void>[] = [];

    for (const client of batch) {
      const lang = client.lang === "es" ? "es" : "en";

      // Email always for major+
      if (client.email) {
        const { subject, html } = getClientEmailContent(incident, event, lang);
        promises.push(
          sendClientEmail(incident.id, client.id, client.email, subject, html),
        );
      }

      // SMS only for critical
      if (severity === "critical" && client.phone) {
        const body = getClientSmsBody(incident, event, lang);
        promises.push(
          sendClientSms(incident.id, client.id, client.phone, body),
        );
      }
    }

    await Promise.allSettled(promises);
  }
}

// ── Notify Subscribers (email all verified) ──

export async function notifySubscribers(incident: IncidentRow, event: NotificationEvent): Promise<void> {
  const subs = await db
    .select()
    .from(statusPageSubscribers)
    .where(
      and(
        eq(statusPageSubscribers.verified, true),
        sql`${statusPageSubscribers.unsubscribedAt} IS NULL`,
      ),
    );

  for (let i = 0; i < subs.length; i += 50) {
    const batch = subs.slice(i, i + 50);
    const promises = batch.map((sub) => {
      const lang = sub.language === "es" ? "es" : "en";
      const { subject, html } = getSubscriberEmailContent(incident, event, lang, sub.id);
      return sendSubscriberEmail(incident.id, sub.id, sub.email, subject, html);
    });
    await Promise.allSettled(promises);
  }
}

// ── Send Helpers ──

async function sendClientEmail(incidentId: string, clientId: string, email: string, subject: string, html: string) {
  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    await logNotification(incidentId, "client_email", clientId, email, "sent");
  } catch {
    await logNotification(incidentId, "client_email", clientId, email, "failed");
  }
}

async function sendClientSms(incidentId: string, clientId: string, phone: string, body: string) {
  const smsCheck = await canSendSms(phone);
  if (!smsCheck.allowed) {
    await logNotification(incidentId, "client_sms", clientId, phone, `skipped:${smsCheck.reason}`);
    return;
  }
  try {
    const client = getTwilioClient();
    await client.messages.create({ to: phone, from: env.TWILIO_PHONE_NUMBER, body });
    await logNotification(incidentId, "client_sms", clientId, phone, "sent");
  } catch {
    await logNotification(incidentId, "client_sms", clientId, phone, "failed");
  }
}

async function sendSubscriberEmail(incidentId: string, subId: string, email: string, subject: string, html: string) {
  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    await logNotification(incidentId, "subscriber_email", subId, email, "sent");
  } catch {
    await logNotification(incidentId, "subscriber_email", subId, email, "failed");
  }
}

async function logNotification(
  incidentId: string,
  type: string,
  recipientId: string | undefined,
  contact: string | undefined,
  status: string,
) {
  await db.insert(incidentNotifications).values({
    incidentId,
    notificationType: type,
    recipientId,
    recipientContact: contact,
    status,
  });
}

// ── SMS Templates ──

function getOwnerSmsBody(incident: IncidentRow, event: NotificationEvent): string {
  const sev = (incident.severity ?? "").toUpperCase();
  if (event === "created") {
    return `[Capta ${sev}] ${incident.title}. ${incident.clientsAffected} clients may be affected. Check admin dashboard for details.`;
  }
  if (event === "resolved") {
    return `[Capta RESOLVED] ${incident.title} resolved after ${formatDuration(incident.duration ?? 0)}. All systems operational.`;
  }
  return `[Capta UPDATE] ${incident.title} — severity escalated to ${sev}. Check admin dashboard.`;
}

function getClientSmsBody(incident: IncidentRow, event: NotificationEvent, lang: string): string {
  if (lang === "es") {
    if (event === "created") return `[Capta] Estamos experimentando problemas con nuestro servicio. Estamos trabajando para resolverlo. Más info: ${env.NEXT_PUBLIC_APP_URL}/es/status`;
    if (event === "resolved") return `[Capta] El problema ha sido resuelto. Todos los sistemas están operativos. Gracias por su paciencia.`;
    return `[Capta] Actualización: seguimos trabajando en resolver el problema. Más info: ${env.NEXT_PUBLIC_APP_URL}/es/status`;
  }
  if (event === "created") return `[Capta] We're experiencing service issues. We're working to resolve this. Updates: ${env.NEXT_PUBLIC_APP_URL}/status`;
  if (event === "resolved") return `[Capta] The issue has been resolved. All systems operational. Thank you for your patience.`;
  return `[Capta] Update: we're continuing to work on the issue. Updates: ${env.NEXT_PUBLIC_APP_URL}/status`;
}

// ── Email Templates ──

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:16px 0;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span>
    <span style="font-size:11px;display:inline-block;margin-left:8px;padding:2px 6px;background:#f1f5f9;border-radius:4px;color:#64748b;">STATUS</span>
  </div>
  <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:32px;">
    ${content}
  </div>
  <div style="text-align:center;padding:24px 0;font-size:12px;color:#94a3b8;">
    <p>Capta LLC — AI-Powered Business Communications</p>
    <p><a href="${env.NEXT_PUBLIC_APP_URL}/status" style="color:#C59A27;text-decoration:none;">View Status Page</a></p>
  </div>
</div></body></html>`;
}

function severityColor(sev: string): string {
  if (sev === "critical") return "#ef4444";
  if (sev === "major") return "#f59e0b";
  return "#3b82f6";
}

function getOwnerEmailContent(incident: IncidentRow, event: NotificationEvent): { subject: string; html: string } {
  const sev = (incident.severity ?? "minor").toUpperCase();
  const color = severityColor(incident.severity ?? "minor");

  if (event === "created") {
    return {
      subject: `[${sev}] ${incident.title}`,
      html: emailWrapper(`
        <div style="padding:8px 12px;border-radius:8px;background:${color}15;border-left:4px solid ${color};margin-bottom:16px;">
          <span style="font-weight:600;color:${color};">${sev} INCIDENT</span>
        </div>
        <h2 style="margin:0 0 12px;color:#1e293b;">${incident.title}</h2>
        <p style="color:#475569;line-height:1.6;">
          <strong>Affected:</strong> ${(incident.affectedServices as string[]).join(", ")}<br>
          <strong>Clients affected:</strong> ${incident.clientsAffected}<br>
          <strong>Est. calls impacted:</strong> ${incident.estimatedCallsImpacted}<br>
          <strong>Started:</strong> ${incident.startedAt}
        </p>
        <a href="${env.NEXT_PUBLIC_APP_URL}/admin/incidents" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:500;">View in Admin</a>
      `),
    };
  }

  if (event === "resolved") {
    return {
      subject: `[RESOLVED] ${incident.title}`,
      html: emailWrapper(`
        <div style="padding:8px 12px;border-radius:8px;background:rgba(74,222,128,0.1);border-left:4px solid #4ade80;margin-bottom:16px;">
          <span style="font-weight:600;color:#16a34a;">RESOLVED</span>
        </div>
        <h2 style="margin:0 0 12px;color:#1e293b;">${incident.title}</h2>
        <p style="color:#475569;line-height:1.6;">
          <strong>Duration:</strong> ${formatDuration(incident.duration ?? 0)}<br>
          <strong>Resolved at:</strong> ${incident.resolvedAt}
        </p>
      `),
    };
  }

  return {
    subject: `[UPDATE] ${incident.title}`,
    html: emailWrapper(`
      <div style="padding:8px 12px;border-radius:8px;background:${color}15;border-left:4px solid ${color};margin-bottom:16px;">
        <span style="font-weight:600;color:${color};">ESCALATED TO ${sev}</span>
      </div>
      <h2 style="margin:0 0 12px;color:#1e293b;">${incident.title}</h2>
      <p style="color:#475569;">Severity has been escalated. Check the admin dashboard for details.</p>
      <a href="${env.NEXT_PUBLIC_APP_URL}/admin/incidents" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:500;">View in Admin</a>
    `),
  };
}

function getClientEmailContent(incident: IncidentRow, event: NotificationEvent, lang: string): { subject: string; html: string } {
  const statusUrl = lang === "es" ? `${env.NEXT_PUBLIC_APP_URL}/es/status` : `${env.NEXT_PUBLIC_APP_URL}/status`;
  const color = severityColor(incident.severity ?? "minor");

  if (lang === "es") {
    if (event === "created") {
      return {
        subject: `Capta — Problema de servicio detectado`,
        html: emailWrapper(`
          <div style="padding:8px 12px;border-radius:8px;background:${color}15;border-left:4px solid ${color};margin-bottom:16px;">
            <span style="font-weight:600;color:${color};">INCIDENTE ACTIVO</span>
          </div>
          <h2 style="margin:0 0 12px;color:#1e293b;">${incident.titleEs ?? incident.title}</h2>
          <p style="color:#475569;line-height:1.6;">Estamos al tanto del problema y nuestro equipo está trabajando para resolverlo lo antes posible. Sus llamadas pueden verse afectadas temporalmente.</p>
          <a href="${statusUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:500;">Ver Estado del Sistema</a>
        `),
      };
    }
    if (event === "resolved") {
      return {
        subject: `Capta — Problema resuelto`,
        html: emailWrapper(`
          <div style="padding:8px 12px;border-radius:8px;background:rgba(74,222,128,0.1);border-left:4px solid #4ade80;margin-bottom:16px;">
            <span style="font-weight:600;color:#16a34a;">RESUELTO</span>
          </div>
          <h2 style="margin:0 0 12px;color:#1e293b;">${incident.titleEs ?? incident.title}</h2>
          <p style="color:#475569;line-height:1.6;">El problema ha sido resuelto. Todos los servicios están funcionando con normalidad. Duración total: ${formatDuration(incident.duration ?? 0)}.</p>
        `),
      };
    }
    return {
      subject: `Capta — Actualización de incidente`,
      html: emailWrapper(`
        <h2 style="margin:0 0 12px;color:#1e293b;">${incident.titleEs ?? incident.title}</h2>
        <p style="color:#475569;line-height:1.6;">Seguimos trabajando en resolver el problema. Visite nuestra página de estado para actualizaciones en tiempo real.</p>
        <a href="${statusUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:500;">Ver Estado</a>
      `),
    };
  }

  // English
  if (event === "created") {
    return {
      subject: `Capta — Service issue detected`,
      html: emailWrapper(`
        <div style="padding:8px 12px;border-radius:8px;background:${color}15;border-left:4px solid ${color};margin-bottom:16px;">
          <span style="font-weight:600;color:${color};">ACTIVE INCIDENT</span>
        </div>
        <h2 style="margin:0 0 12px;color:#1e293b;">${incident.title}</h2>
        <p style="color:#475569;line-height:1.6;">We're aware of the issue and our team is working to resolve it as quickly as possible. Your calls may be temporarily affected.</p>
        <a href="${statusUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:500;">View System Status</a>
      `),
    };
  }
  if (event === "resolved") {
    return {
      subject: `Capta — Issue resolved`,
      html: emailWrapper(`
        <div style="padding:8px 12px;border-radius:8px;background:rgba(74,222,128,0.1);border-left:4px solid #4ade80;margin-bottom:16px;">
          <span style="font-weight:600;color:#16a34a;">RESOLVED</span>
        </div>
        <h2 style="margin:0 0 12px;color:#1e293b;">${incident.title}</h2>
        <p style="color:#475569;line-height:1.6;">The issue has been resolved. All services are operating normally. Total duration: ${formatDuration(incident.duration ?? 0)}.</p>
      `),
    };
  }
  return {
    subject: `Capta — Incident update`,
    html: emailWrapper(`
      <h2 style="margin:0 0 12px;color:#1e293b;">${incident.title}</h2>
      <p style="color:#475569;line-height:1.6;">We're continuing to work on the issue. Visit our status page for real-time updates.</p>
      <a href="${statusUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:500;">View Status</a>
    `),
  };
}

function getSubscriberEmailContent(incident: IncidentRow, event: NotificationEvent, lang: string, subscriberId: string): { subject: string; html: string } {
  const base = getClientEmailContent(incident, event, lang);
  const unsubUrl = `${env.NEXT_PUBLIC_APP_URL}/api/status/subscribe?unsubscribe=${subscriberId}`;
  const unsubText = lang === "es" ? "Cancelar suscripción" : "Unsubscribe";

  return {
    subject: base.subject,
    html: base.html.replace(
      "</div></body></html>",
      `<div style="text-align:center;padding-bottom:16px;"><a href="${unsubUrl}" style="font-size:11px;color:#94a3b8;text-decoration:underline;">${unsubText}</a></div></div></body></html>`,
    ),
  };
}
