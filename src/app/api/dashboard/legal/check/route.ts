import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { legalDocuments, consentRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/dashboard/legal/check
 *
 * Checks if the current business has pending legal document re-acceptances.
 * Returns any documents where the current version is newer than the user's last consent.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all current legal documents
  const currentDocs = await db
    .select()
    .from(legalDocuments)
    .where(eq(legalDocuments.isCurrentVersion, true));

  const pendingDocs: {
    documentType: string;
    title: string;
    version: string;
    changeSummary: string | null;
  }[] = [];

  for (const doc of currentDocs) {
    // Check if business has accepted this version
    const [consent] = await db
      .select({ id: consentRecords.id })
      .from(consentRecords)
      .where(
        and(
          eq(consentRecords.businessId, businessId),
          eq(consentRecords.consentType, doc.documentType),
          eq(consentRecords.documentVersion, doc.version),
          eq(consentRecords.status, "active"),
        ),
      )
      .limit(1);

    if (!consent) {
      // Check if they have ANY consent for this doc type (means they need re-acceptance)
      // If they have no consent at all, the checkout flow handles initial acceptance
      const [anyConsent] = await db
        .select({ id: consentRecords.id })
        .from(consentRecords)
        .where(
          and(
            eq(consentRecords.businessId, businessId),
            eq(consentRecords.consentType, doc.documentType),
            eq(consentRecords.status, "active"),
          ),
        )
        .limit(1);

      // Only prompt re-acceptance if they previously accepted an older version
      if (anyConsent) {
        pendingDocs.push({
          documentType: doc.documentType,
          title: doc.title,
          version: doc.version,
          changeSummary: doc.changeSummary,
        });
      }
    }
  }

  return NextResponse.json({ pendingDocs });
}
