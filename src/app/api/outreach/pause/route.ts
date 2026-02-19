import { NextRequest, NextResponse } from "next/server";
import { pauseOutreachForProspect } from "@/lib/outreach/orchestrator";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospectIds } = body as { prospectIds: string[] };

  if (!prospectIds?.length) {
    return NextResponse.json(
      { error: "prospectIds is required" },
      { status: 400 },
    );
  }

  for (const id of prospectIds) {
    await pauseOutreachForProspect(id);
  }

  return NextResponse.json({ success: true, paused: prospectIds.length });
}
