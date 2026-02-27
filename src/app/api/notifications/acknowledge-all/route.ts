import { NextResponse } from "next/server";
import { acknowledgeAll } from "@/lib/notifications";

export async function POST() {
  await acknowledgeAll();
  return NextResponse.json({ success: true });
}
