import { NextRequest, NextResponse } from "next/server";
import { scheduleAuditCall } from "@/lib/outreach/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospectIds } = body as { prospectIds: string[] };

  if (!prospectIds?.length) {
    return NextResponse.json(
      { error: "prospectIds is required" },
      { status: 400 },
    );
  }

  const results = [];
  for (const id of prospectIds) {
    const result = await scheduleAuditCall(id);
    results.push({ prospectId: id, ...result });
  }

  const scheduled = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: true,
    scheduled,
    failed,
    results,
  });
}
