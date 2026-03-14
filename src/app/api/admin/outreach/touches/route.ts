import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { prospects, manualTouches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

const touchSchema = z.object({
  prospectId: z.string().min(1),
  channel: z.enum(["call", "sms", "email", "dm", "walk_in"]),
  outcome: z.enum([
    "interested",
    "not_interested",
    "no_answer",
    "left_voicemail",
    "circle_back",
    "booked_demo",
    "onboarded",
    "wrong_number",
    "gatekeeper",
  ]),
  notes: z.string().optional(),
  followUpAt: z.string().optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

// Outcome → outreach_status transition map
function getNewOutreachStatus(
  outcome: string,
  currentStatus: string | null
): string | null {
  switch (outcome) {
    case "interested":
      return "interested";
    case "circle_back":
      return "follow_up";
    case "booked_demo":
      return "demo_booked";
    case "onboarded":
      return "onboarded";
    case "not_interested":
      return "not_interested";
    case "wrong_number":
      return "disqualified";
    case "no_answer":
    case "left_voicemail":
    case "gatekeeper":
      // Don't downgrade from interested or follow_up
      if (currentStatus === "interested" || currentStatus === "follow_up" || currentStatus === "demo_booked") {
        return null; // no change
      }
      return "attempted";
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = touchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify prospect exists
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, body.prospectId))
    .limit(1);

  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Insert touch
  const [touch] = await db
    .insert(manualTouches)
    .values({
      prospectId: body.prospectId,
      channel: body.channel,
      outcome: body.outcome,
      notes: body.notes ?? null,
      followUpAt: body.followUpAt ?? null,
      durationSeconds: body.durationSeconds ?? null,
    })
    .returning();

  // Compute status transition
  const newStatus = getNewOutreachStatus(body.outcome, prospect.outreachStatus);
  const updates: Record<string, unknown> = {
    lastTouchAt: now,
    updatedAt: now,
  };

  if (newStatus) {
    updates.outreachStatus = newStatus;
  }

  if (body.outcome === "circle_back" && body.followUpAt) {
    updates.nextFollowUpAt = body.followUpAt;
  } else if (newStatus && newStatus !== "follow_up") {
    // Clear follow-up date when moving to a non-follow-up status
    updates.nextFollowUpAt = null;
  }

  // Sync prospects.status for terminal outcomes
  if (body.outcome === "booked_demo") {
    updates.status = "demo_booked";
  } else if (body.outcome === "onboarded") {
    updates.status = "converted";
  }

  await db.update(prospects).set(updates).where(eq(prospects.id, body.prospectId));

  // Fetch updated prospect
  const [updatedProspect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, body.prospectId))
    .limit(1);

  // Log activity
  await logActivity({
    type: "manual_touch",
    entityType: "prospect",
    entityId: body.prospectId,
    title: `${body.channel} → ${body.outcome}: ${prospect.businessName}`,
    detail: body.notes ?? undefined,
  });

  return NextResponse.json({ touch, prospect: updatedProspect });
}
