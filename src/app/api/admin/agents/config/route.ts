import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

const cronExpressionSchema = z
  .string()
  .trim()
  .refine((s) => {
    const parts = s.split(/\s+/);
    return parts.length >= 5 && parts.length <= 6 && /^[0-9*,\-\/]+$/.test(parts.join(""));
  }, { message: "Invalid cron expression" });

const configPatchSchema = z.object({
  agentName: z.string().min(1).max(100),
  enabled: z.boolean().optional(),
  cronExpression: cronExpressionSchema.optional(),
  escalationThreshold: z.number().int().min(0).max(100).optional(),
  systemPromptOverride: z.string().max(2000).nullable().optional(),
});

/**
 * GET /api/admin/agents/config
 *
 * List all agent configurations.
 */
export async function GET() {
  const configs = await db.select().from(agentConfig);
  return NextResponse.json(configs);
}

/**
 * PATCH /api/admin/agents/config
 *
 * Update an agent's configuration.
 * Body: { agentName: string, enabled?: boolean, cronExpression?: string, escalationThreshold?: number, systemPromptOverride?: string }
 */
export async function PATCH(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = configPatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }
  const { agentName, enabled, cronExpression, escalationThreshold, systemPromptOverride } = parsed.data;

  let [existing] = await db
    .select({ id: agentConfig.id })
    .from(agentConfig)
    .where(eq(agentConfig.agentName, agentName))
    .limit(1);

  // Auto-create config row if it doesn't exist (e.g., first toggle from dashboard)
  if (!existing) {
    const [created] = await db
      .insert(agentConfig)
      .values({ agentName })
      .returning({ id: agentConfig.id });
    existing = created;
  }

  const allowedFields: Record<string, unknown> = {};
  if (enabled !== undefined) allowedFields.enabled = enabled;
  if (cronExpression !== undefined) allowedFields.cronExpression = cronExpression;
  if (escalationThreshold !== undefined) allowedFields.escalationThreshold = escalationThreshold;
  if (systemPromptOverride !== undefined) allowedFields.systemPromptOverride = systemPromptOverride;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  allowedFields.updatedAt = new Date().toISOString();

  await db.update(agentConfig).set(allowedFields).where(eq(agentConfig.agentName, agentName));

  const [updated] = await db
    .select()
    .from(agentConfig)
    .where(eq(agentConfig.agentName, agentName))
    .limit(1);

  return NextResponse.json(updated);
}
