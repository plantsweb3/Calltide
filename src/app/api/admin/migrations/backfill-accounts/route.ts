import { NextResponse } from "next/server";
import { backfillAccounts } from "@/lib/migrations/backfill-accounts";
import { reportError } from "@/lib/error-reporting";

export async function POST() {
  try {
    const result = await backfillAccounts();
    return NextResponse.json(result);
  } catch (err) {
    reportError("[backfill-accounts] Error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backfill failed" },
      { status: 500 },
    );
  }
}
