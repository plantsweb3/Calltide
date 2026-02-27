import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { incidents, incidentUpdates, systemHealthLogs } from "@/db/schema";
import { eq, and, sql, desc, lte } from "drizzle-orm";
import { env } from "@/lib/env";
import { formatDuration } from "./engine";

const CLAUDE_MODEL = env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export async function generatePostmortem(incidentId: string): Promise<void> {
  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!incident) return;

  // Fetch timeline updates
  const updates = await db
    .select()
    .from(incidentUpdates)
    .where(eq(incidentUpdates.incidentId, incidentId))
    .orderBy(incidentUpdates.createdAt);

  // Fetch health logs during the incident window
  const healthLogs = await db
    .select()
    .from(systemHealthLogs)
    .where(
      and(
        sql`${systemHealthLogs.checkedAt} >= ${incident.startedAt}`,
        sql`${systemHealthLogs.checkedAt} <= ${incident.resolvedAt ?? new Date().toISOString()}`,
      ),
    )
    .orderBy(systemHealthLogs.checkedAt);

  const timelineStr = updates
    .map((u) => `[${u.createdAt}] ${u.status}: ${u.message}`)
    .join("\n");

  const healthStr = healthLogs
    .map((h) => `[${h.checkedAt}] ${h.serviceName}: ${h.status} (${h.latencyMs}ms, errors: ${h.errorCount})`)
    .join("\n");

  const prompt = `Generate a professional incident postmortem report in Markdown for a SaaS business communications platform (Calltide). Be concise and factual.

Incident Details:
- Title: ${incident.title}
- Severity: ${incident.severity}
- Affected Services: ${(incident.affectedServices as string[]).join(", ")}
- Started: ${incident.startedAt}
- Resolved: ${incident.resolvedAt ?? "ongoing"}
- Duration: ${incident.duration ? formatDuration(incident.duration) : "ongoing"}
- Clients Affected: ${incident.clientsAffected}
- Estimated Calls Impacted: ${incident.estimatedCallsImpacted}

Timeline:
${timelineStr || "No timeline entries available."}

Health Check Logs During Window:
${healthStr || "No health logs available."}

Write the postmortem with these sections:
## Summary
## Timeline
## Root Cause
## Impact
## Resolution
## Lessons Learned
## Action Items

Keep it professional, factual, and under 500 words.`;

  try {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const postmortem = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Generate Spanish version
    const esResponse = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "user", content: `Translate this incident postmortem report to Spanish. Keep the Markdown formatting and section headers (translate headers too). Be professional.\n\n${postmortem}` },
      ],
    });

    const postmortemEs = esResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    await db
      .update(incidents)
      .set({
        postmortem,
        postmortemEs,
        status: "postmortem",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(incidents.id, incidentId));
  } catch (err) {
    console.error(`Postmortem generation failed for incident ${incidentId}:`, err);
  }
}

export async function checkAndGeneratePendingPostmortems(): Promise<void> {
  const now = new Date().toISOString();

  const pending = await db
    .select()
    .from(incidents)
    .where(
      and(
        sql`${incidents.postmortemScheduledFor} IS NOT NULL`,
        lte(incidents.postmortemScheduledFor, now),
        sql`${incidents.postmortem} IS NULL`,
        eq(incidents.status, "resolved"),
      ),
    );

  for (const incident of pending) {
    await generatePostmortem(incident.id);
  }
}
