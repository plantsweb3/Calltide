import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { incidents, incidentUpdates, systemHealthLogs } from "@/db/schema";
import { eq, and, sql, desc, lte } from "drizzle-orm";
import { env } from "@/lib/env";
import { formatDuration } from "./engine";
import { notifyClients, notifySubscribers } from "./notifications";
import { reportError } from "@/lib/error-reporting";
import { getAnthropic, SONNET_MODEL } from "@/lib/ai/client";

const CLAUDE_MODEL = env.CLAUDE_MODEL ?? SONNET_MODEL;

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

    if (!postmortem.trim()) {
      reportError(`Postmortem generation returned empty content for incident ${incidentId}`, null);
      return;
    }

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
        postmortemPublished: true,
        status: "postmortem",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(incidents.id, incidentId));

    // Auto-publish: notify affected clients and status page subscribers
    const [updated] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, incidentId))
      .limit(1);
    if (updated) {
      await notifyClients(updated, "resolved").catch((e) =>
        reportError("Postmortem client notification failed", e, { extra: { incidentId } })
      );
      await notifySubscribers(updated, "resolved").catch((e) =>
        reportError("Postmortem subscriber notification failed", e, { extra: { incidentId } })
      );
    }
  } catch (err) {
    reportError(`Postmortem generation failed for incident ${incidentId}`, err);
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
