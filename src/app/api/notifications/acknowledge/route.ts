import { NextRequest, NextResponse } from "next/server";
import { acknowledgeNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await acknowledgeNotification(id);
  return NextResponse.json({ success: true });
}
