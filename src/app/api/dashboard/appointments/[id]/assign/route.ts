import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, technicians, leads, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { z } from "zod";

const assignSchema = z.object({
  technicianId: z.string().min(1).max(100).nullable(),
});

/**
 * PUT /api/dashboard/appointments/:id/assign
 * Assign (or unassign) a technician to an appointment.
 * Sends SMS notification to the technician when assigned.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rl = await rateLimit(`dispatch-assign:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { technicianId } = parsed.data;

  try {
    // Verify appointment belongs to this business
    const [appt] = await db
      .select({
        id: appointments.id,
        service: appointments.service,
        date: appointments.date,
        time: appointments.time,
        leadId: appointments.leadId,
      })
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.businessId, businessId)))
      .limit(1);

    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // If assigning, verify technician belongs to this business
    if (technicianId) {
      const [tech] = await db
        .select({ id: technicians.id, phone: technicians.phone, name: technicians.name })
        .from(technicians)
        .where(and(eq(technicians.id, technicianId), eq(technicians.businessId, businessId)))
        .limit(1);

      if (!tech) {
        return NextResponse.json({ error: "Technician not found" }, { status: 404 });
      }

      // Update assignment
      await db
        .update(appointments)
        .set({ technicianId, updatedAt: new Date().toISOString() })
        .where(eq(appointments.id, id));

      // Send SMS notification to technician if they have a phone
      if (tech.phone) {
        try {
          // Get customer info
          const [lead] = await db
            .select({ name: leads.name, phone: leads.phone })
            .from(leads)
            .where(eq(leads.id, appt.leadId))
            .limit(1);

          // Get business Twilio number
          const [biz] = await db
            .select({ twilioNumber: businesses.twilioNumber })
            .from(businesses)
            .where(eq(businesses.id, businessId))
            .limit(1);

          if (biz?.twilioNumber) {
            const customerName = lead?.name || "Customer";
            const customerPhone = lead?.phone || "";
            const formattedTime = formatTime12h(appt.time);
            const formattedDate = formatDateShort(appt.date);

            await sendSMS({
              to: tech.phone,
              from: biz.twilioNumber,
              body: `New job assigned: ${appt.service} at ${formattedTime} on ${formattedDate}. Customer: ${customerName}${customerPhone ? ` - ${customerPhone}` : ""}`,
              businessId,
              templateType: "tech_dispatch",
            });
          }
        } catch (smsErr) {
          // Non-fatal: assignment succeeded, SMS failed
          reportError("Failed to send tech assignment SMS", smsErr, { businessId });
        }
      }
    } else {
      // Unassign
      await db
        .update(appointments)
        .set({ technicianId: null, updatedAt: new Date().toISOString() })
        .where(eq(appointments.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError("Failed to assign technician", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDateShort(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
