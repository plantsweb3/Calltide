import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians, appointments, leads, businesses } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { z } from "zod";

const notifySchema = z.object({
  technicianId: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/dashboard/dispatch/notify
 * Send a daily schedule summary SMS to a technician.
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dispatch-notify:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = notifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { technicianId, date } = parsed.data;

  try {
    // Verify technician belongs to this business and has a phone
    const [tech] = await db
      .select({ id: technicians.id, name: technicians.name, phone: technicians.phone })
      .from(technicians)
      .where(and(eq(technicians.id, technicianId), eq(technicians.businessId, businessId)))
      .limit(1);

    if (!tech) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    if (!tech.phone) {
      return NextResponse.json({ error: "Technician has no phone number" }, { status: 400 });
    }

    // Get business Twilio number
    const [biz] = await db
      .select({ twilioNumber: businesses.twilioNumber, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz?.twilioNumber) {
      return NextResponse.json({ error: "Business phone not configured" }, { status: 400 });
    }

    // Get technician's appointments for that date
    const appts = await db
      .select({
        service: appointments.service,
        time: appointments.time,
        notes: appointments.notes,
        leadName: leads.name,
        leadPhone: leads.phone,
      })
      .from(appointments)
      .leftJoin(leads, eq(appointments.leadId, leads.id))
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.technicianId, technicianId),
          eq(appointments.date, date),
          sql`${appointments.status} NOT IN ('cancelled')`
        )
      )
      .orderBy(asc(appointments.time));

    if (appts.length === 0) {
      return NextResponse.json({ error: "No appointments for this date" }, { status: 400 });
    }

    // Build summary message
    const formattedDate = formatDateReadable(date);
    const lines = appts.map((a, i) => {
      const time = formatTime12h(a.time);
      const name = a.leadName || "Customer";
      // Extract address from notes if available
      const addressMatch = a.notes?.match(/(?:address|addr|location):\s*(.+)/i);
      const address = addressMatch ? ` @ ${addressMatch[1].trim()}` : "";
      return `${i + 1}. ${time} - ${a.service}${address} (${name})`;
    });

    const smsBody = `${formattedDate} schedule:\n${lines.join("\n")}`;

    await sendSMS({
      to: tech.phone,
      from: biz.twilioNumber,
      body: smsBody,
      businessId,
      templateType: "tech_dispatch",
    });

    return NextResponse.json({ success: true, jobCount: appts.length });
  } catch (err) {
    reportError("Failed to send dispatch notification", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDateReadable(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
