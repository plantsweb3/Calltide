import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { statusPageSubscribers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET() {
  try {
    const subs = await db
      .select()
      .from(statusPageSubscribers)
      .orderBy(desc(statusPageSubscribers.subscribedAt));

    return NextResponse.json({ subscribers: subs });
  } catch (error) {
    reportError("Subscribers GET error", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db.delete(statusPageSubscribers).where(eq(statusPageSubscribers.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Subscriber DELETE error", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
