import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { and, eq, gt, ne } from "drizzle-orm";
import { runAgent, QUALIFY_TOOLS, AGENT_PROMPTS } from "@/lib/agents";
import { verifyCronAuth } from "@/lib/cron-auth";
import { reportError } from "@/lib/error-reporting";

/**
 * POST /api/agents/qualify
 *
 * Trigger the Qualify agent to evaluate a specific prospect.
 * Body: { prospectId: string }
 */
export async function POST(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { prospectId } = body as { prospectId: unknown };

  if (!prospectId || typeof prospectId !== "string") {
    return NextResponse.json({ error: "prospectId is required" }, { status: 400 });
  }

  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, prospectId))
    .limit(1);

  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const message = buildQualifyMessage(prospect);

  try {
    const result = await runAgent({
      agentName: "qualify",
      systemPrompt: AGENT_PROMPTS.qualify,
      userMessage: message,
      tools: QUALIFY_TOOLS,
      targetId: prospectId,
      targetType: "prospect",
      inputSummary: `Qualify prospect: ${prospect.businessName}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    reportError("[qualify] Agent failed for prospect", error, { extra: { prospectId } });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/agents/qualify
 *
 * Batch qualification — evaluates all active prospects.
 * Designed for cron or manual batch runs.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    // Get prospects that are in active pipeline stages
    const activeProspects = await db
      .select()
      .from(prospects)
      .where(
        and(
          ne(prospects.status, "converted"),
          ne(prospects.status, "disqualified"),
          gt(prospects.leadScore, 10),
        ),
      )
      .limit(20);

    const results = [];

    for (const prospect of activeProspects) {
      const message = buildQualifyMessage(prospect);
      const result = await runAgent({
        agentName: "qualify",
        systemPrompt: AGENT_PROMPTS.qualify,
        userMessage: message,
        tools: QUALIFY_TOOLS,
        targetId: prospect.id,
        targetType: "prospect",
        inputSummary: `Qualify prospect: ${prospect.businessName}`,
      });
      results.push({ prospectId: prospect.id, name: prospect.businessName, ...result });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    reportError("[qualify] Agent failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function buildQualifyMessage(prospect: typeof prospects.$inferSelect): string {
  return `Evaluate this prospect and take appropriate action:

Business: ${prospect.businessName}
Vertical: ${prospect.vertical ?? "unknown"}
Phone: ${prospect.phone ?? "none"}
Email: ${prospect.email ?? "none"}
Website: ${prospect.website ?? "none"}
City/State: ${prospect.city ?? ""}${prospect.state ? `, ${prospect.state}` : ""}
Rating: ${prospect.rating ?? "N/A"} (${prospect.reviewCount ?? 0} reviews)
Lead Score: ${prospect.leadScore}/65
Current Status: ${prospect.status}
Audit Result: ${prospect.auditResult ?? "not audited"}
Tags: ${(prospect.tags as string[])?.join(", ") || "none"}
Notes: ${prospect.notes ?? "none"}

Based on their profile and lead score, decide what action to take — update status, send outreach, book a demo, or escalate.`;
}
