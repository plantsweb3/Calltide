import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businessPartners, partnerReferrals } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: businessId } = await params;

  const partners = await db
    .select()
    .from(businessPartners)
    .where(and(eq(businessPartners.businessId, businessId), eq(businessPartners.active, true)));

  const referralRows = await db
    .select({
      id: partnerReferrals.id,
      partnerId: partnerReferrals.partnerId,
      partnerName: businessPartners.partnerName,
      partnerTrade: businessPartners.partnerTrade,
      callerName: partnerReferrals.callerName,
      callerPhone: partnerReferrals.callerPhone,
      requestedTrade: partnerReferrals.requestedTrade,
      jobDescription: partnerReferrals.jobDescription,
      referralMethod: partnerReferrals.referralMethod,
      partnerNotified: partnerReferrals.partnerNotified,
      outcome: partnerReferrals.outcome,
      createdAt: partnerReferrals.createdAt,
    })
    .from(partnerReferrals)
    .innerJoin(businessPartners, eq(partnerReferrals.partnerId, businessPartners.id))
    .where(eq(partnerReferrals.referringBusinessId, businessId))
    .orderBy(desc(partnerReferrals.createdAt))
    .limit(100);

  return NextResponse.json({
    totalPartners: partners.length,
    totalReferrals: referralRows.length,
    partners: partners.map((p) => ({
      id: p.id,
      name: p.partnerName,
      trade: p.partnerTrade,
      phone: p.partnerPhone,
      relationship: p.relationship,
    })),
    referrals: referralRows,
  });
}
