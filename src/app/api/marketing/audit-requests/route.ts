import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/marketing/audit-requests (admin auth required)
 * Paginated list of audit requests with optional status filter.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const limit = Math.min(parseInt(params.get("limit") ?? "50", 10), 200);
  const offset = Math.max(parseInt(params.get("offset") ?? "0", 10), 0);

  const query = db
    .select({
      id: auditRequests.id,
      businessName: auditRequests.businessName,
      phone: auditRequests.phone,
      businessType: auditRequests.businessType,
      language: auditRequests.language,
      status: auditRequests.auditCallStatus,
      reportSentAt: auditRequests.reportSentAt,
      demoBookedAt: auditRequests.demoBookedAt,
      utmSource: auditRequests.utmSource,
      utmMedium: auditRequests.utmMedium,
      utmCampaign: auditRequests.utmCampaign,
      createdAt: auditRequests.createdAt,
    })
    .from(auditRequests)
    .orderBy(desc(auditRequests.createdAt))
    .limit(limit)
    .offset(offset);

  if (status) {
    query.where(eq(auditRequests.auditCallStatus, status));
  }

  const data = await query;
  return NextResponse.json(data);
}
