import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmailWithRetry } from "@/lib/email/client";
import { reportError } from "@/lib/error-reporting";

const FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.captahq.com>";

interface WelcomeEmailParams {
  businessId: string;
  email: string;
  generatedPassword: string;
}

/**
 * Send a branded welcome email after payment with login credentials,
 * next steps, and Twilio number (if available).
 *
 * Fire-and-forget — caller should `.catch()` errors.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { businessId, email, generatedPassword } = params;

  // Load business data for personalization
  const [biz] = await db
    .select({
      name: businesses.name,
      ownerName: businesses.ownerName,
      receptionistName: businesses.receptionistName,
      twilioNumber: businesses.twilioNumber,
      defaultLanguage: businesses.defaultLanguage,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    reportError("[welcome-email] Business not found", new Error("Missing business"), {
      extra: { businessId },
    });
    return;
  }

  const isSpanish = biz.defaultLanguage === "es";
  const firstName = biz.ownerName?.split(" ")[0] || (isSpanish ? "amigo" : "there");
  const receptionistName = biz.receptionistName || "Maria";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const formattedTwilio = biz.twilioNumber ? formatPhoneForDisplay(biz.twilioNumber) : null;

  const subject = isSpanish
    ? `Bienvenido a Capta - ${receptionistName} esta lista`
    : `Welcome to Capta - ${receptionistName} is ready`;

  const html = buildEmailHtml({
    isSpanish,
    firstName,
    receptionistName,
    email,
    generatedPassword,
    twilioNumber: formattedTwilio,
    rawTwilioNumber: biz.twilioNumber || null,
    appUrl,
    businessName: biz.name,
  });

  await sendEmailWithRetry({
    from: FROM_EMAIL,
    to: email,
    subject,
    html,
  });
}

function buildEmailHtml(params: {
  isSpanish: boolean;
  firstName: string;
  receptionistName: string;
  email: string;
  generatedPassword: string;
  twilioNumber: string | null;
  rawTwilioNumber: string | null;
  appUrl: string;
  businessName: string;
}): string {
  const {
    isSpanish,
    firstName,
    receptionistName,
    email,
    generatedPassword,
    twilioNumber,
    rawTwilioNumber,
    appUrl,
    businessName,
  } = params;

  const t = isSpanish
    ? {
        greeting: `Hola ${firstName},`,
        paymentConfirmed: "Tu pago ha sido confirmado.",
        receptionistReady: `${receptionistName} esta lista para contestar tus llamadas 24/7 en ingles y espanol.`,
        credentialsTitle: "Tus Credenciales",
        emailLabel: "Correo",
        passwordLabel: "Contrasena temporal",
        passwordNote: "Puedes cambiar tu contrasena en Configuracion despues de iniciar sesion.",
        loginCta: "Iniciar Sesion",
        nextStepsTitle: "Siguientes Pasos",
        step1: "Inicia sesion en tu panel con las credenciales de arriba",
        step2: "Configura el desvio de llamadas a tu numero de Capta",
        step3: `Activa a ${receptionistName} para empezar a contestar llamadas`,
        yourNumberTitle: "Tu Numero de Capta",
        yourNumberNote: "Desvia tus llamadas de negocio a este numero.",
        forwardingTitle: "Instrucciones Rapidas de Desvio",
        att: "AT&T: Marca *21*{NUMBER}#",
        verizon: "Verizon: Marca *72 {NUMBER}",
        tmobile: "T-Mobile: Marca **21*{NUMBER}#",
        needHelp: "Necesitas ayuda?",
        helpNote: "Responde a este correo o envia un mensaje a tu numero de Capta. Estamos aqui para ayudarte.",
        footer: `Gracias por elegir Capta para ${businessName}.`,
      }
    : {
        greeting: `Hi ${firstName},`,
        paymentConfirmed: "Your payment has been confirmed.",
        receptionistReady: `${receptionistName} is ready to answer your calls 24/7 in English and Spanish.`,
        credentialsTitle: "Your Login Credentials",
        emailLabel: "Email",
        passwordLabel: "Temporary Password",
        passwordNote: "You can change your password in Settings after logging in.",
        loginCta: "Log In to Dashboard",
        nextStepsTitle: "Next Steps",
        step1: "Log in to your dashboard with the credentials above",
        step2: "Set up call forwarding to your Capta number",
        step3: `Activate ${receptionistName} to start answering calls`,
        yourNumberTitle: "Your Capta Number",
        yourNumberNote: "Forward your business calls to this number.",
        forwardingTitle: "Quick Forwarding Instructions",
        att: "AT&T: Dial *21*{NUMBER}#",
        verizon: "Verizon: Dial *72 {NUMBER}",
        tmobile: "T-Mobile: Dial **21*{NUMBER}#",
        needHelp: "Need help?",
        helpNote: "Reply to this email or text your Capta number. We're here for you.",
        footer: `Thank you for choosing Capta for ${businessName}.`,
      };

  const twilioSection = twilioNumber && rawTwilioNumber
    ? `
      <tr>
        <td style="padding: 0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4ff; border: 1px solid #dbe4f0; border-radius: 8px;">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600;">${t.yourNumberTitle}</p>
                <p style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #1B2A4A; font-family: 'Inter', Arial, sans-serif;">${twilioNumber}</p>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">${t.yourNumberNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 24px;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1B2A4A;">${t.forwardingTitle}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #374151;">
            <tr><td style="padding: 4px 0;">${t.att.replace("{NUMBER}", rawTwilioNumber)}</td></tr>
            <tr><td style="padding: 4px 0;">${t.verizon.replace("{NUMBER}", rawTwilioNumber)}</td></tr>
            <tr><td style="padding: 4px 0;">${t.tmobile.replace("{NUMBER}", rawTwilioNumber)}</td></tr>
          </table>
        </td>
      </tr>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="${isSpanish ? "es" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSpanish ? "Bienvenido a Capta" : "Welcome to Capta"}</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: #1B2A4A; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; font-family: 'Inter', Arial, sans-serif;">Capta</h1>
              <div style="margin-top: 8px; width: 40px; height: 3px; background: #D4A843; display: inline-block; border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <p style="margin: 0 0 12px; font-size: 16px; color: #1B2A4A; font-weight: 600;">${t.greeting}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #374151; line-height: 1.6;">${t.paymentConfirmed}</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #374151; line-height: 1.6;">${t.receptionistReady}</p>
            </td>
          </tr>

          <!-- Credentials -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fdf6e3, #fef9ee); border: 2px solid #D4A843; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #1B2A4A;">${t.credentialsTitle}</p>
                    <table cellpadding="0" cellspacing="0" style="font-size: 13px; width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280; width: 140px;">${t.emailLabel}:</td>
                        <td style="padding: 4px 0; color: #1B2A4A; font-weight: 600;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #6b7280;">${t.passwordLabel}:</td>
                        <td style="padding: 4px 0;">
                          <code style="background: #1B2A4A; color: #D4A843; padding: 2px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">${generatedPassword}</code>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0; font-size: 11px; color: #9ca3af;">${t.passwordNote}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <a href="${appUrl}/dashboard/login" style="display: inline-block; background: #D4A843; color: #1B2A4A; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none;">${t.loginCta}</a>
            </td>
          </tr>

          <!-- Twilio Number + Forwarding -->
          ${twilioSection}

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1B2A4A;">${t.nextStepsTitle}</p>
              <table cellpadding="0" cellspacing="0" style="font-size: 13px; color: #374151; line-height: 1.8;">
                <tr>
                  <td style="padding: 2px 8px 2px 0; color: #D4A843; font-weight: 700; vertical-align: top;">1.</td>
                  <td style="padding: 2px 0;">${t.step1}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px 2px 0; color: #D4A843; font-weight: 700; vertical-align: top;">2.</td>
                  <td style="padding: 2px 0;">${t.step2}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px 2px 0; color: #D4A843; font-weight: 700; vertical-align: top;">3.</td>
                  <td style="padding: 2px 0;">${t.step3}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #1B2A4A;">${t.needHelp}</p>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">${t.helpNote}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">${t.footer}</p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db;">Capta HQ &middot; captahq.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
