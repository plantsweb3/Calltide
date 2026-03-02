import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  consentRecords,
  legalDocuments,
  smsOptOuts,
  subProcessors,
  dataRetentionLog,
  dataDeletionRequests,
  businesses,
} from "@/db/schema";
import { desc, sql, eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") ?? "consent";

  try {
    if (tab === "consent") {
      const records = await db
        .select()
        .from(consentRecords)
        .orderBy(desc(consentRecords.createdAt))
        .limit(200);

      // Count businesses not on current TOS
      const [currentTos] = await db
        .select({ version: legalDocuments.version })
        .from(legalDocuments)
        .where(
          and(
            eq(legalDocuments.documentType, "tos"),
            eq(legalDocuments.isCurrentVersion, true),
          ),
        )
        .limit(1);

      const [outdatedCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            sql`${businesses.tosAcceptedVersion} != ${currentTos?.version ?? "1.0"}
              OR ${businesses.tosAcceptedVersion} IS NULL`,
          ),
        );

      return NextResponse.json({ records, outdatedTosCount: outdatedCount?.count ?? 0 });
    }

    if (tab === "sms") {
      const optOuts = await db
        .select()
        .from(smsOptOuts)
        .orderBy(desc(smsOptOuts.optedOutAt));

      const [activeConsent] = await db
        .select({ count: sql<number>`count(*)` })
        .from(consentRecords)
        .where(
          and(
            sql`${consentRecords.consentType} IN ('sms_client', 'sms_caller')`,
            eq(consentRecords.status, "active"),
          ),
        );

      return NextResponse.json({
        optOuts,
        activeConsentCount: activeConsent?.count ?? 0,
        optOutCount: optOuts.length,
      });
    }

    if (tab === "documents") {
      const docs = await db
        .select()
        .from(legalDocuments)
        .orderBy(desc(legalDocuments.createdAt));

      const [totalActive] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businesses)
        .where(eq(businesses.active, true));

      return NextResponse.json({ documents: docs, totalActiveClients: totalActive?.count ?? 0 });
    }

    if (tab === "retention") {
      const logs = await db
        .select()
        .from(dataRetentionLog)
        .orderBy(desc(dataRetentionLog.deletedAt))
        .limit(50);

      const deletionRequests = await db
        .select()
        .from(dataDeletionRequests)
        .orderBy(desc(dataDeletionRequests.createdAt))
        .limit(50);

      return NextResponse.json({ logs, deletionRequests });
    }

    if (tab === "subprocessors") {
      const processors = await db
        .select()
        .from(subProcessors)
        .orderBy(subProcessors.name);

      return NextResponse.json({ processors });
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  } catch (error) {
    reportError("Compliance API error", error);
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 });
  }
}
