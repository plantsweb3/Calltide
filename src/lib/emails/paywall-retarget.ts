import { BRAND_COLOR, COMPANY_ADDRESS } from "@/lib/constants";
import { buildPaywallUnsubscribeUrl } from "@/lib/outreach/unsubscribe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

// ROI: avg missed calls/week × avg job value for the trade
const TRADE_AVG_JOB: Record<string, number> = {
  hvac: 350,
  plumbing: 275,
  electrical: 350,
  roofing: 3000,
  general_contractor: 15000,
  remodeling: 5000,
  landscaping: 500,
  cleaning: 250,
  pest_control: 350,
  garage_door: 300,
};

const MISSED_CALLS_PER_WEEK = 3;

function getTradeLabel(type: string): string {
  const labels: Record<string, string> = {
    hvac: "HVAC",
    plumbing: "plumbing",
    electrical: "electrical",
    roofing: "roofing",
    general_contractor: "general contracting",
    remodeling: "remodeling",
    landscaping: "landscaping",
    cleaning: "cleaning",
    pest_control: "pest control",
    garage_door: "garage door",
  };
  return labels[type] || type?.replace(/_/g, " ") || "home service";
}

function getTradeLabelEs(type: string): string {
  const labels: Record<string, string> = {
    hvac: "HVAC",
    plumbing: "plomería",
    electrical: "electricidad",
    roofing: "techado",
    general_contractor: "contratación general",
    remodeling: "remodelación",
    landscaping: "jardinería",
    cleaning: "limpieza",
    pest_control: "control de plagas",
    garage_door: "puertas de garaje",
  };
  return labels[type] || type?.replace(/_/g, " ") || "servicios del hogar";
}

function calcMonthlyLoss(type: string): number {
  const avg = TRADE_AVG_JOB[type] || 350;
  return MISSED_CALLS_PER_WEEK * avg * 4; // 4 weeks
}

function goldButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin-top:16px;">${text}</a>`;
}

function formatHours(hours: Record<string, { open: string; close: string; closed?: boolean }> | null): string {
  if (!hours) return "Not set";
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const lines: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const day = hours[days[i]];
    if (!day || day.closed) {
      lines.push(`${dayLabels[i]}: Closed`);
    } else {
      lines.push(`${dayLabels[i]}: ${day.open} – ${day.close}`);
    }
  }
  return lines.join("<br>");
}

function formatHoursEs(hours: Record<string, { open: string; close: string; closed?: boolean }> | null): string {
  if (!hours) return "No configurado";
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const lines: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const day = hours[days[i]];
    if (!day || day.closed) {
      lines.push(`${dayLabels[i]}: Cerrado`);
    } else {
      lines.push(`${dayLabels[i]}: ${day.open} – ${day.close}`);
    }
  }
  return lines.join("<br>");
}

interface EmailData {
  businessId: string;
  businessName: string;
  receptionistName: string;
  trade: string;
  city: string;
  personalityPreset: string;
  services: string[];
  businessHours: Record<string, { open: string; close: string; closed?: boolean }> | null;
  onboardingPaywallReachedAt: string;
  language: string;
}

function baseLayout(content: string, businessId: string): string {
  const unsubscribeUrl = buildPaywallUnsubscribeUrl(APP_URL, businessId)
    ?? `${APP_URL}/api/outreach/paywall-unsubscribe/${businessId}`;
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

function baseLayoutEs(content: string, businessId: string): string {
  const unsubscribeUrl = buildPaywallUnsubscribeUrl(APP_URL, businessId)
    ?? `${APP_URL}/api/outreach/paywall-unsubscribe/${businessId}`;
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
  <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Cancelar suscripción</a>
  &nbsp;|&nbsp; Recibes esto porque comenzaste a configurar tu recepcionista de Capta.
</p>
</div>
</div>
</body>
</html>`;
}

// ── EMAIL 1 — 1 hour after paywall ──

function email1En(d: EmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  return {
    subject: `${d.receptionistName} is ready to start at ${d.businessName}`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Your receptionist is ready</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        You just finished setting up <strong>${d.receptionistName}</strong> for <strong>${d.businessName}</strong>.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        She already knows your hours, services, and how you want her to greet callers.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        All that's left is connecting your phone.
      </p>
      ${goldButton(`Activate ${d.receptionistName} →`, resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        <strong>P.S.</strong> Have questions? Reply to this email or call us: <a href="tel:+18305217133" style="color:${BRAND_COLOR};">(830) 521-7133</a>
      </p>
    `, d.businessId),
  };
}

function email1Es(d: EmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  return {
    subject: `${d.receptionistName} está lista para empezar en ${d.businessName}`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Tu recepcionista está lista</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Acabas de configurar a <strong>${d.receptionistName}</strong> para <strong>${d.businessName}</strong>.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Ya conoce tus horarios, servicios y cómo quieres que salude a los clientes.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Solo falta conectar tu teléfono.
      </p>
      ${goldButton(`Activar a ${d.receptionistName} →`, resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        <strong>P.D.</strong> ¿Tienes preguntas? Responde a este correo o llámanos: <a href="tel:+18305217133" style="color:${BRAND_COLOR};">(830) 521-7133</a>
      </p>
    `, d.businessId),
  };
}

// ── EMAIL 2 — 24 hours ──

function email2En(d: EmailData): { subject: string; html: string } {
  const trade = getTradeLabel(d.trade);
  const monthlyLoss = calcMonthlyLoss(d.trade);
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  return {
    subject: `Your ${trade} business is still missing calls`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Every missed call is a missed job</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        While you're thinking about it, ${trade} businesses in ${d.city || "your area"} are missing an average of 3 calls per week.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        That's roughly <strong>$${monthlyLoss.toLocaleString()}/month</strong> in lost jobs.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${d.receptionistName} is still set up exactly how you configured her — ${d.personalityPreset} style, bilingual, ready to go.
      </p>
      ${goldButton(`Hire ${d.receptionistName} for $497/mo →`, resumeUrl)}
    `, d.businessId),
  };
}

function email2Es(d: EmailData): { subject: string; html: string } {
  const trade = getTradeLabelEs(d.trade);
  const monthlyLoss = calcMonthlyLoss(d.trade);
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  return {
    subject: `Tu negocio de ${trade} sigue perdiendo llamadas`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Cada llamada perdida es un trabajo perdido</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Mientras lo piensas, negocios de ${trade} en ${d.city || "tu área"} pierden un promedio de 3 llamadas por semana.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Eso es aproximadamente <strong>$${monthlyLoss.toLocaleString()}/mes</strong> en trabajos perdidos.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${d.receptionistName} sigue configurada exactamente como la dejaste — estilo ${d.personalityPreset}, bilingüe, lista para trabajar.
      </p>
      ${goldButton(`Contratar a ${d.receptionistName} por $497/mes →`, resumeUrl)}
    `, d.businessId),
  };
}

// ── EMAIL 3 — 72 hours ──

function email3En(d: EmailData): { subject: string; html: string } {
  const startedAt = new Date(d.onboardingPaywallReachedAt);
  const minutesSpent = Math.max(5, Math.round((startedAt.getTime() - (startedAt.getTime() - 20 * 60_000)) / 60_000));
  const monthlyLoss = calcMonthlyLoss(d.trade);
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  return {
    subject: `You spent ${minutesSpent} minutes building ${d.receptionistName}`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Don't let your setup go to waste</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        You named her <strong>${d.receptionistName}</strong>. You chose her personality. You taught her about <strong>${d.businessName}</strong>.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        She's fully configured and waiting for a phone number.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Don't let that setup go to waste.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 8px;">Your ROI at a glance:</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Missed calls recovered: ~3/week</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Estimated revenue saved: <strong>$${monthlyLoss.toLocaleString()}/mo</strong></p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Capta cost: <strong>$497/mo</strong></p>
        <p style="color:#059669;margin:4px 0;font-size:14px;font-weight:600;">Net gain: $${(monthlyLoss - 497).toLocaleString()}/mo</p>
      </div>
      ${goldButton(`Activate ${d.receptionistName} →`, resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:20px;">
        Or pick up right where you left off — your progress is saved.
      </p>
    `, d.businessId),
  };
}

function email3Es(d: EmailData): { subject: string; html: string } {
  const startedAt = new Date(d.onboardingPaywallReachedAt);
  const minutesSpent = Math.max(5, Math.round((startedAt.getTime() - (startedAt.getTime() - 20 * 60_000)) / 60_000));
  const monthlyLoss = calcMonthlyLoss(d.trade);
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  return {
    subject: `Pasaste ${minutesSpent} minutos configurando a ${d.receptionistName}`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">No dejes que tu configuración se pierda</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        La nombraste <strong>${d.receptionistName}</strong>. Elegiste su personalidad. Le enseñaste sobre <strong>${d.businessName}</strong>.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Está completamente configurada y esperando un número de teléfono.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        No dejes que esa configuración se desperdicie.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 8px;">Tu ROI de un vistazo:</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Llamadas recuperadas: ~3/semana</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Ingresos estimados: <strong>$${monthlyLoss.toLocaleString()}/mes</strong></p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Costo de Capta: <strong>$497/mes</strong></p>
        <p style="color:#059669;margin:4px 0;font-size:14px;font-weight:600;">Ganancia neta: $${(monthlyLoss - 497).toLocaleString()}/mes</p>
      </div>
      ${goldButton(`Activar a ${d.receptionistName} →`, resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:20px;">
        O continúa donde lo dejaste — tu progreso está guardado.
      </p>
    `, d.businessId),
  };
}

// ── EMAIL 4 — 7 days ──

function email4En(d: EmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  const servicesList = (d.services || []).slice(0, 6).join(", ") || "Your services";
  return {
    subject: `Last chance: ${d.receptionistName}'s profile expires in 7 days`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Your setup expires soon</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        We keep incomplete setups for 14 days, then archive them.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        After that, you'd need to start the setup process over.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 12px;">What ${d.receptionistName} knows about ${d.businessName}:</p>
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr><td style="padding:4px 0;font-weight:600;width:90px;">Hours:</td><td style="padding:4px 0;">${formatHours(d.businessHours)}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Services:</td><td style="padding:4px 0;">${servicesList}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Style:</td><td style="padding:4px 0;">${d.personalityPreset}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Languages:</td><td style="padding:4px 0;">English & Spanish</td></tr>
        </table>
      </div>
      ${goldButton(`Keep ${d.receptionistName} →`, resumeUrl)}
    `, d.businessId),
  };
}

function email4Es(d: EmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/dashboard/onboarding?step=6`;
  const servicesList = (d.services || []).slice(0, 6).join(", ") || "Tus servicios";
  return {
    subject: `Última oportunidad: el perfil de ${d.receptionistName} expira en 7 días`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Tu configuración expira pronto</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Mantenemos las configuraciones incompletas por 14 días, luego las archivamos.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Después de eso, tendrías que comenzar el proceso de nuevo.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 12px;">Lo que ${d.receptionistName} sabe sobre ${d.businessName}:</p>
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr><td style="padding:4px 0;font-weight:600;width:90px;">Horario:</td><td style="padding:4px 0;">${formatHoursEs(d.businessHours)}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Servicios:</td><td style="padding:4px 0;">${servicesList}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Estilo:</td><td style="padding:4px 0;">${d.personalityPreset}</td></tr>
          <tr><td style="padding:4px 0;font-weight:600;">Idiomas:</td><td style="padding:4px 0;">Inglés y Español</td></tr>
        </table>
      </div>
      ${goldButton(`Mantener a ${d.receptionistName} →`, resumeUrl)}
    `, d.businessId),
  };
}

// ── Public API ──

export type PaywallEmailNumber = 1 | 2 | 3 | 4;

export function getPaywallEmail(
  emailNumber: PaywallEmailNumber,
  data: EmailData,
): { subject: string; html: string; templateKey: string } {
  const isEs = data.language === "es";
  const generators: Record<number, Record<string, (d: EmailData) => { subject: string; html: string }>> = {
    1: { en: email1En, es: email1Es },
    2: { en: email2En, es: email2Es },
    3: { en: email3En, es: email3Es },
    4: { en: email4En, es: email4Es },
  };
  const gen = generators[emailNumber][isEs ? "es" : "en"];
  const result = gen(data);
  return { ...result, templateKey: `paywall_${emailNumber}` };
}

// Schedule: which email to send based on hours since paywall
export const PAYWALL_EMAIL_SCHEDULE: { emailNumber: PaywallEmailNumber; hoursAfter: number }[] = [
  { emailNumber: 1, hoursAfter: 1 },
  { emailNumber: 2, hoursAfter: 24 },
  { emailNumber: 3, hoursAfter: 72 },
  { emailNumber: 4, hoursAfter: 168 }, // 7 days
];

// After 14 days total (336 hours), mark as abandoned
export const ABANDON_HOURS = 336;
