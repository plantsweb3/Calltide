import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { seasonalServices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const DEMO_BUSINESS_ID = "demo-client-001";

const createSchema = z.object({
  serviceName: z.string().min(1).max(100),
  reminderIntervalMonths: z.number().int().min(1).max(24),
  reminderMessage: z.string().max(500).optional(),
  seasonStart: z.number().int().min(1).max(12).optional(),
  seasonEnd: z.number().int().min(1).max(12).optional(),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      items: [
        { id: "demo-s1", serviceName: "AC Tune-Up", reminderIntervalMonths: 12, seasonStart: 3, seasonEnd: 5, isActive: true, reminderMessage: "Spring is here! Time for your annual AC tune-up." },
        { id: "demo-s2", serviceName: "Furnace Inspection", reminderIntervalMonths: 12, seasonStart: 9, seasonEnd: 11, isActive: true, reminderMessage: "Fall is coming! Let's make sure your furnace is ready." },
      ],
    });
  }

  try {
    const items = await db
      .select()
      .from(seasonalServices)
      .where(
        and(
          eq(seasonalServices.businessId, businessId),
          eq(seasonalServices.isActive, true),
        ),
      );

    return NextResponse.json({ items });
  } catch (error) {
    reportError("Seasonal services GET error", error, { businessId });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, id: "demo-new" });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const [record] = await db
      .insert(seasonalServices)
      .values({
        businessId,
        serviceName: parsed.data.serviceName,
        reminderIntervalMonths: parsed.data.reminderIntervalMonths,
        reminderMessage: parsed.data.reminderMessage,
        seasonStart: parsed.data.seasonStart,
        seasonEnd: parsed.data.seasonEnd,
      })
      .returning();

    return NextResponse.json({ success: true, id: record.id }, { status: 201 });
  } catch (error) {
    reportError("Seasonal services POST error", error, { businessId });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
