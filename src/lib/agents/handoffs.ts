import { db } from "@/db";
import { agentHandoffs } from "@/db/schema";
import { eq, and, lte, inArray } from "drizzle-orm";

type AgentName = "churn" | "success" | "onboard" | "qa" | "health";
type Priority = "normal" | "high" | "urgent";

interface CreateHandoffOpts {
  fromAgent: AgentName;
  toAgent: AgentName;
  businessId: string;
  reason: string;
  context?: Record<string, unknown>;
  priority?: Priority;
  /** Hours until this handoff expires (default 72) */
  ttlHours?: number;
}

/**
 * Create a handoff from one agent to another.
 * The receiving agent will pick this up on its next cron run.
 */
export async function createHandoff(opts: CreateHandoffOpts): Promise<string> {
  const expiresAt = new Date(
    Date.now() + (opts.ttlHours ?? 72) * 60 * 60 * 1000,
  ).toISOString();

  const [handoff] = await db
    .insert(agentHandoffs)
    .values({
      fromAgent: opts.fromAgent,
      toAgent: opts.toAgent,
      businessId: opts.businessId,
      reason: opts.reason,
      context: opts.context,
      priority: opts.priority ?? "normal",
      expiresAt,
    })
    .returning();

  return handoff.id;
}

/**
 * Get all pending handoffs for an agent, ordered by priority (urgent first).
 */
export async function getHandoffsForAgent(agentName: AgentName) {
  return db
    .select()
    .from(agentHandoffs)
    .where(
      and(
        eq(agentHandoffs.toAgent, agentName),
        eq(agentHandoffs.status, "pending"),
      ),
    )
    .orderBy(agentHandoffs.priority);
}

/**
 * Mark a handoff as completed with optional note.
 */
export async function completeHandoff(
  handoffId: string,
  note?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(agentHandoffs)
    .set({
      status: "completed",
      completedAt: now,
      completedNote: note,
      updatedAt: now,
    })
    .where(eq(agentHandoffs.id, handoffId));
}

/**
 * Expire all handoffs past their TTL.
 * Called periodically (e.g., from the health agent).
 */
export async function expireHandoffs(): Promise<number> {
  const now = new Date().toISOString();

  // Find expired pending handoffs
  const expired = await db
    .select({ id: agentHandoffs.id })
    .from(agentHandoffs)
    .where(
      and(
        inArray(agentHandoffs.status, ["pending", "in_progress"]),
        lte(agentHandoffs.expiresAt, now),
      ),
    );

  if (expired.length === 0) return 0;

  const ids = expired.map((h) => h.id);
  await db
    .update(agentHandoffs)
    .set({ status: "expired", updatedAt: now })
    .where(inArray(agentHandoffs.id, ids));

  return ids.length;
}

/**
 * Mark a handoff as in_progress (agent is working on it).
 */
export async function claimHandoff(handoffId: string): Promise<void> {
  await db
    .update(agentHandoffs)
    .set({ status: "in_progress", updatedAt: new Date().toISOString() })
    .where(eq(agentHandoffs.id, handoffId));
}
