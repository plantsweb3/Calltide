import { NextRequest, NextResponse } from "next/server";
import { acknowledgeNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id } = body as { id: unknown };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await acknowledgeNotification(id);
  return NextResponse.json({ success: true });
}
