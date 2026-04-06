import { db } from "@/db";
import { dunningState, businesses, calls } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import Twilio from "twilio";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getResend } from "@/lib/email/client";
import { canSendSms } from "@/lib/compliance/sms";
import { createNotification } from "@/lib/notifications";
import { canContactToday, logOutreach } from "@/lib/outreach";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";

const FROM_EMAIL = env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.captahq.com>";

/**
 * Get the display amount string based on the business's plan type.
 */
function getPlanAmount(planType?: string | null): { display: string; displayEs: string } {
  if (planType === "annual") {
    return { display: "$4,764/yr", displayEs: "$4,764/año" };
  }
  return { display: "$497/mo", displayEs: "$497/mes" };
}

let twilio: Twilio.Twilio | null = null;
function getTwilio(): Twilio.Twilio {
  if (!twilio) {
    twilio = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return twilio;
}

// ── Public API ──

export async function startDunning(businessId: string, failureCode?: string) {
  const existing = await db
    .select()
    .from(dunningState)
    .where(and(eq(dunningState.businessId, businessId), eq(dunningState.status, "active")))
    .limit(1);

  if (existing.length > 0) {
    // Update existing dunning state
    await db
      .update(dunningState)
      .set({
        attemptCount: (existing[0].attemptCount ?? 0) + 1,
        lastFailureCode: failureCode ?? existing[0].lastFailureCode,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(dunningState.id, existing[0].id));
    return existing[0];
  }

  // Create new dunning state
  const [state] = await db
    .insert(dunningState)
    .values({
      businessId,
      firstFailedAt: new Date().toISOString(),
      lastFailureCode: failureCode,
    })
    .returning();

  // Update business payment status
  await db
    .update(businesses)
    .set({ paymentStatus: "past_due", updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, businessId));

  // Send immediate SMS notification about payment failure
  try {
    const [biz] = await db
      .select({ ownerPhone: businesses.ownerPhone, twilioNumber: businesses.twilioNumber, defaultLanguage: businesses.defaultLanguage, planType: businesses.planType })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (biz?.ownerPhone) {
      const { display, displayEs } = getPlanAmount(biz.planType);
      const appUrl = env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
      const isEs = biz.defaultLanguage === "es";

      const smsBody = isEs
        ? `Tu pago de Capta (${displayEs}) no se procesó. Actualiza tu tarjeta para evitar interrupciones: ${appUrl}/dashboard/billing — Capta`
        : `Your Capta payment (${display}) failed to process. Update your card to avoid service interruption: ${appUrl}/dashboard/billing — Capta`;

      const t = getTwilio();
      await t.messages.create({
        to: biz.ownerPhone,
        from: biz.twilioNumber || env.TWILIO_PHONE_NUMBER,
        body: smsBody,
      });
    }
  } catch (err) {
    reportError("[dunning] Payment failure SMS notification failed", err, { businessId });
  }

  return state;
}

export async function clearDunning(businessId: string) {
  const [existing] = await db
    .select()
    .from(dunningState)
    .where(and(eq(dunningState.businessId, businessId), eq(dunningState.status, "active")))
    .limit(1);

  if (!existing) return;

  await db
    .update(dunningState)
    .set({
      status: "recovered",
      recoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(dunningState.id, existing.id));

  await db
    .update(businesses)
    .set({ paymentStatus: "active", updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, businessId));
}

export async function cancelDunning(businessId: string) {
  const [existing] = await db
    .select()
    .from(dunningState)
    .where(and(eq(dunningState.businessId, businessId), eq(dunningState.status, "active")))
    .limit(1);

  if (!existing) return;

  await db
    .update(dunningState)
    .set({
      status: "canceled",
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(dunningState.id, existing.id));

  await db
    .update(businesses)
    .set({ paymentStatus: "canceled", active: false, updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, businessId));
}

// ── Daily Dunning Processor ──

export async function processDunning() {
  const activeStates = await db
    .select()
    .from(dunningState)
    .where(eq(dunningState.status, "active"));

  const results = { processed: 0, emailsSent: 0, smsSent: 0 };

  for (const state of activeStates) {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, state.businessId))
      .limit(1);

    if (!business) continue;

    // Skip if already contacted today by another system
    if (!(await canContactToday(state.businessId))) {
      reportWarning(`[dunning] Skipping ${business.name} — already contacted today`);
      results.processed++;
      continue;
    }

    const daysSinceFailure = Math.floor(
      (Date.now() - new Date(state.firstFailedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    const lang = business.defaultLanguage === "es" ? "es" : "en";
    const portalUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

    // Day 0: Email 1 — friendly "payment failed, please update"
    if (!state.email1SentAt && daysSinceFailure >= 0) {
      await sendDunningEmail(business, lang, "email1", portalUrl);
      await logOutreach(state.businessId, "dunning", "email");
      await db
        .update(dunningState)
        .set({ email1SentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(dunningState.id, state.id));
      results.emailsSent++;
    }

    // Day 3: Email 2 — slightly more urgent
    if (!state.email2SentAt && daysSinceFailure >= 3) {
      await sendDunningEmail(business, lang, "email2", portalUrl);
      await logOutreach(state.businessId, "dunning", "email");
      await db
        .update(dunningState)
        .set({ email2SentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(dunningState.id, state.id));
      results.emailsSent++;
    }

    // Day 5: SMS (if canSendSms returns true)
    if (!state.smsSentAt && daysSinceFailure >= 5) {
      const smsCheck = await canSendSms(business.ownerPhone);
      if (smsCheck.allowed) {
        await sendDunningSms(business, lang, portalUrl);
        await logOutreach(state.businessId, "dunning", "sms");
        await db
          .update(dunningState)
          .set({ smsSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(eq(dunningState.id, state.id));
        results.smsSent++;
      }
    }

    // Day 7: Email 3 — final warning
    if (!state.email3SentAt && daysSinceFailure >= 7) {
      await sendDunningEmail(business, lang, "email3", portalUrl);
      await logOutreach(state.businessId, "dunning", "email");
      await db
        .update(dunningState)
        .set({ email3SentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(dunningState.id, state.id));
      results.emailsSent++;

      // Move to grace_period status
      await db
        .update(businesses)
        .set({ paymentStatus: "grace_period", updatedAt: new Date().toISOString() })
        .where(eq(businesses.id, state.businessId));

      // Notification — all retries exhausted
      await createNotification({
        source: "financial",
        severity: "critical",
        title: "Dunning exhausted",
        message: `${business.name} — all retry attempts exhausted, moved to grace period`,
        actionUrl: "/admin/billing",
      });
    }

    // Auto-cancel after grace period: 14 days for monthly, 30 days for annual
    const graceDays = business.planType === "annual" ? 30 : 14;
    if (state.email3SentAt && daysSinceFailure >= graceDays) {
      try {
        // Cancel via Stripe API if subscription exists
        if (business.stripeSubscriptionId) {
          const stripe = getStripe();
          await stripe.subscriptions.cancel(business.stripeSubscriptionId);
        }

        // Update dunning state to canceled
        await db
          .update(dunningState)
          .set({
            status: "canceled",
            canceledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(dunningState.id, state.id));

        // Deactivate business + set data retention hold (30 days)
        const holdUntil = new Date();
        holdUntil.setDate(holdUntil.getDate() + 30);
        await db
          .update(businesses)
          .set({
            active: false,
            paymentStatus: "canceled",
            dataRetentionHoldUntil: holdUntil.toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(businesses.id, state.businessId));

        // Send farewell email
        await sendFarewellEmail(business, lang);

        await createNotification({
          source: "financial",
          severity: "critical",
          title: "Auto-canceled after grace period",
          message: `${business.name} — subscription auto-canceled after ${graceDays} days unpaid. Data retained for 30 days.`,
          actionUrl: "/admin/billing",
        });

        await logActivity({
          type: "dunning_auto_cancel",
          entityType: "business",
          entityId: state.businessId,
          title: `${business.name} auto-canceled after ${graceDays}-day grace period`,
          detail: `Plan: ${business.planType || "monthly"}. Farewell email sent. Data retained for 30 days.`,
        });
      } catch (e) {
        reportError(`[dunning] Auto-cancel failed for ${business.name}`, e, { businessId: state.businessId });
      }
    }

    results.processed++;
  }

  return results;
}

// ── Email Templates ──

type DunningStage = "email1" | "email2" | "email3";

function getDunningTemplates(planType?: string | null): Record<DunningStage, { en: { subject: string; heading: string; body: string }; es: { subject: string; heading: string; body: string } }> {
  const { display, displayEs } = getPlanAmount(planType);
  return {
    email1: {
      en: {
        subject: "Action needed: Payment update required",
        heading: "Your recent payment didn't go through",
        body: `We tried to process your payment of <strong>${display}</strong>, but it was declined. This is usually caused by an expired card or insufficient funds. Please update your payment method to keep your AI receptionist running smoothly.`,
      },
      es: {
        subject: "Acción requerida: Actualización de pago necesaria",
        heading: "Su pago reciente no fue procesado",
        body: `Intentamos procesar su pago de <strong>${displayEs}</strong>, pero fue rechazado. Esto generalmente se debe a una tarjeta vencida o fondos insuficientes. Por favor actualice su método de pago para mantener su recepcionista IA funcionando sin problemas.`,
      },
    },
    email2: {
      en: {
        subject: "Reminder: Your payment needs attention",
        heading: "Your payment is still pending",
        body: `We still haven't been able to process your <strong>${display}</strong> payment. If your payment method isn't updated soon, your AI receptionist service may be interrupted. We'd hate for your callers to go unanswered.`,
      },
      es: {
        subject: "Recordatorio: Su pago necesita atención",
        heading: "Su pago aún está pendiente",
        body: `Aún no hemos podido procesar su pago de <strong>${displayEs}</strong>. Si su método de pago no se actualiza pronto, su servicio de recepcionista IA podría ser interrumpido. No queremos que sus llamadas queden sin responder.`,
      },
    },
    email3: {
      en: {
        subject: "Final notice: Service will be deactivated",
        heading: "Last chance to update your payment",
        body: `This is a final reminder about your overdue <strong>${display}</strong> payment. If we don't receive payment within the next 7 days, your AI receptionist will be deactivated and calls will no longer be answered. Please update your payment method now to avoid any interruption.`,
      },
      es: {
        subject: "Aviso final: El servicio será desactivado",
        heading: "Última oportunidad para actualizar su pago",
        body: `Este es un recordatorio final sobre su pago pendiente de <strong>${displayEs}</strong>. Si no recibimos el pago en los próximos 7 días, su recepcionista IA será desactivado y las llamadas ya no serán atendidas. Por favor actualice su método de pago ahora para evitar interrupciones.`,
      },
    },
  };
}

async function sendDunningEmail(
  business: { ownerEmail: string | null; name: string; defaultLanguage: string; planType?: string | null },
  lang: "en" | "es",
  stage: DunningStage,
  portalUrl: string,
) {
  if (!business.ownerEmail) return;
  const templates = getDunningTemplates(business.planType);
  const t = templates[stage][lang];
  const ctaLabel = lang === "es" ? "Actualizar Pago" : "Update Payment";

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span>
  </div>
  <h2 style="color:#1A1D24;margin-bottom:8px;">${t.heading}</h2>
  <p style="color:#475569;line-height:1.7;margin-bottom:16px;">
    Hi${business.name ? ` ${business.name}` : ""},
  </p>
  <p style="color:#475569;line-height:1.7;margin-bottom:24px;">${t.body}</p>
  <a href="${portalUrl}" style="display:inline-block;background:#C59A27;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    ${ctaLabel}
  </a>
  <p style="color:#94A3B8;font-size:13px;margin-top:32px;line-height:1.6;">
    ${lang === "es" ? "¿Necesita ayuda? Responda a este correo y le asistiremos." : "Need help? Reply to this email and we'll assist you."}
  </p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
  <p style="color:#94A3B8;font-size:11px;">Capta LLC &middot; San Antonio, TX</p>
</div>`;

  try {
    const r = getResend();
    await r.emails.send({
      from: FROM_EMAIL,
      to: business.ownerEmail,
      subject: t.subject,
      html,
    });
  } catch (e) {
    reportError(`[dunning] Failed to send ${stage} email`, e);
  }
}

// ── Trial Ending Email ──

export async function sendTrialEndingEmail(
  business: { id?: string; ownerEmail: string | null; ownerName: string; name: string; defaultLanguage: string; receptionistName?: string | null },
) {
  if (!business.ownerEmail) return;
  const lang = business.defaultLanguage === "es" ? "es" : "en";
  const portalUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;
  const aiName = business.receptionistName || "Maria";

  // Get call count during trial period
  let callCount = 0;
  if (business.id) {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(calls)
        .where(eq(calls.businessId, business.id));
      callCount = result?.count ?? 0;
    } catch {
      // Non-fatal — proceed without call count
    }
  }

  const callLine = callCount > 0
    ? lang === "es"
      ? `<strong>${aiName} ha respondido ${callCount} llamada${callCount === 1 ? "" : "s"}</strong> para tu negocio.`
      : `<strong>${aiName} has answered ${callCount} call${callCount === 1 ? "" : "s"}</strong> for your business.`
    : "";

  const t = lang === "es"
    ? {
        subject: `Bienvenido a Capta — ${business.name}`,
        heading: "Tu suscripción de Capta está activa",
        body: `Hola ${business.ownerName || ""},<br><br>${callLine ? callLine + "<br><br>" : ""}Tu suscripción de Capta para <strong>${business.name}</strong> está activa. Asegúrate de tener un método de pago registrado para que tu recepcionista IA siga respondiendo llamadas sin interrupción.<br><br>Si ya lo configuraste, ¡no tienes que hacer nada! Tu servicio continuará automáticamente.`,
        cta: "Revisar Facturación",
        footer: "¿Preguntas? Responde a este correo — estamos aquí para ayudar.",
      }
    : {
        subject: `Welcome to Capta — ${business.name}`,
        heading: "Your Capta subscription is active",
        body: `Hey ${business.ownerName || "there"},<br><br>${callLine ? callLine + "<br><br>" : ""}Your Capta subscription for <strong>${business.name}</strong> is active. Make sure you have a payment method on file to keep your AI receptionist answering calls without interruption.<br><br>If you've already set one up, you're all good — your service will continue automatically.`,
        cta: "Review Billing",
        footer: "Questions? Reply to this email — we're here to help.",
      };

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span>
  </div>
  <h2 style="color:#1A1D24;margin-bottom:8px;">${t.heading}</h2>
  <p style="color:#475569;line-height:1.7;margin-bottom:24px;">${t.body}</p>
  <a href="${portalUrl}" style="display:inline-block;background:#C59A27;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    ${t.cta}
  </a>
  <p style="color:#94A3B8;font-size:13px;margin-top:32px;line-height:1.6;">${t.footer}</p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
  <p style="color:#94A3B8;font-size:11px;">Capta LLC &middot; San Antonio, TX</p>
</div>`;

  try {
    const r = getResend();
    await r.emails.send({
      from: FROM_EMAIL,
      to: business.ownerEmail,
      subject: t.subject,
      html,
    });
  } catch (e) {
    reportError("[dunning] Failed to send trial-ending email", e);
  }
}

async function sendDunningSms(
  business: { ownerPhone: string; name: string; defaultLanguage: string; planType?: string | null },
  lang: "en" | "es",
  portalUrl: string,
) {
  const { display, displayEs } = getPlanAmount(business.planType);
  const amount = lang === "es" ? displayEs : display;
  const body =
    lang === "es"
      ? `Capta: Su pago de ${amount} está pendiente. Actualice su método de pago para evitar interrupciones del servicio: ${portalUrl}`
      : `Capta: Your ${amount} payment is past due. Update your payment method to avoid service interruption: ${portalUrl}`;

  try {
    const tw = getTwilio();
    await tw.messages.create({
      body,
      from: env.TWILIO_PHONE_NUMBER,
      to: business.ownerPhone,
    });
  } catch (e) {
    reportError("[dunning] Failed to send SMS", e);
  }
}

// ── Farewell Email ──

async function sendFarewellEmail(
  business: { ownerEmail: string | null; name: string; defaultLanguage: string },
  lang: "en" | "es",
) {
  if (!business.ownerEmail) return;
  const reactivateUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

  const t = lang === "es"
    ? {
        subject: `Tu cuenta de Capta ha sido desactivada — ${business.name}`,
        heading: "Tu cuenta ha sido desactivada",
        body: `Lamentamos informarte que tu cuenta de Capta para <strong>${business.name}</strong> ha sido desactivada porque no se pudo procesar el pago después de múltiples intentos.<br><br>Tu recepcionista IA ya no está respondiendo llamadas. Tus datos se conservarán por 30 días.<br><br>Si deseas reactivar tu servicio, simplemente actualiza tu método de pago.`,
        cta: "Reactivar Mi Cuenta",
        footer: "¿Necesita ayuda? Responda a este correo.",
      }
    : {
        subject: `Your Capta account has been deactivated — ${business.name}`,
        heading: "Your account has been deactivated",
        body: `We're sorry to let you know that your Capta account for <strong>${business.name}</strong> has been deactivated because we couldn't process your payment after multiple attempts.<br><br>Your AI receptionist is no longer answering calls. Your data will be retained for 30 days.<br><br>If you'd like to reactivate your service, simply update your payment method.`,
        cta: "Reactivate My Account",
        footer: "Need help? Reply to this email.",
      };

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span>
  </div>
  <h2 style="color:#1A1D24;margin-bottom:8px;">${t.heading}</h2>
  <p style="color:#475569;line-height:1.7;margin-bottom:24px;">${t.body}</p>
  <a href="${reactivateUrl}" style="display:inline-block;background:#C59A27;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
    ${t.cta}
  </a>
  <p style="color:#94A3B8;font-size:13px;margin-top:32px;line-height:1.6;">${t.footer}</p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
  <p style="color:#94A3B8;font-size:11px;">Capta LLC &middot; San Antonio, TX</p>
</div>`;

  try {
    const r = getResend();
    await r.emails.send({
      from: FROM_EMAIL,
      to: business.ownerEmail,
      subject: t.subject,
      html,
    });
  } catch (e) {
    reportError("[dunning] Failed to send farewell email", e);
  }
}
