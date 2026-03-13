import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { clientFeedback, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { getResend } from "@/lib/email/client";

const createSchema = z.object({
  type: z.enum(["feedback", "feature_request", "bug_report"]),
  category: z.enum(["general", "calls", "billing", "appointments", "sms", "other"]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
});

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`feedback-list:${getClientIp(req)}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(clientFeedback)
    .where(eq(clientFeedback.businessId, businessId))
    .orderBy(desc(clientFeedback.createdAt))
    .limit(50);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`feedback-create:${getClientIp(req)}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Max 50 active feedback items per business
  const [countResult] = await db
    .select({ count: db.$count(clientFeedback, eq(clientFeedback.businessId, businessId)) })
    .from(clientFeedback)
    .where(eq(clientFeedback.businessId, businessId));

  if ((countResult?.count ?? 0) >= 50) {
    return NextResponse.json({ error: "Maximum feedback limit reached (50)" }, { status: 400 });
  }

  const [created] = await db
    .insert(clientFeedback)
    .values({
      businessId,
      type: parsed.data.type,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .returning();

  // Fire-and-forget auto-acknowledge email
  sendFeedbackAck(businessId, parsed.data.title).catch((err) =>
    reportError("Failed to send feedback ack email", err)
  );

  return NextResponse.json({ item: created }, { status: 201 });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Send an auto-acknowledge email so the client knows we received their feedback */
async function sendFeedbackAck(businessId: string, feedbackTitle: string) {
  const [biz] = await db
    .select({ ownerEmail: businesses.ownerEmail, ownerName: businesses.ownerName, defaultLanguage: businesses.defaultLanguage })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz?.ownerEmail) return;

  let resend;
  try {
    resend = getResend();
  } catch {
    return;
  }
  const lang = biz.defaultLanguage === "es" ? "es" : "en";

  const t = lang === "es"
    ? {
        subject: "Recibimos tu mensaje — Capta",
        heading: "Recibimos tu mensaje",
        body: `Hola ${escapeHtml(biz.ownerName || "")},<br><br>Recibimos tu comentario sobre "<strong>${escapeHtml(feedbackTitle)}</strong>". Nuestro equipo lo revisará y te responderá dentro de 48 horas.<br><br>Gracias por ayudarnos a mejorar Capta.`,
        footer: "¿Urgente? Responde a este correo.",
      }
    : {
        subject: "We got your feedback — Capta",
        heading: "We received your feedback",
        body: `Hey ${escapeHtml(biz.ownerName || "there")},<br><br>We received your feedback about "<strong>${escapeHtml(feedbackTitle)}</strong>". Our team will review it and get back to you within 48 hours.<br><br>Thanks for helping us improve Capta.`,
        footer: "Urgent? Reply to this email.",
      };

  await resend.emails.send({
    from: "Capta <hello@contact.captahq.com>",
    to: biz.ownerEmail,
    subject: t.subject,
    html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span>
  </div>
  <h2 style="color:#1A1D24;margin-bottom:8px;">${t.heading}</h2>
  <p style="color:#475569;line-height:1.7;margin-bottom:24px;">${t.body}</p>
  <p style="color:#94A3B8;font-size:13px;margin-top:32px;line-height:1.6;">${t.footer}</p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
  <p style="color:#94A3B8;font-size:11px;">Capta LLC &middot; San Antonio, TX</p>
</div>`,
  });
}
