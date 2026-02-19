import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demos, prospects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { logDemoBooked } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospectId, contactName, contactEmail, contactPhone, scheduledAt, notes } = body;

  const [demo] = await db
    .insert(demos)
    .values({
      prospectId,
      contactName,
      contactEmail,
      contactPhone,
      scheduledAt,
      notes,
      status: "scheduled",
    })
    .returning();

  // Update prospect status
  if (prospectId) {
    await db
      .update(prospects)
      .set({ status: "demo_booked", updatedAt: new Date().toISOString() })
      .where(eq(prospects.id, prospectId));
  }

  await logDemoBooked(demo.id, contactName ?? "Unknown");

  return NextResponse.json(demo, { status: 201 });
}

export async function GET() {
  const rows = await db
    .select()
    .from(demos)
    .orderBy(desc(demos.createdAt));

  return NextResponse.json(rows);
}
