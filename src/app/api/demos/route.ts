import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { demos, prospects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { logDemoBooked } from "@/lib/activity";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const createDemoSchema = z.object({
  prospectId: z.string().optional(),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  scheduledAt: z.string().min(1),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`demo-create:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createDemoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }
  const { prospectId, contactName, contactEmail, contactPhone, scheduledAt, notes } = parsed.data;

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
