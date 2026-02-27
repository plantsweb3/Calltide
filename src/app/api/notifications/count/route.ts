import { NextResponse } from "next/server";
import { getUnacknowledgedCount } from "@/lib/notifications";

export async function GET() {
  const count = await getUnacknowledgedCount();
  return NextResponse.json({ count });
}
