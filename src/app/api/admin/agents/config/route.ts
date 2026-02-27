import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { agentName, ...updates } = body as Record<string, unknown>;

  if (!agentName || typeof agentName !== "string") {
    return NextResponse.json({ error: "agentName is required" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: agentConfig.id })
    .from(agentConfig)
    .where(eq(agentConfig.agentName, agentName))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: `Agent "${agentName}" not found` }, { status: 404 });
  }

  const allowedFields: Record<string, unknown> = {};
  if (typeof updates.enabled === "boolean") allowedFields.enabled = updates.enabled;
  if (typeof updates.cronExpression === "string") allowedFields.cronExpression = updates.cronExpression;
  if (typeof updates.escalationThreshold === "number") allowedFields.escalationThreshold = updates.escalationThreshold;
  if (typeof updates.systemPromptOverride === "string" || updates.systemPromptOverride === null) {
    allowedFields.systemPromptOverride = updates.systemPromptOverride;
  }

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
