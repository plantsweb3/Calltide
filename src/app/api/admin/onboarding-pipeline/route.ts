import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { ne, desc } from "drizzle-orm";
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
        serviceArea: businesses.serviceArea,
        receptionistName: businesses.receptionistName,
        onboardingStep: businesses.onboardingStep,
        onboardingStatus: businesses.onboardingStatus,
        onboardingStartedAt: businesses.onboardingStartedAt,
        onboardingPaywallReachedAt: businesses.onboardingPaywallReachedAt,
        updatedAt: businesses.updatedAt,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(ne(businesses.onboardingStatus, "completed"))
      .orderBy(desc(businesses.updatedAt));

    const filtered = statusFilter
      ? rows.filter((r) => r.onboardingStatus === statusFilter)
      : rows;

    return NextResponse.json({ businesses: filtered, total: filtered.length });
  } catch (error) {
    reportError("Onboarding pipeline error", error);
    return NextResponse.json({ error: "Failed to load pipeline" }, { status: 500 });
  }
}
