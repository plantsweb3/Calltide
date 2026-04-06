import { db } from "@/db";
import {
  calls,
  smsMessages,
  appointments,
  leads,
  businesses,
  dataRetentionLog,
  systemHealthLogs,
  agentActivityLog,
  pendingJobs,
  rateLimitEntries,
} from "@/db/schema";
import { eq, and, or, sql, lte, isNotNull, isNull } from "drizzle-orm";
import { reportWarning } from "@/lib/error-reporting";

const RETENTION_DAYS: Record<string, number> = {
  transcripts: 365, // 12 months
  call_metadata: 730, // 24 months
  sms_content: 180, // 6 months
  offboarded_business: 30, // 30-day hold after offboarding
  system_health_logs: 90, // 3 months
  agent_activity_log: 90, // 3 months
  pending_jobs: 30, // 30 days (completed/failed only)
  rate_limit_entries: 1, // 24 hours
};

export async function runRetentionCleanup(): Promise<Record<string, number>> {
  const now = new Date();
  const results: Record<string, number> = {};

  // 1. Delete call transcripts older than 12 months
  const transcriptCutoff = new Date(now.getTime() - RETENTION_DAYS.transcripts * 86400000).toISOString();
  await db
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

  // 4. Delete system health logs older than 90 days
  const healthCutoff = new Date(now.getTime() - RETENTION_DAYS.system_health_logs * 86400000).toISOString();
  await db
    .delete(systemHealthLogs)
    .where(lte(systemHealthLogs.checkedAt, healthCutoff));
  results.system_health_logs = 0;
  reportWarning(`[retention] Deleted system_health_logs older than ${healthCutoff}`);

  // 5. Delete agent activity logs older than 90 days
  const agentCutoff = new Date(now.getTime() - RETENTION_DAYS.agent_activity_log * 86400000).toISOString();
  await db
    .delete(agentActivityLog)
    .where(lte(agentActivityLog.createdAt, agentCutoff));
  results.agent_activity_log = 0;
  reportWarning(`[retention] Deleted agent_activity_log older than ${agentCutoff}`);

  // 6. Delete completed/failed pending jobs older than 30 days
  const jobsCutoff = new Date(now.getTime() - RETENTION_DAYS.pending_jobs * 86400000).toISOString();
  await db
    .delete(pendingJobs)
    .where(
      and(
        or(
          eq(pendingJobs.status, "completed"),
          eq(pendingJobs.status, "failed"),
        ),
        lte(pendingJobs.createdAt, jobsCutoff),
      ),
    );
  results.pending_jobs = 0;
  reportWarning(`[retention] Deleted completed/failed pending_jobs older than ${jobsCutoff}`);

  // 7. Delete stale rate limit entries older than 24 hours
  const rateLimitCutoff = new Date(now.getTime() - RETENTION_DAYS.rate_limit_entries * 86400000).toISOString();
  await db
    .delete(rateLimitEntries)
    .where(lte(rateLimitEntries.windowEnd, rateLimitCutoff));
  results.rate_limit_entries = 0;
  reportWarning(`[retention] Deleted rate_limit_entries with windowEnd before ${rateLimitCutoff}`);

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
