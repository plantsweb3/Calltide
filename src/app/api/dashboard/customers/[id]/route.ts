import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customers, calls, appointments, smsMessages, leads } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID, DEMO_CUSTOMERS, DEMO_CALLS, DEMO_APPOINTMENTS_UPCOMING, DEMO_APPOINTMENTS_PAST, DEMO_SMS } from "../../demo-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    const customer = DEMO_CUSTOMERS.find((c) => c.id === id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    // Match demo calls, appointments, and SMS by customer phone
    const recentCalls = DEMO_CALLS
      .filter((c) => c.callerPhone === customer.phone)
      .map((c) => ({ id: c.id, status: c.status, duration: c.duration, language: c.language, summary: c.summary, sentiment: c.sentiment, outcome: null, createdAt: c.createdAt }));
    const recentAppointments = [...DEMO_APPOINTMENTS_UPCOMING, ...DEMO_APPOINTMENTS_PAST]
      .filter((a) => a.leadPhone === customer.phone)
      .map((a) => ({ id: a.id, service: a.service, date: a.date, time: a.time, status: a.status, notes: a.notes }));
    const recentSms = DEMO_SMS
      .filter((s) => s.toNumber === customer.phone || s.fromNumber === customer.phone)
      .map((s) => ({ id: s.id, direction: s.direction, body: s.body, templateType: s.templateType, createdAt: s.createdAt }));

    return NextResponse.json({ customer, recentCalls, recentAppointments, recentSms });
  }

  try {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.businessId, businessId), isNull(customers.deletedAt)))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Fetch related data by matching phone number
    const recentCalls = await db
      .select()
      .from(calls)
      .where(and(eq(calls.businessId, businessId), eq(calls.callerPhone, customer.phone)))
      .orderBy(desc(calls.createdAt))
      .limit(20);

    // Find lead IDs for this phone to query appointments
    const leadRows = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.businessId, businessId), eq(leads.phone, customer.phone)));

    const leadIds = leadRows.map((l) => l.id);

    let recentAppointments: typeof appointments.$inferSelect[] = [];
    if (leadIds.length > 0) {
      // Query appointments for each lead
      for (const leadId of leadIds.slice(0, 5)) {
        const appts = await db
          .select()
          .from(appointments)
          .where(and(eq(appointments.businessId, businessId), eq(appointments.leadId, leadId)))
          .orderBy(desc(appointments.createdAt))
          .limit(10);
        recentAppointments = recentAppointments.concat(appts);
      }
      // Sort combined results
      recentAppointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      recentAppointments = recentAppointments.slice(0, 20);
    }

    // SMS by phone number
    const recentSms = await db
      .select()
      .from(smsMessages)
      .where(and(eq(smsMessages.businessId, businessId), eq(smsMessages.toNumber, customer.phone)))
      .orderBy(desc(smsMessages.createdAt))
      .limit(20);

    return NextResponse.json({
      customer,
      recentCalls,
      recentAppointments,
      recentSms,
    });
  } catch (error) {
    reportError("Failed to fetch customer detail", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — not saved" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateCustomerSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;
    await db
      .update(customers)
      .set({
        ...data,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(customers.id, id), eq(customers.businessId, businessId)));

    const [updated] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update customer", error, { businessId });
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — not saved" });
  }

  try {
    // Soft delete
    await db
      .update(customers)
      .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(and(eq(customers.id, id), eq(customers.businessId, businessId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to delete customer", error, { businessId });
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
