import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, referrals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/dashboard/referrals
 * Client-facing: returns referral stats for the authed business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [biz] = await db
    .select({ referralCode: businesses.referralCode, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get referral stats
  const referralList = biz.referralCode
    ? await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerBusinessId, businessId))
    : [];

  const totalReferred = referralList.length;
  const active = referralList.filter((r) => r.status === "activated").length;
  const creditsEarned = referralList
    .filter((r) => r.referrerCreditApplied)
    .reduce((sum, r) => sum + (r.referrerCreditAmount ?? 0), 0);

  return NextResponse.json({
    referralCode: biz.referralCode,
    shareLink: biz.referralCode
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app"}/r/${biz.referralCode}`
      : null,
    stats: { totalReferred, active, creditsEarned },
    referrals: referralList.map((r) => ({
      id: r.id,
      status: r.status,
      creditAmount: r.referrerCreditAmount,
      creditApplied: r.referrerCreditApplied,
      signedUpAt: r.signedUpAt,
      activatedAt: r.activatedAt,
      createdAt: r.createdAt,
    })),
  });
}
