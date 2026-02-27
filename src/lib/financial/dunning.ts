import { db } from "@/db";
import { dunningState, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import Twilio from "twilio";
import { env } from "@/lib/env";
import { canSendSms } from "@/lib/compliance/sms";
import { createNotification } from "@/lib/notifications";
import { canContactToday, logOutreach } from "@/lib/outreach";

const FROM_EMAIL = env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
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
      console.log(`[dunning] Skipping ${business.name} — already contacted today`);
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

    results.processed++;
  }

  return results;
}

// ── Email Templates ──

type DunningStage = "email1" | "email2" | "email3";

const templates: Record<DunningStage, { en: { subject: string; heading: string; body: string }; es: { subject: string; heading: string; body: string } }> = {
  email1: {
    en: {
      subject: "Action needed: Payment update required",
      heading: "Your recent payment didn't go through",
      body: "We tried to process your monthly payment of <strong>$497</strong>, but it was declined. This is usually caused by an expired card or insufficient funds. Please update your payment method to keep your AI receptionist running smoothly.",
    },
    es: {
      subject: "Acción requerida: Actualización de pago necesaria",
      heading: "Su pago reciente no fue procesado",
      body: "Intentamos procesar su pago mensual de <strong>$497</strong>, pero fue rechazado. Esto generalmente se debe a una tarjeta vencida o fondos insuficientes. Por favor actualice su método de pago para mantener su recepcionista IA funcionando sin problemas.",
    },
  },
  email2: {
    en: {
      subject: "Reminder: Your payment needs attention",
      heading: "Your payment is still pending",
      body: "We still haven't been able to process your <strong>$497</strong> monthly payment. If your payment method isn't updated soon, your AI receptionist service may be interrupted. We'd hate for your callers to go unanswered.",
    },
    es: {
      subject: "Recordatorio: Su pago necesita atención",
      heading: "Su pago aún está pendiente",
      body: "Aún no hemos podido procesar su pago mensual de <strong>$497</strong>. Si su método de pago no se actualiza pronto, su servicio de recepcionista IA podría ser interrumpido. No queremos que sus llamadas queden sin responder.",
    },
  },
  email3: {
    en: {
      subject: "Final notice: Service will be deactivated",
      heading: "Last chance to update your payment",
      body: "This is a final reminder about your overdue <strong>$497</strong> payment. If we don't receive payment within the next 7 days, your AI receptionist will be deactivated and calls will no longer be answered. Please update your payment method now to avoid any interruption.",
    },
    es: {
      subject: "Aviso final: El servicio será desactivado",
      heading: "Última oportunidad para actualizar su pago",
      body: "Este es un recordatorio final sobre su pago pendiente de <strong>$497</strong>. Si no recibimos el pago en los próximos 7 días, su recepcionista IA será desactivado y las llamadas ya no serán atendidas. Por favor actualice su método de pago ahora para evitar interrupciones.",
    },
  },
};

async function sendDunningEmail(
  business: { ownerEmail: string | null; name: string; defaultLanguage: string },
  lang: "en" | "es",
  stage: DunningStage,
  portalUrl: string,
) {
  if (!business.ownerEmail) return;
  const t = templates[stage][lang];
  const ctaLabel = lang === "es" ? "Actualizar Pago" : "Update Payment";

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Calltide</span>
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
  <p style="color:#94A3B8;font-size:11px;">Calltide Inc. &middot; San Antonio, TX</p>
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
    console.error(`[dunning] Failed to send ${stage} email:`, e);
  }
}

async function sendDunningSms(
  business: { ownerPhone: string; name: string; defaultLanguage: string },
  lang: "en" | "es",
  portalUrl: string,
) {
  const body =
    lang === "es"
      ? `Calltide: Su pago de $497 está pendiente. Actualice su método de pago para evitar interrupciones del servicio: ${portalUrl}`
      : `Calltide: Your $497 payment is past due. Update your payment method to avoid service interruption: ${portalUrl}`;

  try {
    const tw = getTwilio();
    await tw.messages.create({
      body,
      from: env.TWILIO_PHONE_NUMBER,
      to: business.ownerPhone,
    });
  } catch (e) {
    console.error("[dunning] Failed to send SMS:", e);
  }
}
