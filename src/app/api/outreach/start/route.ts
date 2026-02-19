import { NextRequest, NextResponse } from "next/server";
import { startOutreachForProspect } from "@/lib/outreach/orchestrator";

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
    const result = await startOutreachForProspect(id);
    results.push({ prospectId: id, ...result });
  }

  return NextResponse.json({ success: true, results });
}
