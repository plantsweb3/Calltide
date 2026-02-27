import { db } from "@/db";
import {
  calls,
  smsMessages,
  appointments,
  leads,
  businesses,
  dataRetentionLog,
} from "@/db/schema";
import { eq, and, sql, lte, isNotNull, isNull } from "drizzle-orm";

const RETENTION_DAYS: Record<string, number> = {
  transcripts: 365, // 12 months
  call_metadata: 730, // 24 months
  sms_content: 180, // 6 months
  offboarded_business: 30, // 30-day hold after offboarding
};

export async function runRetentionCleanup(): Promise<Record<string, number>> {
  const now = new Date();
  const results: Record<string, number> = {};

  // 1. Delete call transcripts older than 12 months
  const transcriptCutoff = new Date(now.getTime() - RETENTION_DAYS.transcripts * 86400000).toISOString();
  const transcriptResult = await db
    .update(calls)
    .set({ transcript: null })
    .where(
      and(
        lte(calls.createdAt, transcriptCutoff),
        sql`${calls.transcript} IS NOT NULL`,
      ),
    );
  results.transcripts = 0; // SQLite doesn't return affected count from update easily

  // 2. Delete SMS body older than 6 months
  const smsCutoff = new Date(now.getTime() - RETENTION_DAYS.sms_content * 86400000).toISOString();
  await db
    .update(smsMessages)
    .set({ body: "[redacted]" })
    .where(lte(smsMessages.createdAt, smsCutoff));
  results.sms_content = 0;

  // 3. Process offboarded businesses past retention hold
  const holdExpired = await db
    .select()
    .from(businesses)
    .where(
      and(
        isNotNull(businesses.dataRetentionHoldUntil),
        lte(businesses.dataRetentionHoldUntil, now.toISOString()),
        isNull(businesses.dataDeletedAt),
      ),
    );

  let businessCount = 0;
  for (const biz of holdExpired) {
    // Delete calls for this business
    await db.delete(calls).where(eq(calls.businessId, biz.id));
    // Delete SMS messages
    await db.delete(smsMessages).where(eq(smsMessages.businessId, biz.id));
    // Delete appointments
    await db.delete(appointments).where(eq(appointments.businessId, biz.id));
    // Delete leads
    await db.delete(leads).where(eq(leads.businessId, biz.id));
    // Mark business as deleted (but preserve consent records!)
    await db
      .update(businesses)
      .set({ dataDeletedAt: now.toISOString(), active: false })
      .where(eq(businesses.id, biz.id));
    businessCount++;
  }
  results.offboarded_businesses = businessCount;

  // Log results
  for (const [dataType, count] of Object.entries(results)) {
    await db.insert(dataRetentionLog).values({
      dataType,
      recordsDeleted: count,
      deletedAt: now.toISOString(),
      retentionPeriodDays: RETENTION_DAYS[dataType] ?? 0,
    });
  }

  return results;
}
