import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getResend } from "@/lib/email/client";
import {
  setupSessions,
  setupRetargetEmails,
  businesses,
} from "@/db/schema";
import { and, eq, isNull, isNotNull, sql, ne } from "drizzle-orm";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { BRAND_COLOR, COMPANY_ADDRESS } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
const FROM_EMAIL = "Ulysses at Capta <hello@contact.captahq.com>";
const REPLY_TO = process.env.OWNER_EMAIL || "hello@captahq.com";

// ── Time Windows ──
// Each window is a 2-hour range so that an hourly cron catches each session exactly once.
const RETARGET_WINDOWS = [
  { emailNumber: 1 as const, minHours: 2, maxHours: 4, minStep: 2, templateKey: "abandoned_2h" },
  { emailNumber: 2 as const, minHours: 23, maxHours: 25, minStep: 1, templateKey: "abandoned_24h" },
  { emailNumber: 3 as const, minHours: 71, maxHours: 73, minStep: 1, templateKey: "abandoned_72h" },
];

type EmailNumber = 1 | 2 | 3;

// ── Email Templates ──

function goldButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin-top:16px;">${text}</a>`;
}

function baseLayout(content: string, unsubToken: string): string {
  const unsubscribeUrl = `${APP_URL}/api/outreach/setup-unsubscribe/${unsubToken}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
<div style="margin-bottom:24px;">
  <span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};">Capta</span>
</div>
${content}
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
<p>${COMPANY_ADDRESS}</p>
<p style="margin-top:8px;">
  <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
  &nbsp;|&nbsp; You're receiving this because you started setting up your Capta receptionist.
</p>
</div>
</div>
</body>
</html>`;
}

function baseLayoutEs(content: string, unsubToken: string): string {
  const unsubscribeUrl = `${APP_URL}/api/outreach/setup-unsubscribe/${unsubToken}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
<div style="margin-bottom:24px;">
  <span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};">Capta</span>
</div>
${content}
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
<p>${COMPANY_ADDRESS}</p>
<p style="margin-top:8px;">
  <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Cancelar suscripcion</a>
  &nbsp;|&nbsp; Recibes esto porque comenzaste a configurar tu recepcionista de Capta.
</p>
</div>
</div>
</body>
</html>`;
}

interface EmailContent {
  subject: string;
  html: string;
}

function getEmail1(
  lang: string,
  receptionistName: string,
  businessName: string,
  resumeUrl: string,
  token: string,
): EmailContent {
  if (lang === "es") {
    return {
      subject: `Tu recepcionista IA casi esta lista`,
      html: baseLayoutEs(`
        <h2 style="color:#0f172a;margin:0 0 16px;">Tu recepcionista IA casi esta lista</h2>
        <p style="color:#475569;line-height:1.7;font-size:15px;">
          Empezaste a configurar a <strong>${receptionistName}</strong> para <strong>${businessName}</strong>.
          Tu progreso esta guardado y solo toma unos minutos mas para que empiece a contestar tus llamadas.
        </p>
        <p style="color:#475569;line-height:1.7;font-size:15px;">
          No dejes que las llamadas perdidas se conviertan en trabajos perdidos.
        </p>
        ${goldButton("Completar Configuracion →", resumeUrl)}
        <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
          <strong>P.D.</strong> Preguntas? Responde a este correo o llama: <a href="tel:+18305217133" style="color:${BRAND_COLOR};">(830) 521-7133</a>
        </p>
      `, token),
    };
  }

  return {
    subject: `Your AI receptionist is almost ready`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Your AI receptionist is almost ready</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        You started setting up <strong>${receptionistName}</strong> for <strong>${businessName}</strong>.
        Your progress is saved and it only takes a few more minutes to get her answering your phones.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Don't let missed calls turn into missed jobs.
      </p>
      ${goldButton("Complete Setup →", resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        <strong>P.S.</strong> Questions? Reply to this email or call: <a href="tel:+18305217133" style="color:${BRAND_COLOR};">(830) 521-7133</a>
      </p>
    `, token),
  };
}

function getEmail2(
  lang: string,
  receptionistName: string,
  businessName: string,
  resumeUrl: string,
  token: string,
): EmailContent {
  if (lang === "es") {
    return {
      subject: `No pierdas otra llamada — completa tu configuracion`,
      html: baseLayoutEs(`
        <h2 style="color:#0f172a;margin:0 0 16px;">No pierdas otra llamada</h2>
        <p style="color:#475569;line-height:1.7;font-size:15px;">
          Cada llamada que no contestas es dinero que se va a tu competencia.
          <strong>${receptionistName}</strong> puede contestar por <strong>${businessName}</strong> las 24 horas, en ingles y espanol.
        </p>
        <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
          <p style="color:#0f172a;font-weight:600;margin:0 0 8px;">Con Capta obtienes:</p>
          <p style="color:#475569;margin:4px 0;font-size:14px;">Contestar llamadas 24/7 en ingles y espanol</p>
          <p style="color:#475569;margin:4px 0;font-size:14px;">Agendar citas automaticamente</p>
          <p style="color:#475569;margin:4px 0;font-size:14px;">Tomar mensajes y manejar emergencias</p>
          <p style="color:#475569;margin:4px 0;font-size:14px;">Garantia de devolucion de 30 dias</p>
        </div>
        ${goldButton("Completar Configuracion →", resumeUrl)}
      `, token),
    };
  }

  return {
    subject: `Don't miss another call — complete your setup`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Don't miss another call</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Every call you miss is money walking to your competitor.
        <strong>${receptionistName}</strong> can answer for <strong>${businessName}</strong> around the clock, in English and Spanish.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 8px;">With Capta you get:</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">24/7 call answering in English and Spanish</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Automatic appointment booking</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Message taking and emergency handling</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">14-day free trial — no charge until day 15</p>
      </div>
      ${goldButton("Complete Setup →", resumeUrl)}
    `, token),
  };
}

function getEmail3(
  lang: string,
  receptionistName: string,
  businessName: string,
  resumeUrl: string,
  token: string,
): EmailContent {
  if (lang === "es") {
    return {
      subject: `Ultima oportunidad — tu configuracion expira pronto`,
      html: baseLayoutEs(`
        <h2 style="color:#0f172a;margin:0 0 16px;">Tu configuracion expira pronto</h2>
        <p style="color:#475569;line-height:1.7;font-size:15px;">
          Tu progreso configurando a <strong>${receptionistName}</strong> para <strong>${businessName}</strong>
          no estara guardado por mucho mas tiempo.
        </p>
        <p style="color:#475569;line-height:1.7;font-size:15px;">
          No dejes que el tiempo invertido se pierda. Completa la configuracion ahora y empieza a capturar
          cada llamada hoy mismo.
        </p>
        ${goldButton("Completar Configuracion Ahora →", resumeUrl)}
        <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
          <strong>P.D.</strong> Si tienes preguntas, responde a este correo — estoy aqui para ayudar.
        </p>
      `, token),
    };
  }

  return {
    subject: `Last chance — your setup expires soon`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Your setup expires soon</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Your progress setting up <strong>${receptionistName}</strong> for <strong>${businessName}</strong>
        won't be saved much longer.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Don't let the time you invested go to waste. Complete your setup now and start capturing
        every call today.
      </p>
      ${goldButton("Complete Setup Now →", resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        <strong>P.S.</strong> If you have questions, just reply to this email — I'm here to help.
      </p>
    `, token),
  };
}

function getEmailContent(
  emailNumber: EmailNumber,
  lang: string,
  receptionistName: string,
  businessName: string,
  resumeUrl: string,
  token: string,
): EmailContent {
  const generators: Record<EmailNumber, typeof getEmail1> = {
    1: getEmail1,
    2: getEmail2,
    3: getEmail3,
  };
  return generators[emailNumber](lang, receptionistName, businessName, resumeUrl, token);
}

// ── Route Handler ──

/**
 * GET /api/cron/abandoned-setup
 *
 * Hourly cron — sends retargeting emails to setup sessions that were abandoned
 * (started but not completed). Uses time-window approach so each hourly run
 * catches sessions in each window exactly once:
 *   - 2-4 hours after creation (step >= 2, has email): "Your AI receptionist is almost ready"
 *   - 23-25 hours after creation: "Don't miss another call"
 *   - 71-73 hours after creation: "Last chance — your setup expires soon"
 *
 * Skips sessions that:
 *   - Already converted (status = "converted")
 *   - Already have a matching business by email
 *   - Have no email address
 *   - Already received the email for this window
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("abandoned-setup", "0 * * * *", async () => {
    let resend;
    try {
      resend = getResend();
    } catch {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 },
      );
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;
    const emailsSentDetails: { sessionId: string; emailNumber: number; email: string }[] = [];

    try {
      const now = Date.now();

      // Pre-fetch all business emails to check for conversions efficiently.
      // This avoids N+1 queries inside the loop.
      const existingBusinessEmails = await db
        .select({ ownerEmail: businesses.ownerEmail })
        .from(businesses)
        .where(isNotNull(businesses.ownerEmail));
      const businessEmailSet = new Set(
        existingBusinessEmails
          .map((b) => b.ownerEmail?.toLowerCase())
          .filter(Boolean),
      );

      for (const window of RETARGET_WINDOWS) {
        const minTime = new Date(now - window.maxHours * 60 * 60 * 1000).toISOString();
        const maxTime = new Date(now - window.minHours * 60 * 60 * 1000).toISOString();

        // Find sessions created within this time window that haven't converted
        const candidates = await db
          .select()
          .from(setupSessions)
          .where(
            and(
              isNotNull(setupSessions.ownerEmail),
              isNull(setupSessions.convertedAt),
              ne(setupSessions.status, "converted"),
              sql`${setupSessions.createdAt} >= ${minTime}`,
              sql`${setupSessions.createdAt} <= ${maxTime}`,
              sql`${setupSessions.maxStepReached} >= ${window.minStep}`,
            ),
          );

        for (const session of candidates) {
          try {
            if (!session.ownerEmail) {
              skipped++;
              continue;
            }

            // Skip if a business already exists with this email (already converted elsewhere)
            if (businessEmailSet.has(session.ownerEmail.toLowerCase())) {
              skipped++;
              continue;
            }

            // Check if this specific email was already sent for this session
            const [alreadySent] = await db
              .select({ id: setupRetargetEmails.id })
              .from(setupRetargetEmails)
              .where(
                and(
                  eq(setupRetargetEmails.setupSessionId, session.id),
                  eq(setupRetargetEmails.emailNumber, window.emailNumber),
                  ne(setupRetargetEmails.status, "failed"),
                ),
              )
              .limit(1);

            if (alreadySent) {
              skipped++;
              continue;
            }

            const lang = session.language || "en";
            const receptionistName = session.receptionistName || "Maria";
            const businessName = session.businessName || "Your Business";
            const resumeUrl = `${APP_URL}/setup?token=${session.token}`;

            const emailContent = getEmailContent(
              window.emailNumber,
              lang,
              receptionistName,
              businessName,
              resumeUrl,
              session.token,
            );

            const { data, error } = await resend.emails.send({
              from: FROM_EMAIL,
              replyTo: REPLY_TO,
              to: session.ownerEmail,
              subject: emailContent.subject,
              html: emailContent.html,
            });

            if (error) {
              errors++;
              await db.insert(setupRetargetEmails).values({
                setupSessionId: session.id,
                emailNumber: window.emailNumber,
                templateKey: window.templateKey,
                status: "failed",
                language: lang,
              });
              reportError(
                `[abandoned-setup] Email ${window.emailNumber} failed for session ${session.id}`,
                error,
              );
              continue;
            }

            // Record successful send
            await db.insert(setupRetargetEmails).values({
              setupSessionId: session.id,
              emailNumber: window.emailNumber,
              templateKey: window.templateKey,
              status: "sent",
              resendId: data?.id,
              language: lang,
            });

            sent++;
            emailsSentDetails.push({
              sessionId: session.id,
              emailNumber: window.emailNumber,
              email: session.ownerEmail,
            });

            await logActivity({
              type: "email_sent",
              entityType: "prospect",
              entityId: session.prospectId || session.id,
              title: `Abandoned setup email ${window.emailNumber} sent`,
              detail: `To: ${session.ownerEmail} — ${emailContent.subject}`,
            });
          } catch (err) {
            errors++;
            reportError(
              `[abandoned-setup] Error processing session ${session.id}`,
              err,
            );
          }
        }
      }

      reportWarning("[abandoned-setup] Complete", { sent, skipped, errors });

      return NextResponse.json({
        success: true,
        sent,
        skipped,
        errors,
        emailsSent: emailsSentDetails,
      });
    } catch (err) {
      reportError("[abandoned-setup] Fatal error", err);
      return NextResponse.json(
        { error: "Abandoned setup cron failed" },
        { status: 500 },
      );
    }
  });
}
