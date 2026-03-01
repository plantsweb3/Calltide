import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { clientFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";

const updateSchema = z.object({
  status: z.enum(["new", "acknowledged", "in_progress", "resolved", "declined"]).optional(),
  adminResponse: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!req.cookies.has("calltide_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(clientFeedback)
    .where(eq(clientFeedback.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.priority) updates.priority = parsed.data.priority;
  if (parsed.data.adminResponse !== undefined) {
    updates.adminResponse = parsed.data.adminResponse;
    updates.adminRespondedAt = new Date().toISOString();
  }

  const [updated] = await db
    .update(clientFeedback)
    .set(updates)
    .where(eq(clientFeedback.id, id))
    .returning();

  return NextResponse.json({ item: updated });
}
