import { db } from "@/db";
import { pendingJobs } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export type JobType = "twilio_provision" | "call_summary" | "consent_record" | "email_send";

/**
 * Enqueue a job for async processing with retry support.
 * If the operation succeeds inline, don't enqueue. Only enqueue on failure.
 */
export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown>,
  maxAttempts = 5,
): Promise<string> {
  const [job] = await db
    .insert(pendingJobs)
    .values({ type, payload, maxAttempts })
    .returning({ id: pendingJobs.id });
  return job.id;
}

/**
 * Process pending jobs that are due for retry.
 * Returns the number of jobs processed.
 */
export async function processRetryQueue(
  handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>,
  batchSize = 20,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date().toISOString();

  const jobs = await db
    .select()
    .from(pendingJobs)
    .where(
      and(
        eq(pendingJobs.status, "pending"),
        lte(pendingJobs.nextRetryAt, now),
      ),
    )
    .orderBy(pendingJobs.nextRetryAt)
    .limit(batchSize);

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    const handler = handlers[job.type];
    if (!handler) {
      reportError(`No handler for job type: ${job.type}`, null);
      continue;
    }

    try {
      await handler(job.payload as Record<string, unknown>);

      // Mark as completed
      await db
        .update(pendingJobs)
        .set({
          status: "completed",
          completedAt: new Date().toISOString(),
          attempts: job.attempts + 1,
        })
        .where(eq(pendingJobs.id, job.id));

      succeeded++;
    } catch (err) {
      const attempts = job.attempts + 1;
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (attempts >= job.maxAttempts) {
        // Exhausted retries — mark as permanently failed
        await db
          .update(pendingJobs)
          .set({
            status: "failed",
            attempts,
            lastError: errorMessage,
          })
          .where(eq(pendingJobs.id, job.id));

        reportError(`Job permanently failed after ${attempts} attempts`, err, {
          extra: { jobId: job.id, jobType: job.type },
        });
      } else {
        // Schedule retry with exponential backoff: 30s, 2m, 8m, 32m, ...
        const backoffSeconds = 30 * Math.pow(4, attempts - 1);
        const nextRetry = new Date(Date.now() + backoffSeconds * 1000).toISOString();

        await db
          .update(pendingJobs)
          .set({
            attempts,
            lastError: errorMessage,
            nextRetryAt: nextRetry,
          })
          .where(eq(pendingJobs.id, job.id));
      }

      failed++;
    }
  }

  return { processed: jobs.length, succeeded, failed };
}
