import { BRAND_COLOR, COMPANY_ADDRESS } from "@/lib/constants";
import { TRADE_PROFILES, calculateROI } from "@/lib/receptionist/trade-profiles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://calltide.app";

const TRADE_LABELS: Record<string, { en: string; es: string }> = {
  hvac: { en: "HVAC", es: "HVAC" },
  plumbing: { en: "plumbing", es: "plomería" },
  electrical: { en: "electrical", es: "electricidad" },
  roofing: { en: "roofing", es: "techado" },
  general_contractor: { en: "general contracting", es: "contratación general" },
  restoration: { en: "restoration", es: "restauración" },
  landscaping: { en: "landscaping", es: "jardinería" },
  pest_control: { en: "pest control", es: "control de plagas" },
  garage_door: { en: "garage door", es: "puertas de garaje" },
};

function calcMonthlyLoss(type: string): number {
  const key = type as keyof typeof TRADE_PROFILES;
  if (key in TRADE_PROFILES) {
    const roi = calculateROI(key);
    return roi.estimatedMonthlyLoss;
  }
  return 3 * 350 * 4; // fallback
}

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
  <span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};">Calltide</span>
</div>
${content}
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
<p>${COMPANY_ADDRESS}</p>
<p style="margin-top:8px;">
  <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
  &nbsp;|&nbsp; You're receiving this because you started setting up your Calltide receptionist.
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
  <span style="font-size:20px;font-weight:700;color:${BRAND_COLOR};">Calltide</span>
</div>
${content}
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
<p>${COMPANY_ADDRESS}</p>
<p style="margin-top:8px;">
  <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Cancelar suscripción</a>
  &nbsp;|&nbsp; Recibes esto porque comenzaste a configurar tu recepcionista de Calltide.
</p>
</div>
</div>
</body>
</html>`;
}

export interface SetupEmailData {
  sessionId: string;
  token: string;
  businessName: string;
  receptionistName: string;
  trade: string;
  city: string;
  currentStep: number;
  maxStepReached: number;
  language: string;
}

// ── EMAIL 1 — 4 hours: "[Name] is waiting for you" ──

function email1En(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  return {
    subject: `${d.receptionistName} is waiting for you`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Pick up where you left off</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        You started training <strong>${d.receptionistName}</strong> for <strong>${d.businessName}</strong> — she's ${d.maxStepReached >= 4 ? "almost ready" : "waiting for you to continue"}.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Your progress is saved. It only takes a few more minutes to finish.
      </p>
      ${goldButton(`Continue Training ${d.receptionistName} →`, resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        <strong>P.S.</strong> Questions? Reply to this email or call: <a href="tel:+18305217133" style="color:${BRAND_COLOR};">(830) 521-7133</a>
      </p>
    `, d.token),
  };
}

function email1Es(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  return {
    subject: `${d.receptionistName} te está esperando`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Continúa donde lo dejaste</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Empezaste a entrenar a <strong>${d.receptionistName}</strong> para <strong>${d.businessName}</strong> — ${d.maxStepReached >= 4 ? "casi está lista" : "te está esperando"}.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Tu progreso está guardado. Solo faltan unos minutos más para terminar.
      </p>
      ${goldButton(`Continuar Entrenando a ${d.receptionistName} →`, resumeUrl)}
      <p style="color:#64748b;font-size:13px;margin-top:24px;line-height:1.6;">
        <strong>P.D.</strong> ¿Preguntas? Responde a este correo o llama: <a href="tel:+18305217133" style="color:${BRAND_COLOR};">(830) 521-7133</a>
      </p>
    `, d.token),
  };
}

// ── EMAIL 2 — 24 hours: "You're X/6 steps done" ──

function email2En(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  return {
    subject: `You're ${d.maxStepReached}/6 steps done — finish hiring ${d.receptionistName}`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">You're ${d.maxStepReached}/6 steps done</h2>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <div style="display:flex;gap:4px;">
          ${Array.from({ length: 6 }, (_, i) => `<div style="flex:1;height:6px;border-radius:3px;background:${i < d.maxStepReached ? BRAND_COLOR : "#e2e8f0"};"></div>`).join("")}
        </div>
      </div>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${d.receptionistName} already knows about ${d.businessName}. A few more steps and she'll be answering your phones — in English and Spanish.
      </p>
      ${goldButton(`Finish Setup (Step ${d.maxStepReached + 1}/6) →`, resumeUrl)}
    `, d.token),
  };
}

function email2Es(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  return {
    subject: `Vas ${d.maxStepReached}/6 pasos — termina de contratar a ${d.receptionistName}`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Llevas ${d.maxStepReached}/6 pasos</h2>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <div style="display:flex;gap:4px;">
          ${Array.from({ length: 6 }, (_, i) => `<div style="flex:1;height:6px;border-radius:3px;background:${i < d.maxStepReached ? BRAND_COLOR : "#e2e8f0"};"></div>`).join("")}
        </div>
      </div>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${d.receptionistName} ya conoce ${d.businessName}. Unos pasos más y estará contestando tus llamadas — en inglés y español.
      </p>
      ${goldButton(`Terminar Configuración (Paso ${d.maxStepReached + 1}/6) →`, resumeUrl)}
    `, d.token),
  };
}

// ── EMAIL 3 — 72 hours: ROI email ──

function email3En(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  const tradeLabel = TRADE_LABELS[d.trade]?.en || d.trade?.replace(/_/g, " ") || "home service";
  const monthlyLoss = calcMonthlyLoss(d.trade);
  return {
    subject: `You're losing $${monthlyLoss.toLocaleString()}/month in missed calls`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Every missed call is a missed job</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${tradeLabel.charAt(0).toUpperCase() + tradeLabel.slice(1)} businesses in ${d.city || "your area"} miss an average of 3 calls per week.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 8px;">Your ROI at a glance:</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Estimated revenue lost: <strong>$${monthlyLoss.toLocaleString()}/mo</strong></p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Calltide cost: <strong>$497/mo</strong> (14-day free trial)</p>
        <p style="color:#059669;margin:4px 0;font-size:14px;font-weight:600;">Net gain: $${(monthlyLoss - 497).toLocaleString()}/mo</p>
      </div>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${d.receptionistName} is still configured exactly how you left her. Pick up where you stopped.
      </p>
      ${goldButton(`Hire ${d.receptionistName} for $497/mo →`, resumeUrl)}
    `, d.token),
  };
}

function email3Es(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  const tradeLabel = TRADE_LABELS[d.trade]?.es || d.trade?.replace(/_/g, " ") || "servicios del hogar";
  const monthlyLoss = calcMonthlyLoss(d.trade);
  return {
    subject: `Estás perdiendo $${monthlyLoss.toLocaleString()}/mes en llamadas perdidas`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Cada llamada perdida es un trabajo perdido</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Negocios de ${tradeLabel} en ${d.city || "tu área"} pierden un promedio de 3 llamadas por semana.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#0f172a;font-weight:600;margin:0 0 8px;">Tu ROI de un vistazo:</p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Ingresos perdidos estimados: <strong>$${monthlyLoss.toLocaleString()}/mes</strong></p>
        <p style="color:#475569;margin:4px 0;font-size:14px;">Costo de Calltide: <strong>$497/mes</strong> (14 días gratis)</p>
        <p style="color:#059669;margin:4px 0;font-size:14px;font-weight:600;">Ganancia neta: $${(monthlyLoss - 497).toLocaleString()}/mes</p>
      </div>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        ${d.receptionistName} sigue configurada exactamente como la dejaste. Continúa donde paraste.
      </p>
      ${goldButton(`Contratar a ${d.receptionistName} por $497/mes →`, resumeUrl)}
    `, d.token),
  };
}

// ── EMAIL 4 — 7 days: Last chance ──

function email4En(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  return {
    subject: `Last chance to hire ${d.receptionistName}`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Your setup expires soon</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        We keep incomplete setups for 14 days, then archive them.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        You named her <strong>${d.receptionistName}</strong>. You taught her about <strong>${d.businessName}</strong>. Don't let that setup go to waste.
      </p>
      ${goldButton(`Keep ${d.receptionistName} →`, resumeUrl)}
    `, d.token),
  };
}

function email4Es(d: SetupEmailData): { subject: string; html: string } {
  const resumeUrl = `${APP_URL}/setup?token=${d.token}`;
  return {
    subject: `Última oportunidad para contratar a ${d.receptionistName}`,
    html: baseLayoutEs(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Tu configuración expira pronto</h2>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        Mantenemos las configuraciones incompletas por 14 días, luego las archivamos.
      </p>
      <p style="color:#475569;line-height:1.7;font-size:15px;">
        La nombraste <strong>${d.receptionistName}</strong>. Le enseñaste sobre <strong>${d.businessName}</strong>. No dejes que se pierda.
      </p>
      ${goldButton(`Mantener a ${d.receptionistName} →`, resumeUrl)}
    `, d.token),
  };
}

// ── Public API ──

export type SetupEmailNumber = 1 | 2 | 3 | 4;

export function getSetupEmail(
  emailNumber: SetupEmailNumber,
  data: SetupEmailData,
): { subject: string; html: string; templateKey: string } {
  const isEs = data.language === "es";
  const generators: Record<number, Record<string, (d: SetupEmailData) => { subject: string; html: string }>> = {
    1: { en: email1En, es: email1Es },
    2: { en: email2En, es: email2Es },
    3: { en: email3En, es: email3Es },
    4: { en: email4En, es: email4Es },
  };
  const gen = generators[emailNumber][isEs ? "es" : "en"];
  const result = gen(data);
  return { ...result, templateKey: `setup_${emailNumber}` };
}

// Schedule: which email to send based on hours since session creation
export const SETUP_EMAIL_SCHEDULE: { emailNumber: SetupEmailNumber; hoursAfter: number }[] = [
  { emailNumber: 1, hoursAfter: 4 },
  { emailNumber: 2, hoursAfter: 24 },
  { emailNumber: 3, hoursAfter: 72 },
  { emailNumber: 4, hoursAfter: 168 }, // 7 days
];

// After 14 days (336 hours), mark as abandoned
export const SETUP_ABANDON_HOURS = 336;
