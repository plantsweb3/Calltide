import { NextResponse } from "next/server";
import { processDunning } from "@/lib/financial/dunning";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processDunning();
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("[dunning cron] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dunning processing failed" },
      { status: 500 },
    );
  }
}

// Allow GET for Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}
