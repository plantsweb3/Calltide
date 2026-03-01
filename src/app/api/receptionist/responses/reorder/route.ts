import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { receptionistCustomResponses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const reorderSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
});

export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = reorderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  // Update sort orders by position in array
  for (let i = 0; i < result.data.ids.length; i++) {
    await db
      .update(receptionistCustomResponses)
      .set({ sortOrder: i, updatedAt: now })
      .where(
        and(
          eq(receptionistCustomResponses.id, result.data.ids[i]),
          eq(receptionistCustomResponses.businessId, businessId),
        )
      );
  }

  return NextResponse.json({ success: true });
}
