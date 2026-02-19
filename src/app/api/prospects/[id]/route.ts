import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, prospectAuditCalls, prospectOutreach } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logStatusChange } from "@/lib/activity";

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
  const body = await req.json();

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

  if (body.status) {
    updates.status = body.status;
    if (body.status !== existing.status) {
      await logStatusChange("prospect", id, existing.status, body.status);
    }
  }
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.tags) updates.tags = body.tags;
  if (body.email !== undefined) updates.email = body.email;

  const [updated] = await db
    .update(prospects)
    .set(updates)
    .where(eq(prospects.id, id))
    .returning();

  return NextResponse.json(updated);
}
