import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, referrals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/dashboard/referrals
 * Client-facing: returns referral stats for the authed business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      referralCode: "GARCIA-REF",
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app"}/r/GARCIA-REF`,
      stats: { totalReferred: 2, active: 1, creditsEarned: 497 },
      referrals: [
        {
          id: "demo-ref-1",
          status: "activated",
          creditAmount: 497,
          creditApplied: true,
          signedUpAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          activatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
        },
        {
          id: "demo-ref-2",
          status: "signed_up",
          creditAmount: 497,
          creditApplied: false,
          signedUpAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          activatedAt: null,
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ],
    });
  }

  try {
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
  } catch (err) {
    reportError("Failed to fetch referrals", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
