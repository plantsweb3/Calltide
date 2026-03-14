import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manualTouches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  if (!req.cookies.has("capta_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prospectId } = await params;
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "10")));

  const touches = await db
    .select()
    .from(manualTouches)
    .where(eq(manualTouches.prospectId, prospectId))
    .orderBy(desc(manualTouches.createdAt))
    .limit(limit);

  return NextResponse.json({ touches });
}
