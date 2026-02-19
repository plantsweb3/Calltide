import { NextRequest, NextResponse } from "next/server";
import { scheduleAuditCall } from "@/lib/outreach/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await scheduleAuditCall(id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
