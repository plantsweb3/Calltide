import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10);

  const activities = await db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(Math.min(limit, 100));

  return NextResponse.json(activities);
}
