import { getResend } from "@/lib/email/client";
import { env } from "@/lib/env";
import { db } from "@/db";
import { prospectOutreach, paywallEmails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

const FROM_EMAIL = env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.captahq.com>";

export async function sendOutreachEmail(params: {
  prospectId: string;
  to: string;
  subject: string;
  html: string;
  templateKey: string;
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const resend = getResend();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const [outreach] = await db
      .insert(prospectOutreach)
      .values({
        prospectId: params.prospectId,
        channel: "email",
        templateKey: params.templateKey,
        status: "sent",
        externalId: data?.id,
        sentAt: new Date().toISOString(),
      })
      .returning();

    await logActivity({
      type: "email_sent",
      entityType: "prospect",
      entityId: params.prospectId,
      title: `Email sent: ${params.templateKey}`,
      detail: `To: ${params.to}`,
    });

    return { success: true, emailId: outreach.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}

export async function handleEmailWebhook(event: {
  type: string;
  data: { email_id: string };
}) {
  const { type, data } = event;

  const [outreach] = await db
    .select()
    .from(prospectOutreach)
    .where(eq(prospectOutreach.externalId, data.email_id));

  if (!outreach) return;

  const now = new Date().toISOString();

  switch (type) {
    case "email.opened":
      await db
        .update(prospectOutreach)
        .set({ status: "opened", openedAt: now })
        .where(eq(prospectOutreach.id, outreach.id));
      await logActivity({
        type: "email_opened",
        entityType: "prospect",
        entityId: outreach.prospectId,
        title: "Email opened",
        detail: outreach.templateKey,
      });
      break;

    case "email.clicked":
      await db
        .update(prospectOutreach)
        .set({ status: "clicked", clickedAt: now })
        .where(eq(prospectOutreach.id, outreach.id));
      await logActivity({
        type: "email_clicked",
        entityType: "prospect",
        entityId: outreach.prospectId,
        title: "Email link clicked",
        detail: outreach.templateKey,
      });
      break;

    case "email.bounced":
      await db
        .update(prospectOutreach)
        .set({ status: "bounced" })
        .where(eq(prospectOutreach.id, outreach.id));
      break;
  }

  // Also check paywall retarget emails
  await handlePaywallEmailWebhook(event);
}

async function handlePaywallEmailWebhook(event: {
  type: string;
  data: { email_id: string };
}) {
  const { type, data } = event;

  const [pe] = await db
    .select()
    .from(paywallEmails)
    .where(eq(paywallEmails.resendId, data.email_id));

  if (!pe) return;

  const now = new Date().toISOString();

  switch (type) {
    case "email.opened":
      if (!pe.openedAt) {
        await db
          .update(paywallEmails)
          .set({ status: "opened", openedAt: now })
          .where(eq(paywallEmails.id, pe.id));
      }
      break;

    case "email.clicked":
      await db
        .update(paywallEmails)
        .set({ status: "clicked", clickedAt: now })
        .where(eq(paywallEmails.id, pe.id));
      await logActivity({
        type: "email_clicked",
        entityType: "business",
        entityId: pe.businessId,
        title: `Paywall email ${pe.emailNumber} clicked`,
        detail: pe.templateKey,
      });
      break;

    case "email.bounced":
      await db
        .update(paywallEmails)
        .set({ status: "bounced" })
        .where(eq(paywallEmails.id, pe.id));
      break;
  }
}
