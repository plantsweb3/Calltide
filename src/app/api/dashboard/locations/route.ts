import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, businesses } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`locations-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  // Get current business to find accountId
  const [currentBiz] = await db
    .select({ accountId: businesses.accountId })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!currentBiz?.accountId) {
    // Single location, no account yet
    const [biz] = await db
      .select({ id: businesses.id, name: businesses.name, locationName: businesses.locationName, twilioNumber: businesses.twilioNumber, active: businesses.active })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    return NextResponse.json({
      accountId: null,
      companyName: biz?.name ?? null,
      currentBusinessId: businessId,
      locations: biz ? [{
        id: biz.id,
        name: biz.name,
        locationName: biz.locationName ?? "Main",
        isPrimary: true,
        twilioNumber: biz.twilioNumber,
        active: biz.active,
      }] : [],
    });
  }

  // Get account info
  const [account] = await db
    .select({ companyName: accounts.companyName })
    .from(accounts)
    .where(eq(accounts.id, currentBiz.accountId))
    .limit(1);

  // Get all locations for this account
  const locationRows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      locationName: businesses.locationName,
      isPrimary: businesses.isPrimaryLocation,
      twilioNumber: businesses.twilioNumber,
      active: businesses.active,
    })
    .from(businesses)
    .where(eq(businesses.accountId, currentBiz.accountId))
    .orderBy(asc(businesses.locationOrder));

  return NextResponse.json({
    accountId: currentBiz.accountId,
    companyName: account?.companyName ?? null,
    currentBusinessId: businessId,
    locations: locationRows.map((loc) => ({
      id: loc.id,
      name: loc.name,
      locationName: loc.locationName ?? "Main",
      isPrimary: loc.isPrimary ?? false,
      twilioNumber: loc.twilioNumber,
      active: loc.active,
    })),
  });
}
