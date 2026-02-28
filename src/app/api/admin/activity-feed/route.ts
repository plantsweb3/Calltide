import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10) || 30), 100);

  const activities = await db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return NextResponse.json(activities);
}
