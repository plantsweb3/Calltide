import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { prospects, prospectAuditCalls, prospectOutreach } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logStatusChange } from "@/lib/activity";

const patchProspectSchema = z.object({
  status: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  email: z.string().email().or(z.literal("")).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, id));

  if (!prospect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [auditCalls, outreach] = await Promise.all([
    db
      .select()
      .from(prospectAuditCalls)
      .where(eq(prospectAuditCalls.prospectId, id))
      .orderBy(desc(prospectAuditCalls.createdAt)),
    db
      .select()
      .from(prospectOutreach)
      .where(eq(prospectOutreach.prospectId, id))
      .orderBy(desc(prospectOutreach.sentAt)),
  ]);

  return NextResponse.json({ prospect, auditCalls, outreach });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchProspectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, id));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Partial<typeof prospects.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.status) {
    updates.status = parsed.data.status;
    if (parsed.data.status !== existing.status) {
      await logStatusChange("prospect", id, existing.status, parsed.data.status);
    }
  }
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.tags) updates.tags = parsed.data.tags;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;

  const [updated] = await db
    .update(prospects)
    .set(updates)
    .where(eq(prospects.id, id))
    .returning();

  return NextResponse.json(updated);
}
