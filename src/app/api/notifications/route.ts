import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const source = sp.get("source") ?? undefined;
  const severity = sp.get("severity") ?? undefined;
  const unacknowledged = sp.get("unacknowledged") === "true";
  const limit = Math.min(100, Number(sp.get("limit")) || 50);
  const offset = Math.max(0, Number(sp.get("offset")) || 0);

  const items = await getNotifications({
    source,
    severity,
    unacknowledgedOnly: unacknowledged,
    limit,
    offset,
  });

  return NextResponse.json({ items });
}
