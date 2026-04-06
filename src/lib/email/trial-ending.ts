import { sendEmailWithRetry } from "./client";
import { reportError } from "@/lib/error-reporting";

const FROM = "Capta <notifications@captahq.com>";

interface TrialEndingParams {
  to: string;
  businessName: string;
  receptionistName: string;
  daysLeft: number;
  lang: "en" | "es";
  baseUrl?: string;
}

/** Returns true if the email was sent successfully, false otherwise. */
export async function sendTrialEndingEmail(params: TrialEndingParams): Promise<boolean> {
  const { to, businessName, receptionistName, daysLeft, lang } = params;
  const billingUrl = `${params.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com"}/dashboard/billing`;

  const subject =
    lang === "es"
      ? `Tu prueba gratuita de Capta termina en ${daysLeft} días`
      : `Your Capta free trial ends in ${daysLeft} days`;

  const html =
    lang === "es"
      ? `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 22px; color: #1B2A4A; margin: 0;">Tu prueba gratuita termina pronto</h1>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin-top: 16px;">
        Hola — tu prueba gratuita de 14 días para <strong>${businessName}</strong> termina en <strong>${daysLeft} días</strong>.
      </p>
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        Después del período de prueba, se cobrará $497/mes a tu tarjeta registrada. ${receptionistName} seguirá contestando tus llamadas sin interrupción.
      </p>
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        Si deseas cancelar antes de que termine la prueba, puedes hacerlo desde tu panel de control.
      </p>
      <a href="${billingUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 28px; background: #D4A843; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Ver facturación
      </a>
      <p style="font-size: 12px; color: #999; margin-top: 32px;">Capta — La recepcionista IA para tu negocio</p>
    </div>`
      : `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 22px; color: #1B2A4A; margin: 0;">Your free trial ends soon</h1>
      <p style="font-size: 15px; color: #555; line-height: 1.6; margin-top: 16px;">
        Hey — your 14-day free trial for <strong>${businessName}</strong> ends in <strong>${daysLeft} days</strong>.
      </p>
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        After the trial, your card on file will be charged $497/mo. ${receptionistName} will keep answering your calls without any interruption.
      </p>
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        If you'd like to cancel before the trial ends, you can do so from your dashboard.
      </p>
      <a href="${billingUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 28px; background: #D4A843; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        View billing
      </a>
      <p style="font-size: 12px; color: #999; margin-top: 32px;">Capta — The AI receptionist for your business</p>
    </div>`;

  try {
    await sendEmailWithRetry({ from: FROM, to, subject, html });
    return true;
  } catch (err) {
    reportError("Failed to send trial-ending email", err, { extra: { to, businessName } });
    return false;
  }
}
