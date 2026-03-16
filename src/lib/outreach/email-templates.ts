import { BRAND_COLOR, COMPANY_ADDRESS, MARKETING_URL } from "@/lib/constants";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Humanize vertical name for copy. "plumbing" → "plumbing", null → "service" */
function tradeName(vertical?: string): string {
  if (!vertical) return "service";
  return vertical.toLowerCase().replace(/_/g, " ");
}

function baseLayout(content: string, prospectEmail?: string): string {
  const unsubscribeUrl = `${MARKETING_URL}/unsubscribe${prospectEmail ? `?email=${encodeURIComponent(prospectEmail)}` : ""}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
${content}
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
<p>Capta — AI Voice Agents for Local Businesses</p>
<p style="margin-top:8px;">${COMPANY_ADDRESS}</p>
<p style="margin-top:8px;">
  <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
  &nbsp;|&nbsp; You're receiving this because we think Capta could help your business. We'll never spam you.
</p>
</div>
</div>
</body>
</html>`;
}

function ctaButton(text: string, url: string = MARKETING_URL): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">${text}</a>`;
}

// ---------------------------------------------------------------------------
// MISSED CALL SEQUENCE — 4 emails (days 1, 5, 10, 14)
// ---------------------------------------------------------------------------

export const missedCallSequence = {
  missed_call_1: (businessName: string, email?: string, vertical?: string) => ({
    subject: `${businessName} — that missed call could be a $500 job`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        We called <strong>${escapeHtml(businessName)}</strong> today and it went to voicemail.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Capta isn't an answering service — it actually <strong>books the job right on the call</strong>, gives pricing ballparks, texts the customer a confirmation, and follows up on open estimates automatically. 24/7, English + Spanish.
      </p>
      <p style="color:#475569;line-height:1.7;">
        It also auto-texts missed callers back, sends appointment reminders, and requests Google reviews after completed jobs. Like a full office manager for less than one lost job/month. 30-day money-back guarantee.
      </p>
      ${ctaButton("See How It Works →")}
    `, email),
  }),

  missed_call_2: (businessName: string, email?: string, vertical?: string) => ({
    subject: `${businessName} — what if your phone booked the job for you?`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        Quick follow-up for ${escapeHtml(businessName)}.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Most ${tradeName(vertical)} owners we work with were missing 15-30 calls a month. Now their AI receptionist answers every one, books the appointment, and sends them a daily briefing of everything that happened — while they're on a job site.
      </p>
      <p style="color:#475569;line-height:1.7;">
        You can even text it to manage your schedule, check what jobs are booked, or block time off. No app needed. 30-day money-back guarantee.
      </p>
      ${ctaButton("Book a 10-Min Demo")}
    `, email),
  }),

  missed_call_3: (businessName: string, email?: string, vertical?: string) => ({
    subject: `Your competitor answers on the first ring`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        ${escapeHtml(businessName)} — when a homeowner calls for ${tradeName(vertical)} and nobody picks up, they call the next guy in Google.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Capta makes sure that next guy is always you. Answers 24/7, books the job on the call, chases open estimates, sends Google review requests, and gives you a daily briefing via text. Bilingual.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Reply to this email and I'll set up a quick walkthrough.
      </p>
      <p style="color:${BRAND_COLOR};font-weight:600;">— Ulysses, Capta</p>
    `, email),
  }),

  missed_call_4: (businessName: string, email?: string, vertical?: string) => ({
    subject: `Last note — happy to help when you're ready`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        Hey ${escapeHtml(businessName)} — this is my last email.
      </p>
      <p style="color:#475569;line-height:1.7;">
        If you're losing ${tradeName(vertical)} jobs to voicemail, Capta answers 24/7 and actually books the work — not just takes a message. It follows up on estimates, sends appointment reminders, requests Google reviews, and you can manage everything by texting it from the job site. Pays for itself in 1-2 recovered jobs.
      </p>
      <p style="color:#475569;line-height:1.7;">
        30-day money-back guarantee — zero risk. Reply anytime.
      </p>
      <p style="color:${BRAND_COLOR};font-weight:600;">— Ulysses</p>
    `, email),
  }),
};

// ---------------------------------------------------------------------------
// ANSWERED SEQUENCE — 2 emails (days 1, 7)
// ---------------------------------------------------------------------------

export const answeredSequence = {
  answered_1: (businessName: string, email?: string, vertical?: string) => ({
    subject: `${businessName} — what happens when you can't pick up?`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        We called ${escapeHtml(businessName)} and someone picked up — nice. But what about nights, weekends, and when you're on a ${tradeName(vertical)} job?
      </p>
      <p style="color:#475569;line-height:1.7;">
        Capta isn't an answering service — it <strong>books the job on the call</strong>. Gives pricing, texts the customer a confirmation, and if they don't book, it follows up on the estimate automatically until they do. 24/7, English + Spanish.
      </p>
      <p style="color:#475569;line-height:1.7;">
        It also sends appointment reminders so customers don't no-show, requests Google reviews after completed jobs, and gives you a daily briefing via text. You can even text it from the job site to manage your schedule — no app needed. Like a full office manager for less than one lost job/month.
      </p>
      <p style="color:#475569;line-height:1.7;">
        30-day money-back guarantee.
      </p>
      ${ctaButton("See How It Works →")}
    `, email),
  }),

  answered_2: (businessName: string, email?: string, vertical?: string) => ({
    subject: `${businessName} — 15-20 after-hours calls/month you're missing`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        Last follow-up for ${escapeHtml(businessName)}.
      </p>
      <p style="color:#475569;line-height:1.7;">
        ${tradeName(vertical).charAt(0).toUpperCase() + tradeName(vertical).slice(1)} businesses using Capta catch 15-20 after-hours calls/month they used to miss. At $300+ per job, that's $4,500-6,000 in recovered revenue.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Beyond just answering — it books the appointment on the call, chases open estimates, sends reminders so customers show up, auto-requests Google reviews, and texts you a daily briefing of everything that happened while you were on the job site. Bilingual.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Reply to this email and I'll show you how it works in 10 minutes. 30-day money-back guarantee.
      </p>
      <p style="color:${BRAND_COLOR};font-weight:600;">— Ulysses, Capta</p>
    `, email),
  }),
};

// ---------------------------------------------------------------------------
// Template lookup
// ---------------------------------------------------------------------------

export type TemplateKey = keyof typeof missedCallSequence | keyof typeof answeredSequence;

export function getEmailTemplate(
  key: string,
  businessName: string,
  email?: string,
  vertical?: string,
): { subject: string; html: string } | null {
  const allTemplates: Record<string, (name: string, email?: string, vertical?: string) => { subject: string; html: string }> = {
    ...missedCallSequence,
    ...answeredSequence,
  };
  const factory = allTemplates[key];
  return factory ? factory(businessName, email, vertical) : null;
}
