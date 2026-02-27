import { db } from "@/db";
import {
  incidents,
  incidentUpdates,
  businesses,
  calls,
  systemHealthLogs,
} from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { notifyOwner, notifyClients, notifySubscribers } from "./notifications";

// ── Types ──

export interface HealthCheckResult {
  name: string;
  statusCode: number;
  responseTimeMs: number;
  healthy: boolean;
  error?: string;
}

type IncidentStatus = "detected" | "investigating" | "identified" | "monitoring" | "resolved" | "postmortem";
type Severity = "critical" | "major" | "minor" | "maintenance";

// ── In-memory flap prevention (same pattern as rate-limit.ts) ──

const unhealthyStreak = new Map<string, number>();
const healthyStreak = new Map<string, number>();
const cooldowns = new Map<string, number>(); // service -> timestamp when cooldown expires

const UNHEALTHY_THRESHOLD = 2; // consecutive unhealthy checks before creating incident
const HEALTHY_THRESHOLD = 2;   // consecutive healthy checks before auto-resolving
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between incidents for same service

// ── Public API ──

export async function handleUnhealthyService(check: HealthCheckResult): Promise<void> {
  const service = check.name;

  // Reset healthy streak
  healthyStreak.set(service, 0);

  // Increment unhealthy streak
  const streak = (unhealthyStreak.get(service) ?? 0) + 1;
  unhealthyStreak.set(service, streak);

  // Flap prevention: need consecutive unhealthy checks
  if (streak < UNHEALTHY_THRESHOLD) return;

  // Check cooldown
  const cooldownUntil = cooldowns.get(service) ?? 0;
  if (Date.now() < cooldownUntil) return;

  // Check for existing open incident for this service
  const existing = await getOpenIncidentForService(service);

  if (existing) {
    // Escalate if warranted
    await escalateIncident(existing.id, check);
    // Update consecutive check count
    await db
      .update(incidents)
      .set({
        consecutiveUnhealthyChecks: streak,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(incidents.id, existing.id));
  } else {
    // Create new incident
    await createIncident(check);
    cooldowns.set(service, Date.now() + COOLDOWN_MS);
  }
}

export async function handleHealthyService(check: HealthCheckResult): Promise<void> {
  const service = check.name;

  // Reset unhealthy streak
  unhealthyStreak.set(service, 0);

  // Increment healthy streak
  const streak = (healthyStreak.get(service) ?? 0) + 1;
  healthyStreak.set(service, streak);

  // Need consecutive healthy checks before auto-resolving
  if (streak < HEALTHY_THRESHOLD) return;

  const existing = await getOpenIncidentForService(service);
  if (existing) {
    await resolveIncident(existing.id);
  }
}

// ── Incident CRUD ──

export async function createIncident(check: HealthCheckResult): Promise<string> {
  const severity = determineSeverity(check);
  const title = generateIncidentTitle(check);
  const titleEs = generateIncidentTitleEs(check);
  const clientsAffected = await countActiveClients();
  const estimatedCalls = await estimateCallsDuringWindow(30); // 30-min estimate

  const [incident] = await db
    .insert(incidents)
    .values({
      title,
      titleEs,
      status: "detected",
      severity,
      affectedServices: [check.name],
      clientsAffected,
      estimatedCallsImpacted: estimatedCalls,
      consecutiveUnhealthyChecks: unhealthyStreak.get(check.name) ?? 0,
      metadata: {
        statusCode: check.statusCode,
        responseTimeMs: check.responseTimeMs,
        error: check.error,
      },
    })
    .returning();

  // Add initial timeline entry
  await addIncidentUpdate(incident.id, "detected", {
    message: `${check.name} detected as unhealthy. Status code: ${check.statusCode}, Response time: ${check.responseTimeMs}ms${check.error ? `. Error: ${check.error}` : ""}`,
    messageEs: `${check.name} detectado como no saludable. Código de estado: ${check.statusCode}, Tiempo de respuesta: ${check.responseTimeMs}ms${check.error ? `. Error: ${check.error}` : ""}`,
  });

  // Trigger notifications
  try {
    await notifyOwner(incident, "created");
    if (severity === "critical" || severity === "major") {
      await notifyClients(incident, "created");
    }
    await notifySubscribers(incident, "created");
  } catch (err) {
    console.error("Incident notification error:", err);
  }

  return incident.id;
}

export async function resolveIncident(incidentId: string): Promise<void> {
  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!incident || incident.status === "resolved" || incident.status === "postmortem") return;

  const now = new Date().toISOString();
  const startedAt = new Date(incident.startedAt).getTime();
  const duration = Math.round((Date.now() - startedAt) / 1000);
  const postmortemScheduledFor = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await db
    .update(incidents)
    .set({
      status: "resolved",
      resolvedAt: now,
      duration,
      postmortemScheduledFor,
      updatedAt: now,
    })
    .where(eq(incidents.id, incidentId));

  await addIncidentUpdate(incidentId, "resolved", {
    message: `Incident resolved after ${formatDuration(duration)}. All affected services are operational.`,
    messageEs: `Incidente resuelto después de ${formatDuration(duration)}. Todos los servicios afectados están operativos.`,
  });

  // Notify resolution
  const updated = { ...incident, status: "resolved" as const, resolvedAt: now, duration };
  try {
    await notifyOwner(updated, "resolved");
    if (incident.severity === "critical" || incident.severity === "major") {
      await notifyClients(updated, "resolved");
    }
    await notifySubscribers(updated, "resolved");
  } catch (err) {
    console.error("Resolution notification error:", err);
  }
}

export async function escalateIncident(incidentId: string, check: HealthCheckResult): Promise<void> {
  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!incident) return;

  const newSeverity = determineSeverity(check);
  if (!severityIsHigher(newSeverity, incident.severity as Severity)) return;

  await db
    .update(incidents)
    .set({
      severity: newSeverity,
      status: "investigating",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(incidents.id, incidentId));

  await addIncidentUpdate(incidentId, "investigating", {
    message: `Severity escalated from ${incident.severity} to ${newSeverity}. Investigating further.`,
    messageEs: `Severidad escalada de ${incident.severity} a ${newSeverity}. Investigando más.`,
  });

  // Re-notify on critical escalation
  if (newSeverity === "critical") {
    const updated = { ...incident, severity: newSeverity, status: "investigating" as const };
    try {
      await notifyOwner(updated, "update");
      await notifyClients(updated, "update");
      await notifySubscribers(updated, "update");
    } catch (err) {
      console.error("Escalation notification error:", err);
    }
  }
}

export async function addIncidentUpdate(
  incidentId: string,
  status: IncidentStatus | string,
  opts: { message: string; messageEs?: string; isPublic?: boolean },
): Promise<void> {
  await db.insert(incidentUpdates).values({
    incidentId,
    status,
    message: opts.message,
    messageEs: opts.messageEs,
    isPublic: opts.isPublic ?? true,
  });
}

// ── Helpers ──

export function determineSeverity(check: HealthCheckResult): Severity {
  if (check.statusCode === 0 || check.responseTimeMs > 30000) return "critical";
  if (check.statusCode >= 500 || check.responseTimeMs > 10000) return "major";
  return "minor";
}

async function getOpenIncidentForService(service: string): Promise<typeof incidents.$inferSelect | null> {
  const openStatuses: IncidentStatus[] = ["detected", "investigating", "identified", "monitoring"];

  const results = await db
    .select()
    .from(incidents)
    .where(inArray(incidents.status, openStatuses))
    .orderBy(desc(incidents.startedAt));

  // Check if any open incident has this service in affectedServices
  for (const inc of results) {
    const affected = inc.affectedServices as string[];
    if (affected.includes(service)) return inc;
  }
  return null;
}

async function countActiveClients(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(businesses)
    .where(eq(businesses.active, true));
  return result?.count ?? 0;
}

async function estimateCallsDuringWindow(minutes: number): Promise<number> {
  // Average calls per minute over the last 24 hours, projected forward
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(sql`${calls.createdAt} > datetime('now', '-1 day')`);
  const callsPer24h = result?.count ?? 0;
  const callsPerMinute = callsPer24h / (24 * 60);
  return Math.round(callsPerMinute * minutes);
}

function generateIncidentTitle(check: HealthCheckResult): string {
  if (check.statusCode === 0) return `${check.name} Service Outage`;
  if (check.statusCode >= 500) return `${check.name} Service Errors (${check.statusCode})`;
  if (check.responseTimeMs > 10000) return `${check.name} High Latency`;
  return `${check.name} Service Degradation`;
}

function generateIncidentTitleEs(check: HealthCheckResult): string {
  if (check.statusCode === 0) return `Interrupción del servicio ${check.name}`;
  if (check.statusCode >= 500) return `Errores del servicio ${check.name} (${check.statusCode})`;
  if (check.responseTimeMs > 10000) return `Alta latencia de ${check.name}`;
  return `Degradación del servicio ${check.name}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function severityIsHigher(newSev: Severity, currentSev: Severity): boolean {
  const order: Record<Severity, number> = { maintenance: 0, minor: 1, major: 2, critical: 3 };
  return order[newSev] > order[currentSev];
}
