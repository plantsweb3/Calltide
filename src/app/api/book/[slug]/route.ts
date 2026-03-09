import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses, servicePricing, leads, appointments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

// GET — Fetch business data for public booking page
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const [biz] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        type: businesses.type,
        services: businesses.services,
        businessHours: businesses.businessHours,
        timezone: businesses.timezone,
        defaultLanguage: businesses.defaultLanguage,
        active: businesses.active,
        receptionistName: businesses.receptionistName,
        serviceArea: businesses.serviceArea,
      })
      .from(businesses)
      .where(eq(businesses.bookingSlug, slug))
      .limit(1);

    if (!biz || !biz.active) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch active services with pricing
    const services = await db
      .select({
        id: servicePricing.id,
        serviceName: servicePricing.serviceName,
        priceMin: servicePricing.priceMin,
        priceMax: servicePricing.priceMax,
        unit: servicePricing.unit,
        description: servicePricing.description,
      })
      .from(servicePricing)
      .where(
        and(
          eq(servicePricing.businessId, biz.id),
          eq(servicePricing.isActive, true),
        ),
      );

    // If no servicePricing rows, fall back to the business.services string array
    const fallbackServices = services.length > 0
      ? undefined
      : (biz.services as string[]).map((s, i) => ({
          id: `fallback-${i}`,
          serviceName: s,
          priceMin: null,
          priceMax: null,
          unit: null,
          description: null,
        }));

    return NextResponse.json({
      business: {
        name: biz.name,
        type: biz.type,
        businessHours: biz.businessHours,
        timezone: biz.timezone,
        defaultLanguage: biz.defaultLanguage,
        receptionistName: biz.receptionistName,
        serviceArea: biz.serviceArea,
      },
      services: fallbackServices || services,
    });
  } catch (err) {
    reportError("Failed to fetch booking page data", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST — Create a booking
const bookingSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().max(200).optional().or(z.literal("")),
  serviceId: z.string().min(1),
  serviceName: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Rate limit: 5 bookings per hour per IP
  const ip = getClientIp(req);
  const rl = await rateLimit(`booking:${ip}`, {
    limit: 5,
    windowSeconds: 3600,
  });
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  try {
    // Find business
    const [biz] = await db
      .select({ id: businesses.id, active: businesses.active })
      .from(businesses)
      .where(eq(businesses.bookingSlug, slug))
      .limit(1);

    if (!biz || !biz.active) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Validate body
    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, phone, email, serviceName, date, time, notes } = parsed.data;

    // Find or create lead
    const [existingLead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.businessId, biz.id), eq(leads.phone, phone)))
      .limit(1);

    let leadId: string;
    if (existingLead) {
      leadId = existingLead.id;
      // Update name/email if provided
      await db
        .update(leads)
        .set({
          name: name || undefined,
          email: email || undefined,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(leads.id, leadId));
    } else {
      const [newLead] = await db
        .insert(leads)
        .values({
          businessId: biz.id,
          phone,
          name,
          email: email || undefined,
          source: "online_booking",
        })
        .returning({ id: leads.id });
      leadId = newLead.id;
    }

    // Create appointment
    const [appt] = await db
      .insert(appointments)
      .values({
        businessId: biz.id,
        leadId,
        service: serviceName,
        date,
        time,
        duration: 60,
        status: "confirmed",
        notes: notes || undefined,
      })
      .returning({ id: appointments.id });

    return NextResponse.json({
      success: true,
      appointmentId: appt.id,
      message: "Booking confirmed",
    });
  } catch (err) {
    reportError("Failed to create booking", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
