import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { prospects, manualTouches } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendProspectSms } from "@/lib/outreach/sms-outreach";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/error-reporting";

const smsSchema = z.object({
  prospectIds: z.array(z.string()).min(1).max(100),
});

/**
 * POST /api/admin/outreach/sms
 *
 * Send a warm-up SMS to one or more prospects before cold calling.
 * Uses the "warmup" SMS template. Logs a manual touch for each.
 */
export async function POST(req: NextRequest) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = smsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { prospectIds } = parsed.data;

  // Fetch all prospects
  const prospectRows = await db
    .select()
    .from(prospects)
    .where(inArray(prospects.id, prospectIds));

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const prospect of prospectRows) {
    if (!prospect.phone) {
      skipped++;
      continue;
    }
    if (prospect.smsOptOut) {
      skipped++;
      continue;
    }

    const trade = prospect.vertical?.toLowerCase().replace(/_/g, " ") || "service";
    const body = `Hey ${prospect.businessName} — this is Ulysses with Capta. We help ${trade} companies stop losing jobs to missed calls. AI receptionist, answers 24/7, books appointments, speaks English + Spanish. Worth a quick chat? I'll try you in a bit. Reply STOP to opt out.`;

    try {
      const result = await sendProspectSms({
        prospectId: prospect.id,
        to: prospect.phone,
        templateKey: "warmup_sms",
        body,
      });

      if (result.success) {
        sent++;

        // Log as a manual touch so it counts toward Rule of 100
        await db.insert(manualTouches).values({
          prospectId: prospect.id,
          channel: "sms",
          outcome: "no_answer",
          notes: "Warm-up SMS sent before cold call",
        });

        // Update last touch timestamp
        await db.update(prospects).set({
          lastTouchAt: new Date().toISOString(),
          outreachStatus: prospect.outreachStatus === "fresh" ? "attempted" : prospect.outreachStatus,
          updatedAt: new Date().toISOString(),
        }).where(eq(prospects.id, prospect.id));
      } else {
        skipped++;
        if (result.error) errors.push(`${prospect.businessName}: ${result.error}`);
      }
    } catch (err) {
      skipped++;
      reportError(`[outreach/sms] Failed for ${prospect.businessName}`, err);
    }
  }

  await logActivity({
    type: "bulk_sms_sent",
    entityType: "prospect",
    entityId: "bulk",
    title: `Warm-up SMS blast: ${sent} sent, ${skipped} skipped`,
  });

  return NextResponse.json({ success: true, sent, skipped, errors });
}
