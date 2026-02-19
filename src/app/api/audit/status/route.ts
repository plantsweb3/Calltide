import { NextRequest, NextResponse } from "next/server";
import { handleAuditStatusCallback } from "@/lib/outreach/audit";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params = {
    CallSid: formData.get("CallSid") as string,
    CallStatus: formData.get("CallStatus") as string,
    CallDuration: (formData.get("CallDuration") as string) ?? undefined,
    AnsweredBy: (formData.get("AnsweredBy") as string) ?? undefined,
  };

  if (!params.CallSid || !params.CallStatus) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await handleAuditStatusCallback(params);
  return NextResponse.json({ success: true });
}
