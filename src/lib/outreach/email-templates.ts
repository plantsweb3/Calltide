const BRAND_COLOR = "#22c55e";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
${content}
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
<p>Calltide — AI Voice Agents for Local Businesses</p>
</div>
</div>
</body>
</html>`;
}

// Missed call sequence — 3 emails over ~7 days
export const missedCallSequence = {
  missed_call_1: (businessName: string) => ({
    subject: `${businessName}, you're missing calls — we tested it`,
    html: baseLayout(`
      <h2 style="color:#0f172a;margin-bottom:8px;">We called. Nobody picked up.</h2>
      <p style="color:#475569;line-height:1.6;">
        Hi there,<br><br>
        We just called <strong>${businessName}</strong> and it went unanswered. That's a potential customer lost.
      </p>
      <p style="color:#475569;line-height:1.6;">
        Calltide is an AI voice agent that answers every call 24/7 — in English and Spanish.
        It books appointments, takes messages, and never puts anyone on hold.
      </p>
      <a href="https://calltide.com/demo" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
        See How It Works →
      </a>
    `),
  }),

  missed_call_2: (businessName: string) => ({
    subject: `Quick question, ${businessName}`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.6;">
        Following up — we noticed ${businessName} doesn't have a way to catch after-hours calls.
      </p>
      <p style="color:#475569;line-height:1.6;">
        Our clients typically recover <strong>15-30 missed calls per month</strong>,
        each worth $200-500 in revenue. That's $3,000-$15,000 left on the table.
      </p>
      <p style="color:#475569;line-height:1.6;">
        Would a quick 10-minute demo make sense? We'll show you exactly how it works with your business type.
      </p>
      <a href="https://calltide.com/demo" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
        Book a Demo
      </a>
    `),
  }),

  missed_call_3: (businessName: string) => ({
    subject: `Last note from Calltide`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.6;">
        Hi — just a final follow-up for ${businessName}.
      </p>
      <p style="color:#475569;line-height:1.6;">
        If now isn't the right time, no worries at all. But if missed calls
        are costing you customers, we'd love to help.
      </p>
      <p style="color:#475569;line-height:1.6;">
        Reply to this email anytime — happy to answer questions.
      </p>
      <p style="color:${BRAND_COLOR};font-weight:600;">— Team Calltide</p>
    `),
  }),
};

// Answered sequence — 1 email (they have someone answering, so lighter touch)
export const answeredSequence = {
  answered_1: (businessName: string) => ({
    subject: `${businessName} — save on receptionist costs?`,
    html: baseLayout(`
      <p style="color:#475569;line-height:1.6;">
        Hi there,<br><br>
        We called ${businessName} and someone picked up — great! But what happens
        after hours, on weekends, or when you're slammed with customers?
      </p>
      <p style="color:#475569;line-height:1.6;">
        Calltide handles overflow and after-hours calls automatically.
        Same quality, fraction of the cost of a full-time receptionist.
      </p>
      <a href="https://calltide.com/demo" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
        Learn More →
      </a>
    `),
  }),
};

export type TemplateKey = keyof typeof missedCallSequence | keyof typeof answeredSequence;

export function getEmailTemplate(
  key: string,
  businessName: string,
): { subject: string; html: string } | null {
  const allTemplates: Record<string, (name: string) => { subject: string; html: string }> = {
    ...missedCallSequence,
    ...answeredSequence,
  };
  const factory = allTemplates[key];
  return factory ? factory(businessName) : null;
}
