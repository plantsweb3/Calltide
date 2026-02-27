import { Resend } from "resend";
import { db } from "@/db";
import { auditRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const BRAND_COLOR = "#C59A27";
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://calltide.app";
const COMPANY_ADDRESS = "Calltide LLC, PO Box 1247, San Marcos, TX 78667";
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://cal.com/calltide/onboarding";

const REVENUE_PER_CALL: Record<string, number> = {
  plumber: 250,
  hvac: 350,
  electrician: 200,
  landscaper: 150,
  general_contractor: 200,
  other: 200,
};

interface AuditReportData {
  auditRequestId: string;
  result: "answered" | "missed" | "voicemail" | "failed";
  ringTime?: number;
  answeredBy?: string;
}

export async function generateAndSendAuditReport(data: AuditReportData) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    reportError("RESEND_API_KEY not set — cannot send audit report", new Error("Missing env"));
    return;
  }

  const [auditReq] = await db
    .select()
    .from(auditRequests)
    .where(eq(auditRequests.id, data.auditRequestId))
    .limit(1);

  if (!auditReq) return;

  const lang = (auditReq.language as "en" | "es") ?? "en";
  const revenuePerCall = REVENUE_PER_CALL[auditReq.businessType ?? "other"] ?? 200;
  const monthlyLoss = revenuePerCall * 3 * 4; // 3 calls/week * 4 weeks
  const trackingUrl = `${MARKETING_URL}/api/audit/track/${auditReq.id}`;

  const emailContent = buildReportEmail({
    businessName: auditReq.businessName,
    result: data.result,
    ringTime: data.ringTime,
    revenuePerCall,
    monthlyLoss,
    lang,
    trackingUrl,
    email: auditReq.email,
  });

  try {
    const resend = new Resend(apiKey);
    const from = process.env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>";

    await resend.emails.send({
      from,
      to: auditReq.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    await db.update(auditRequests).set({
      reportSentAt: new Date().toISOString(),
    }).where(eq(auditRequests.id, auditReq.id));
  } catch (error) {
    reportError("Failed to send audit report email", error);
  }
}

function buildReportEmail(params: {
  businessName: string;
  result: string;
  ringTime?: number;
  revenuePerCall: number;
  monthlyLoss: number;
  lang: "en" | "es";
  trackingUrl: string;
  email: string;
}) {
  const { businessName, result, ringTime, revenuePerCall, monthlyLoss, lang, trackingUrl, email } = params;
  const unsubscribeUrl = `${MARKETING_URL}/unsubscribe?email=${encodeURIComponent(email)}`;

  const isEn = lang === "en";

  let subject: string;
  let headline: string;
  let body: string;

  if (result === "missed") {
    subject = isEn
      ? `Your Free Call Audit Report — ${businessName}`
      : `Su Reporte de Auditoría Gratuito — ${businessName}`;
    headline = isEn
      ? "We called. Nobody picked up."
      : "Llamamos. Nadie contestó.";
    body = isEn
      ? `<p>We called <strong>${businessName}</strong>${ringTime ? ` and it rang for <strong>${ringTime} seconds</strong>` : ""} with no answer.</p>
         <p>Here's what that means for your bottom line:</p>
         <ul style="padding-left:20px;">
           <li><strong>62% of callers</strong> won't leave a voicemail — they'll call your competitor instead</li>
           <li>Average value per call for your business type: <strong>$${revenuePerCall}</strong></li>
           <li>If you miss just 3 calls per week: <strong>$${monthlyLoss.toLocaleString()}/month</strong> in lost revenue</li>
         </ul>`
      : `<p>Llamamos a <strong>${businessName}</strong>${ringTime ? ` y sonó durante <strong>${ringTime} segundos</strong>` : ""} sin respuesta.</p>
         <p>Esto es lo que significa para su negocio:</p>
         <ul style="padding-left:20px;">
           <li><strong>62% de los llamantes</strong> no dejarán un mensaje de voz — llamarán a su competidor</li>
           <li>Valor promedio por llamada para su tipo de negocio: <strong>$${revenuePerCall}</strong></li>
           <li>Si pierde solo 3 llamadas por semana: <strong>$${monthlyLoss.toLocaleString()}/mes</strong> en ingresos perdidos</li>
         </ul>`;
  } else if (result === "voicemail") {
    subject = isEn
      ? `Your Free Call Audit Report — ${businessName}`
      : `Su Reporte de Auditoría Gratuito — ${businessName}`;
    headline = isEn
      ? "We reached your voicemail."
      : "Llegamos a su buzón de voz.";
    body = isEn
      ? `<p>We called <strong>${businessName}</strong>${ringTime ? ` — it rang for <strong>${ringTime} seconds</strong>` : ""} before going to voicemail.</p>
         <p><strong>80% of callers hang up</strong> before leaving a voicemail. That's potential revenue walking away.</p>
         <ul style="padding-left:20px;">
           <li>Average value per call: <strong>$${revenuePerCall}</strong></li>
           <li>Estimated monthly loss from missed calls: <strong>$${monthlyLoss.toLocaleString()}</strong></li>
         </ul>`
      : `<p>Llamamos a <strong>${businessName}</strong>${ringTime ? ` — sonó durante <strong>${ringTime} segundos</strong>` : ""} antes de ir al buzón de voz.</p>
         <p><strong>80% de los llamantes cuelgan</strong> antes de dejar un mensaje. Eso es dinero que se va.</p>
         <ul style="padding-left:20px;">
           <li>Valor promedio por llamada: <strong>$${revenuePerCall}</strong></li>
           <li>Pérdida mensual estimada por llamadas perdidas: <strong>$${monthlyLoss.toLocaleString()}</strong></li>
         </ul>`;
  } else {
    // answered
    subject = isEn
      ? `Your Free Call Audit Report — ${businessName}`
      : `Su Reporte de Auditoría Gratuito — ${businessName}`;
    headline = isEn
      ? "Great news — someone answered!"
      : "¡Buenas noticias — alguien contestó!";
    body = isEn
      ? `<p>We called <strong>${businessName}</strong> and someone picked up. That's a great sign!</p>
         <p>But here's the question: <strong>Are you covered when you're busy on a job?</strong> After hours? On weekends?</p>
         <p>Most service businesses miss <strong>30-40% of their calls</strong> during peak hours when techs are in the field.</p>
         <ul style="padding-left:20px;">
           <li>Average value per missed call: <strong>$${revenuePerCall}</strong></li>
           <li>If you miss just 3 overflow calls/week: <strong>$${monthlyLoss.toLocaleString()}/month</strong></li>
         </ul>`
      : `<p>Llamamos a <strong>${businessName}</strong> y alguien contestó. ¡Eso es buena señal!</p>
         <p>Pero aquí va la pregunta: <strong>¿Está cubierto cuando está ocupado en un trabajo?</strong> ¿Fuera de horario? ¿Los fines de semana?</p>
         <p>La mayoría de negocios de servicio pierden <strong>30-40% de sus llamadas</strong> durante horas pico.</p>
         <ul style="padding-left:20px;">
           <li>Valor promedio por llamada perdida: <strong>$${revenuePerCall}</strong></li>
           <li>Si pierde solo 3 llamadas de desborde/semana: <strong>$${monthlyLoss.toLocaleString()}/mes</strong></li>
         </ul>`;
  }

  const mariaSection = isEn
    ? `<h3 style="color:#0f172a;margin-top:24px;">What Calltide Could Do For You</h3>
       <p>Maria, our AI receptionist, answers every call in <strong>under 8 seconds</strong> — in English and Spanish. She books appointments, takes messages, and texts you the details. 24/7/365.</p>
       <p>All for less than <strong>$17/day</strong>.</p>`
    : `<h3 style="color:#0f172a;margin-top:24px;">Lo Que Calltide Puede Hacer Por Usted</h3>
       <p>Maria, nuestra recepcionista IA, contesta cada llamada en <strong>menos de 8 segundos</strong> — en inglés y español. Agenda citas, toma mensajes y le envía los detalles por texto. 24/7/365.</p>
       <p>Todo por menos de <strong>$17/día</strong>.</p>`;

  const ctaText = isEn ? "Book a Free Demo" : "Reservar una Demo Gratis";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <img src="${MARKETING_URL}/images/logo.webp" alt="Calltide" style="height:24px;margin-bottom:24px;" />

  <h2 style="color:#0f172a;margin-bottom:8px;">${headline}</h2>
  <div style="color:#475569;line-height:1.7;font-size:15px;">
    ${body}
  </div>

  <div style="color:#475569;line-height:1.7;font-size:15px;">
    ${mariaSection}
  </div>

  <a href="${BOOKING_URL}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin-top:20px;">
    ${ctaText} &rarr;
  </a>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
    <p>Calltide — AI Voice Agents for Local Businesses</p>
    <p style="margin-top:8px;">${COMPANY_ADDRESS}</p>
    <p style="margin-top:8px;">
      <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
      &nbsp;|&nbsp; You received this because you requested a free call audit.
    </p>
  </div>

  <img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;" />
</div>
</body>
</html>`;

  return { subject, html };
}
