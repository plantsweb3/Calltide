import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, referrals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  const [biz] = await db
    .select({ referralCode: businesses.referralCode })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const refs = await db
    .select({
      id: referrals.id,
      referralCode: referrals.referralCode,
      status: referrals.status,
      referrerCreditAmount: referrals.referrerCreditAmount,
      referrerCreditApplied: referrals.referrerCreditApplied,
      signedUpAt: referrals.signedUpAt,
      activatedAt: referrals.activatedAt,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .where(eq(referrals.referrerBusinessId, businessId))
    .orderBy(desc(referrals.createdAt))
    .limit(50);

  return NextResponse.json({
    code: biz?.referralCode ?? null,
    referrals: refs.map((r) => ({
      id: r.id,
      status: r.status,
      creditAmount: r.referrerCreditAmount,
      creditApplied: r.referrerCreditApplied,
      createdAt: r.createdAt,
    })),
  });
}
