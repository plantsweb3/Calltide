import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  dataDeletionRequests,
  businesses,
  customers,
  calls,
  appointments,
  leads,
  estimates,
  smsMessages,
  customerNotes,
  callQaScores,
} from "@/db/schema";
import { eq, and, sql, lt } from "drizzle-orm";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/data-deletion
 *
 * Processes verified data deletion requests (GDPR/CCPA).
 * Anonymizes PII from all related records rather than deleting rows
 * (preserves aggregate metrics while removing personal data).
 *
 * Schedule: daily at 2 AM UTC
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("data-deletion", "0 2 * * *", async () => {
    let processed = 0;
    let errors = 0;
    let unstuck = 0;

    try {
      // Reset stuck requests: if "processing" for more than 1 hour, revert to "verified"
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const stuckResult = await db
        .update(dataDeletionRequests)
        .set({
          status: "verified",
          processingStartedAt: null,
        })
        .where(
          and(
            eq(dataDeletionRequests.status, "processing"),
            lt(dataDeletionRequests.processingStartedAt, oneHourAgo),
          ),
        );
      unstuck = stuckResult.rowsAffected ?? 0;
      if (unstuck > 0) {
        reportWarning("[data-deletion] Reset stuck processing requests back to verified", { unstuck });
      }

      // Find all verified requests ready for processing
      const pending = await db
        .select()
        .from(dataDeletionRequests)
        .where(eq(dataDeletionRequests.status, "verified"));

      for (const request of pending) {
        try {
          // Mark as processing
          await db
            .update(dataDeletionRequests)
            .set({
              status: "processing",
              processingStartedAt: new Date().toISOString(),
            })
            .where(eq(dataDeletionRequests.id, request.id));

          const deletedRecords: Record<string, number> = {};
          const email = request.requestedBy;

          await db.transaction(async (tx) => {
            // Find the business associated with this email
            const [biz] = await tx
              .select({ id: businesses.id })
              .from(businesses)
              .where(eq(businesses.ownerEmail, email))
              .limit(1);

            if (biz) {
              // Anonymize customers
              const custResult = await tx
                .update(customers)
                .set({
                  name: "DELETED",
                  email: null,
                  address: null,
                  notes: null,
                  phone: `deleted-${Date.now()}`,
                  tags: [],
                  deletedAt: new Date().toISOString(),
                })
                .where(and(eq(customers.businessId, biz.id), sql`${customers.deletedAt} IS NULL`));
              deletedRecords.customers = custResult.rowsAffected ?? 0;

              // Anonymize calls (keep metadata for analytics, remove PII)
              const callResult = await tx
                .update(calls)
                .set({
                  callerPhone: "DELETED",
                  summary: null,
                  transcript: null,
                })
                .where(eq(calls.businessId, biz.id));
              deletedRecords.calls = callResult.rowsAffected ?? 0;

              // Anonymize leads
              const leadResult = await tx
                .update(leads)
                .set({
                  name: "DELETED",
                  email: null,
                  phone: `deleted-${Date.now()}`,
                  notes: null,
                })
                .where(eq(leads.businessId, biz.id));
              deletedRecords.leads = leadResult.rowsAffected ?? 0;

              // Anonymize appointments (clear notes only — PII is in leads table)
              const apptResult = await tx
                .update(appointments)
                .set({
                  notes: null,
                })
                .where(eq(appointments.businessId, biz.id));
              deletedRecords.appointments = apptResult.rowsAffected ?? 0;

              // Anonymize SMS messages
              const smsResult = await tx
                .update(smsMessages)
                .set({
                  body: "DELETED",
                  fromNumber: "DELETED",
                  toNumber: "DELETED",
                })
                .where(eq(smsMessages.businessId, biz.id));
              deletedRecords.smsMessages = smsResult.rowsAffected ?? 0;

              // Delete customer notes (via customer IDs since no businessId column)
              const bizCustomers = await tx
                .select({ id: customers.id })
                .from(customers)
                .where(eq(customers.businessId, biz.id));
              if (bizCustomers.length > 0) {
                const { inArray } = await import("drizzle-orm");
                const customerIds = bizCustomers.map((c) => c.id);
                const notesResult = await tx
                  .delete(customerNotes)
                  .where(inArray(customerNotes.customerId, customerIds));
                deletedRecords.customerNotes = notesResult.rowsAffected ?? 0;
              }

              // Delete QA scores (contain call content analysis)
              const qaResult = await tx
                .delete(callQaScores)
                .where(eq(callQaScores.businessId, biz.id));
              deletedRecords.qaScores = qaResult.rowsAffected ?? 0;

              // Anonymize estimates
              const estResult = await tx
                .update(estimates)
                .set({
                  description: "DELETED",
                  notes: null,
                })
                .where(eq(estimates.businessId, biz.id));
              deletedRecords.estimates = estResult.rowsAffected ?? 0;

              // Mark business as data-deleted
              await tx
                .update(businesses)
                .set({
                  dataDeletedAt: new Date().toISOString(),
                  ownerName: "DELETED",
                  ownerEmail: `deleted-${Date.now()}@deleted.local`,
                  ownerPhone: "DELETED",
                })
                .where(eq(businesses.id, biz.id));
              deletedRecords.business = 1;
            }

            // Mark request as completed
            await tx
              .update(dataDeletionRequests)
              .set({
                status: "completed",
                completedAt: new Date().toISOString(),
                deletedRecords,
              })
              .where(eq(dataDeletionRequests.id, request.id));
          });

          processed++;
          reportWarning("[data-deletion] Completed request", { requestId: request.id, deletedRecords });
        } catch (err) {
          errors++;
          reportError(`[data-deletion] Failed for request ${request.id}`, err);
          // Don't mark as failed — leave as processing for manual review
        }
      }

      return NextResponse.json({
        success: true,
        processed,
        errors,
        unstuck,
        total: pending.length,
      });
    } catch (err) {
      reportError("[data-deletion] Fatal error", err);
      return NextResponse.json({ error: "Data deletion failed" }, { status: 500 });
    }
  });
}
