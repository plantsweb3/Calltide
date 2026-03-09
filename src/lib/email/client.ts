import { Resend } from "resend";
import { enqueueJob } from "@/lib/jobs/queue";
import { reportError } from "@/lib/error-reporting";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

/**
 * Send an email via Resend with automatic retry on failure.
 * If the initial send fails, the email is enqueued to `pendingJobs`
 * as an `email_send` job and will be retried with exponential backoff.
 */
export async function sendEmailWithRetry(params: {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; queued?: boolean }> {
  const resend = getResend();

  try {
    const result = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html || "",
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { success: true, id: result.data?.id };
  } catch (err) {
    reportError("Email send failed, enqueuing for retry", err, {
      extra: { to: params.to, subject: params.subject },
    });

    try {
      await enqueueJob("email_send", {
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
      });
      return { success: false, queued: true };
    } catch (enqueueErr) {
      reportError("Failed to enqueue email retry job", enqueueErr);
      return { success: false, queued: false };
    }
  }
}
