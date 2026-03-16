import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customers, calls, appointments, estimates, smsMessages, leads } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import {
  DEMO_BUSINESS_ID,
  DEMO_CUSTOMERS,
  DEMO_CALLS,
  DEMO_APPOINTMENTS_UPCOMING,
  DEMO_APPOINTMENTS_PAST,
  DEMO_SMS,
  DEMO_ESTIMATES,
} from "../../demo-data";

// ── Timeline types ──

interface TimelineItem {
  id: string;
  type: "call" | "appointment" | "estimate" | "sms";
  date: string; // ISO string for sorting
  data: Record<string, unknown>;
}

// ── GET: Customer detail + unified timeline ──

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`customer-detail:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  // ── Demo mode ──
  if (businessId === DEMO_BUSINESS_ID) {
    const customer = DEMO_CUSTOMERS.find((c) => c.id === id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const timeline: TimelineItem[] = [];

    // Demo calls by phone
    const demoCalls = DEMO_CALLS.filter((c) => c.callerPhone === customer.phone);
    for (const c of demoCalls) {
      timeline.push({
        id: c.id,
        type: "call",
        date: c.createdAt,
        data: {
          status: c.status,
          duration: c.duration,
          language: c.language,
          summary: c.summary,
          sentiment: c.sentiment,
          outcome: null,
        },
      });
    }

    // Demo appointments by phone
    const demoAppts = [...DEMO_APPOINTMENTS_UPCOMING, ...DEMO_APPOINTMENTS_PAST].filter(
      (a) => a.leadPhone === customer.phone
    );
    for (const a of demoAppts) {
      timeline.push({
        id: a.id,
        type: "appointment",
        date: `${a.date}T${a.time}:00`,
        data: {
          service: a.service,
          date: a.date,
          time: a.time,
          status: a.status,
          notes: a.notes,
        },
      });
    }

    // Demo estimates by customerId
    const demoEstimates = DEMO_ESTIMATES.filter((e) => e.customerId === customer.id);
    for (const e of demoEstimates) {
      timeline.push({
        id: e.id,
        type: "estimate",
        date: e.createdAt,
        data: {
          service: e.service,
          description: e.description,
          amount: e.amount,
          status: e.status,
          notes: e.notes,
        },
      });
    }

    // Demo SMS by phone
    const demoSms = DEMO_SMS.filter(
      (s) => s.toNumber === customer.phone || s.fromNumber === customer.phone
    );
    for (const s of demoSms) {
      timeline.push({
        id: s.id,
        type: "sms",
        date: s.createdAt,
        data: {
          direction: s.direction,
          body: s.body,
          templateType: s.templateType,
        },
      });
    }

    // Sort newest first
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ customer, timeline });
  }

  // ── Real data ──
  try {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.businessId, businessId), isNull(customers.deletedAt)))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const timeline: TimelineItem[] = [];

    // Calls by customerId or callerPhone
    const customerCalls = await db
      .select()
      .from(calls)
      .where(and(eq(calls.businessId, businessId), eq(calls.callerPhone, customer.phone)))
      .orderBy(desc(calls.createdAt))
      .limit(50);

    for (const c of customerCalls) {
      timeline.push({
        id: c.id,
        type: "call",
        date: c.createdAt,
        data: {
          status: c.status,
          duration: c.duration,
          language: c.language,
          summary: c.summary,
          sentiment: c.sentiment,
          outcome: c.outcome,
        },
      });
    }

    // Find lead IDs for this customer's phone to query appointments
    const leadRows = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.businessId, businessId), eq(leads.phone, customer.phone)));

    const leadIds = leadRows.map((l) => l.id);

    if (leadIds.length > 0) {
      for (const leadId of leadIds.slice(0, 10)) {
        const appts = await db
          .select()
          .from(appointments)
          .where(and(eq(appointments.businessId, businessId), eq(appointments.leadId, leadId)))
          .orderBy(desc(appointments.createdAt))
          .limit(20);

        for (const a of appts) {
          timeline.push({
            id: a.id,
            type: "appointment",
            date: `${a.date}T${a.time}:00`,
            data: {
              service: a.service,
              date: a.date,
              time: a.time,
              status: a.status,
              notes: a.notes,
            },
          });
        }
      }
    }

    // Estimates by customerId
    const customerEstimates = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.businessId, businessId), eq(estimates.customerId, customer.id)))
      .orderBy(desc(estimates.createdAt))
      .limit(50);

    for (const e of customerEstimates) {
      timeline.push({
        id: e.id,
        type: "estimate",
        date: e.createdAt,
        data: {
          service: e.service,
          description: e.description,
          amount: e.amount,
          status: e.status,
          notes: e.notes,
        },
      });
    }

    // SMS by phone
    const customerSms = await db
      .select()
      .from(smsMessages)
      .where(and(eq(smsMessages.businessId, businessId), eq(smsMessages.toNumber, customer.phone)))
      .orderBy(desc(smsMessages.createdAt))
      .limit(50);

    for (const s of customerSms) {
      timeline.push({
        id: s.id,
        type: "sms",
        date: s.createdAt,
        data: {
          direction: s.direction,
          body: s.body,
          templateType: s.templateType,
        },
      });
    }

    // Sort newest first
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ customer, timeline });
  } catch (error) {
    reportError("Failed to fetch customer detail", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

// ── PUT: Update customer fields ──

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

    const [updated] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.businessId, businessId))).limit(1);
    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update customer", error, { businessId });
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// ── DELETE: Soft-delete customer ──

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
