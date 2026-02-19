import { NextRequest, NextResponse } from "next/server";
import { handleEmailWebhook } from "@/lib/outreach/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  await handleEmailWebhook(body);
  return NextResponse.json({ success: true });
}
