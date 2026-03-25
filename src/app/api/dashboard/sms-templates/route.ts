import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { smsTemplates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const DEFAULT_TEMPLATES = [
  {
    templateKey: "appointment_reminder",
    name: "Appointment Reminder",
    bodyEn: "Hi {customer_name}, reminder: your {service} appointment with {business_name} is tomorrow at {time}. Reply YES to confirm or call us to reschedule.",
    bodyEs: "Hola {customer_name}, recordatorio: su cita de {service} con {business_name} es mañana a las {time}. Responda SI para confirmar o llamenos para reprogramar.",
  },
  {
    templateKey: "appointment_confirm",
    name: "Appointment Confirmation",
    bodyEn: "Your {service} appointment with {business_name} is confirmed for {date} at {time}. See you then!",
    bodyEs: "Su cita de {service} con {business_name} esta confirmada para el {date} a las {time}. Nos vemos!",
  },
  {
    templateKey: "estimate_followup",
    name: "Estimate Follow-up",
    bodyEn: "Hi {customer_name}, following up on your {service} estimate from {business_name}. Ready to get started? Call us or reply to this message.",
    bodyEs: "Hola {customer_name}, seguimiento de su presupuesto de {service} de {business_name}. Listo para comenzar? Llamenos o responda a este mensaje.",
  },
  {
    templateKey: "invoice_sent",
    name: "Invoice Sent",
    bodyEn: "Hi {customer_name}, your invoice from {business_name} for ${amount} is ready. Pay here: {link}",
    bodyEs: "Hola {customer_name}, su factura de {business_name} por ${amount} esta lista. Pague aqui: {link}",
  },
  {
    templateKey: "thank_you",
    name: "Thank You",
    bodyEn: "Thank you for choosing {business_name}! We appreciate your business. If you have a moment, we'd love a review: {review_link}",
    bodyEs: "Gracias por elegir {business_name}! Apreciamos su confianza. Si tiene un momento, nos encantaria una resena: {review_link}",
  },
];

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`sms-templates-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const templates = await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.businessId, businessId))
      .orderBy(desc(smsTemplates.createdAt));

    // If the business has no templates, return defaults with isDefault flag
    if (templates.length === 0) {
      const defaults = DEFAULT_TEMPLATES.map((t) => ({
        id: `default_${t.templateKey}`,
        businessId,
        ...t,
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return NextResponse.json({ templates: defaults });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    reportError("Failed to fetch SMS templates", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch SMS templates" }, { status: 500 });
  }
}

const createTemplateSchema = z.object({
  templateKey: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  bodyEn: z.string().min(1).max(500),
  bodyEs: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`sms-templates-post:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createTemplateSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const data = result.data;

    // If this is the first custom template, seed the defaults first
    const [existing] = await db
      .select({ id: smsTemplates.id })
      .from(smsTemplates)
      .where(eq(smsTemplates.businessId, businessId))
      .limit(1);

    if (!existing) {
      // Seed default templates
      for (const t of DEFAULT_TEMPLATES) {
        await db.insert(smsTemplates).values({
          businessId,
          templateKey: t.templateKey,
          name: t.name,
          bodyEn: t.bodyEn,
          bodyEs: t.bodyEs,
        });
      }
    }

    const [created] = await db.insert(smsTemplates).values({
      businessId,
      templateKey: data.templateKey,
      name: data.name,
      bodyEn: data.bodyEn,
      bodyEs: data.bodyEs,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Failed to create SMS template", error, { businessId });
    return NextResponse.json({ error: "Failed to create SMS template" }, { status: 500 });
  }
}
