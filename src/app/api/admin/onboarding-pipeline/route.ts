import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, accounts } from "@/db/schema";
import { ne, desc, eq, isNotNull } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/admin/onboarding-pipeline
 * Returns all businesses that haven't completed onboarding.
 */
export async function GET(req: NextRequest) {
  try {
    const statusFilter = req.nextUrl.searchParams.get("status");

    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        type: businesses.type,
        ownerName: businesses.ownerName,
        ownerEmail: businesses.ownerEmail,
        ownerPhone: businesses.ownerPhone,
        serviceArea: businesses.serviceArea,
        receptionistName: businesses.receptionistName,
        twilioNumber: businesses.twilioNumber,
        active: businesses.active,
        onboardingStep: businesses.onboardingStep,
        onboardingStatus: businesses.onboardingStatus,
        onboardingStartedAt: businesses.onboardingStartedAt,
        onboardingPaywallReachedAt: businesses.onboardingPaywallReachedAt,
        stripeCustomerId: businesses.stripeCustomerId,
        paymentStatus: businesses.paymentStatus,
        accountId: businesses.accountId,
        updatedAt: businesses.updatedAt,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(ne(businesses.onboardingStatus, "completed"))
      .orderBy(desc(businesses.updatedAt));

    // Check login status by looking at password hash existence
    const enriched = await Promise.all(
      rows.map(async (r) => {
        let hasLoggedIn = false;
        if (r.accountId) {
          const [acct] = await db
            .select({ passwordHash: accounts.passwordHash })
            .from(accounts)
            .where(eq(accounts.id, r.accountId))
            .limit(1);
          // If they changed their password from the generated one, they've logged in
          hasLoggedIn = !!acct?.passwordHash;
        }
        return {
          ...r,
          hasLoggedIn,
        };
      }),
    );

    const filtered = statusFilter
      ? enriched.filter((r) => r.onboardingStatus === statusFilter)
      : enriched;

    return NextResponse.json({ businesses: filtered, total: filtered.length });
  } catch (error) {
    reportError("Onboarding pipeline error", error);
    return NextResponse.json({ error: "Failed to load pipeline" }, { status: 500 });
  }
}
