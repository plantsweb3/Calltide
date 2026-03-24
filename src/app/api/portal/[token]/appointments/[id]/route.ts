import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePortalToken } from "@/lib/portal/auth";
import { db } from "@/db";
import { appointments, leads, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { env } from "@/lib/env";

const actionSchema = z.object({
  action: z.enum(["confirm", "cancel"]),
  reason: z.string().max(500).optional(),
});

/**
 * PUT /api/portal/[token]/appointments/[id]
 * Confirm or cancel an appointment from the customer portal.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`portal-appointment-action:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { token, id: appointmentId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await validatePortalToken(token);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired portal link" },
        { status: 401 }
      );
    }

    const { customer, business } = result;

    // Find leads matching this customer's phone for this business
    const customerLeads = await db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.businessId, business.id),
          eq(leads.phone, customer.phone)
        )
      );

    const leadIds = customerLeads.map((l) => l.id);

    if (leadIds.length === 0) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify the appointment belongs to one of this customer's leads AND this business
    const [apt] = await db
      .select({
        id: appointments.id,
        leadId: appointments.leadId,
        service: appointments.service,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.businessId, business.id)
        )
      )
      .limit(1);

    if (!apt || !leadIds.includes(apt.leadId)) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Can only modify confirmed or pending appointments
    if (apt.status === "completed" || apt.status === "cancelled") {
      return NextResponse.json(
        { error: "This appointment cannot be modified" },
        { status: 400 }
      );
    }

    const newStatus =
      parsed.data.action === "confirm" ? "confirmed" : "cancelled";

    await db
      .update(appointments)
      .set({
        status: newStatus,
        notes: parsed.data.reason
          ? `${apt.status === "confirmed" ? "" : ""}[Customer portal] ${parsed.data.reason}`
          : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appointments.id, appointmentId));

    // Notify business owner via SMS about the change
    try {
      const customerName = customer.name || customer.phone;
      const fromNumber = business.twilioNumber || env.TWILIO_PHONE_NUMBER;
      const isSpanish = customer.language === "es";

      let smsBody: string;
      if (parsed.data.action === "cancel") {
        smsBody = isSpanish
          ? `Portal del cliente: ${customerName} ha cancelado su cita de ${apt.service} el ${apt.date} a las ${apt.time}.${parsed.data.reason ? ` Razon: ${parsed.data.reason}` : ""}`
          : `Customer portal: ${customerName} cancelled their ${apt.service} appointment on ${apt.date} at ${apt.time}.${parsed.data.reason ? ` Reason: ${parsed.data.reason}` : ""}`;
      } else {
        smsBody = isSpanish
          ? `Portal del cliente: ${customerName} ha confirmado su cita de ${apt.service} el ${apt.date} a las ${apt.time}.`
          : `Customer portal: ${customerName} confirmed their ${apt.service} appointment on ${apt.date} at ${apt.time}.`;
      }

      const { sendSMS } = await import("@/lib/twilio/sms");
      await sendSMS({
        to: business.ownerPhone,
        from: fromNumber,
        body: smsBody,
        businessId: business.id,
        templateType: "portal_notification",
      });
    } catch (smsErr) {
      reportError("Portal: failed to notify owner about appointment change", smsErr, {
        businessId: business.id,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    reportError("Portal: failed to update appointment", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
