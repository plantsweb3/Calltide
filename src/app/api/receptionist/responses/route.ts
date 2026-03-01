import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { receptionistCustomResponses } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

const CATEGORIES = ["faq", "off_limits", "phrase", "emergency_keyword"] as const;
const MAX_RESPONSES = 50;

const createSchema = z.object({
  category: z.enum(CATEGORIES),
  triggerText: z.string().min(1).max(200),
  responseText: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(receptionistCustomResponses)
    .where(eq(receptionistCustomResponses.businessId, businessId))
    .orderBy(receptionistCustomResponses.sortOrder);

  // Group by category
  const grouped: Record<string, typeof rows> = {
    faq: [],
    off_limits: [],
    phrase: [],
    emergency_keyword: [],
  };

  for (const row of rows) {
    if (grouped[row.category]) {
      grouped[row.category].push(row);
    }
  }

  return NextResponse.json({ responses: grouped, total: rows.length });
}

export async function POST(req: NextRequest) {
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

  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  // Check limit
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(receptionistCustomResponses)
    .where(eq(receptionistCustomResponses.businessId, businessId));

  if (total >= MAX_RESPONSES) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_RESPONSES} custom responses reached` },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(receptionistCustomResponses)
    .values({
      businessId,
      category: result.data.category,
      triggerText: result.data.triggerText,
      responseText: result.data.responseText || null,
      sortOrder: result.data.sortOrder ?? total,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
