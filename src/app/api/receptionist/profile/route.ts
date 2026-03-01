import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidPreset } from "@/lib/receptionist/personalities";

const updateSchema = z.object({
  receptionistName: z.string().min(1).max(20).regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]+$/, "Letters and spaces only"),
  personalityPreset: z.string().refine(isValidPreset, "Invalid personality preset"),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [biz] = await db
    .select({
      receptionistName: businesses.receptionistName,
      personalityPreset: businesses.personalityPreset,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({
    receptionistName: biz.receptionistName || "Maria",
    personalityPreset: biz.personalityPreset || "friendly",
  });
}

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

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [biz] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await db
    .update(businesses)
    .set({
      receptionistName: result.data.receptionistName,
      personalityPreset: result.data.personalityPreset,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, businessId));

  return NextResponse.json({
    receptionistName: result.data.receptionistName,
    personalityPreset: result.data.personalityPreset,
  });
}
