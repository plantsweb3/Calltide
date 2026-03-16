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
    subject: `${businessName} — that missed call could be $500`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        We called <strong>${escapeHtml(businessName)}</strong> today and it went to voicemail.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Every missed ${tradeName(vertical)} call costs you $200-500 in lost revenue. Most ${tradeName(vertical)} businesses miss 15-30 calls a month — that's up to $15K walking to a competitor.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Capta answers every call 24/7, books jobs, and speaks English + Spanish. 30-day money-back guarantee.
      </p>
      ${ctaButton("See How It Works →")}
    `, email),
  }),

  missed_call_2: (businessName: string, email?: string, vertical?: string) => ({
    subject: `$3K-$15K/mo in missed ${tradeName(vertical)} calls`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        Quick follow-up for ${escapeHtml(businessName)}.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Other ${tradeName(vertical)} owners using Capta recover an average of 22 calls/month that used to go to voicemail — nights, weekends, and when they're on a job site.
      </p>
      <p style="color:#475569;line-height:1.7;">
        10-minute demo — we'll show you exactly how it works for ${tradeName(vertical)}. No commitment, 30-day money-back guarantee if you try it.
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
        Capta makes sure that next guy is always you. AI receptionist, 24/7, bilingual. Books the job right on the call.
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
        If missed ${tradeName(vertical)} calls aren't a problem for you, ignore this. But if you're losing jobs to voicemail, Capta answers 24/7, books appointments, and pays for itself in 1-2 recovered jobs.
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
    subject: `${businessName} — save $2K/mo on your receptionist`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        We called ${escapeHtml(businessName)} and someone picked up — nice. But what happens nights, weekends, and when the phone's ringing off the hook?
      </p>
      <p style="color:#475569;line-height:1.7;">
        Capta is an AI receptionist that handles overflow and after-hours ${tradeName(vertical)} calls — books jobs, takes messages, speaks Spanish. Fraction of the cost of another hire.
      </p>
      <p style="color:#475569;line-height:1.7;">
        30-day money-back guarantee. See if it makes sense for you.
      </p>
      ${ctaButton("Learn More →")}
    `, email),
  }),

  answered_2: (businessName: string, email?: string, vertical?: string) => ({
    subject: `What happens when ${businessName} can't answer?`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.7;">
        Last follow-up — just wanted to make sure you saw this.
      </p>
      <p style="color:#475569;line-height:1.7;">
        ${tradeName(vertical).charAt(0).toUpperCase() + tradeName(vertical).slice(1)} businesses using Capta catch 15-20 after-hours calls/month they used to miss. At $300+ per job, that's real money.
      </p>
      <p style="color:#475569;line-height:1.7;">
        Happy to do a 10-minute walkthrough if you're curious. Reply anytime.
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
