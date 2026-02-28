import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and, or, like, desc, count, isNull } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID, DEMO_CUSTOMERS } from "../demo-data";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = searchParams.get("search")?.trim() || "";

  if (businessId === DEMO_BUSINESS_ID) {
    let filtered = DEMO_CUSTOMERS;
    if (search) {
      const q = search.toLowerCase();
      filtered = DEMO_CUSTOMERS.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }
    const total = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    return NextResponse.json({
      customers: filtered.slice(start, start + PAGE_SIZE),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  }

  try {
    const conditions = [eq(customers.businessId, businessId), isNull(customers.deletedAt)];

    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`),
        )!
      );
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(where);

    const rows = await db
      .select()
      .from(customers)
      .where(where)
      .orderBy(desc(customers.lastCallAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    return NextResponse.json({
      customers: rows,
      total: totalResult.count,
      page,
      totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
    });
  } catch (error) {
    reportError("Failed to fetch customers", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  language: z.enum(["en", "es"]).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — not saved" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createCustomerSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 }
    );
  }

  try {
    const data = result.data;
    const now = new Date().toISOString();
    const [created] = await db.insert(customers).values({
      businessId,
      phone: data.phone,
      name: data.name,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      language: data.language || "en",
      tags: data.tags || [],
      source: "manual",
      firstCallAt: now,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Failed to create customer", error, { businessId });
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
