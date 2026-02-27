import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/db";
import { statusPageSubscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const subscribeSchema = z.object({
  email: z.string().email("Valid email required"),
  language: z.enum(["en", "es"]).default("en"),
});

let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`status-subscribe:${ip}`, { limit: 3, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, language } = parsed.data;

    // Check if already subscribed
    const [existing] = await db
      .select()
      .from(statusPageSubscribers)
      .where(eq(statusPageSubscribers.email, email))
      .limit(1);

    if (existing?.verified) {
      return NextResponse.json({ message: "Already subscribed" });
    }

    const verificationToken = crypto.randomUUID();

    if (existing) {
      // Update existing unverified record
      await db
        .update(statusPageSubscribers)
        .set({ verificationToken, language, unsubscribedAt: null })
        .where(eq(statusPageSubscribers.id, existing.id));
    } else {
      await db.insert(statusPageSubscribers).values({
        email,
        language,
        verificationToken,
      });
    }

    // Send verification email
    const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/status/verify?token=${verificationToken}`;
    const isEs = language === "es";

    const resend = getResend();
    await resend.emails.send({
      from: "Calltide Status <status@contact.calltide.app>",
      to: email,
      subject: isEs ? "Confirma tu suscripción — Calltide Status" : "Confirm your subscription — Calltide Status",
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:16px 0;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Calltide</span>
  </div>
  <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:32px;text-align:center;">
    <h2 style="margin:0 0 12px;color:#1e293b;">${isEs ? "Confirma tu suscripción" : "Confirm your subscription"}</h2>
    <p style="color:#475569;line-height:1.6;">${isEs ? "Haz clic en el botón para recibir actualizaciones de estado de Calltide." : "Click the button below to receive Calltide status updates."}</p>
    <a href="${verifyUrl}" style="display:inline-block;margin-top:16px;padding:12px 32px;background:#C59A27;color:white;border-radius:8px;text-decoration:none;font-weight:600;">${isEs ? "Confirmar" : "Confirm Subscription"}</a>
  </div>
  <div style="text-align:center;padding:24px 0;font-size:12px;color:#94a3b8;">
    <p>${isEs ? "Si no solicitaste esto, ignora este correo." : "If you didn't request this, ignore this email."}</p>
  </div>
</div></body></html>`,
    });

    return NextResponse.json({ message: isEs ? "Correo de verificación enviado" : "Verification email sent" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
  }
}

// Handle unsubscribe via GET
export async function GET(req: NextRequest) {
  const unsubId = req.nextUrl.searchParams.get("unsubscribe");
  if (!unsubId) {
    return NextResponse.json({ error: "Missing parameter" }, { status: 400 });
  }

  await db
    .update(statusPageSubscribers)
    .set({ unsubscribedAt: new Date().toISOString() })
    .where(eq(statusPageSubscribers.id, unsubId));

  return NextResponse.redirect(new URL("/status?unsubscribed=true", env.NEXT_PUBLIC_APP_URL));
}
