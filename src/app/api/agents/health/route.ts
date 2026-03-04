import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/db";
import { systemHealthLogs } from "@/db/schema";
import { createNotification } from "@/lib/notifications";
import { reportError } from "@/lib/error-reporting";
import { sql } from "drizzle-orm";

/**
 * GET /api/agents/health
 *
 * Cron-triggered health check.
 * Pings external services and logs results directly — no LLM call needed.
 * Schedule: every 15 minutes
 *
 * Cost optimization:
 * - Turso: verified via SELECT 1 (free, no HTTP round-trip)
 * - Twilio: free authenticated GET (always checked)
 * - Resend: env var presence check only (no API call)
 * - Env vars: validates all required env vars are present
 * - Anthropic & Hume: only checked every 4 hours (expensive API calls)
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run health checks against all services
  const checks = await runHealthChecks();

  // Clean up stale active call records (>30 min old)
  try {
    const { cleanupStaleCalls } = await import("@/lib/monitoring/active-calls");
    const staleCount = await cleanupStaleCalls();
    if (staleCount > 0) console.log(`Cleaned up ${staleCount} stale active call(s)`);
  } catch (err) {
    reportError("Stale call cleanup error (non-fatal)", err);
  }

  // Incident engine hooks — detect/resolve incidents automatically
  try {
    const { handleUnhealthyService, handleHealthyService } = await import("@/lib/incidents/engine");
    const { checkAndGeneratePendingPostmortems } = await import("@/lib/incidents/postmortem");
    const { executeAutoActions, deactivateVoicemailFallback, DISASTER_PLAYBOOK } = await import("@/lib/incidents/disaster-playbook");

    for (const check of checks) {
      if (!check.healthy) {
        const incidentId = await handleUnhealthyService(check);
        // Trigger disaster playbook auto-actions for new/ongoing incidents
        if (incidentId && DISASTER_PLAYBOOK[check.name]) {
          await executeAutoActions(incidentId, check.name);
        }
      } else {
        await handleHealthyService(check);
        // If a service that triggered voicemail fallback recovers, deactivate it
        if (check.name === "Hume" || check.name === "Turso") {
          await deactivateVoicemailFallback();
        }
      }
    }
    await checkAndGeneratePendingPostmortems();
  } catch (err) {
    reportError("Incident engine error (non-fatal)", err);
  }

  // Expire stale agent handoffs
  try {
    const { expireHandoffs } = await import("@/lib/agents/handoffs");
    const expiredCount = await expireHandoffs();
    if (expiredCount > 0) console.log(`Expired ${expiredCount} stale agent handoff(s)`);
  } catch (err) {
    reportError("Handoff expiry error (non-fatal)", err);
  }

  // Log each result directly to systemHealthLogs — no Anthropic API call
  const unhealthy: string[] = [];
  for (const check of checks) {
    await db.insert(systemHealthLogs).values({
      serviceName: check.name,
      status: check.healthy ? "operational" : "down",
      latencyMs: check.responseTimeMs,
      errorCount: check.healthy ? 0 : 1,
    });

    if (!check.healthy) {
      unhealthy.push(check.name);
      await createNotification({
        source: "agents",
        severity: "emergency",
        title: `${check.name} is DOWN`,
        message: `Status code: ${check.statusCode}, Response: ${check.responseTimeMs}ms${check.error ? `, Error: ${check.error}` : ""}`,
        actionUrl: "/admin/ops",
      });
    }
  }

  return NextResponse.json({
    checks,
    unhealthy,
    summary: unhealthy.length > 0
      ? `${unhealthy.length} service(s) unhealthy: ${unhealthy.join(", ")}`
      : "All services operational",
  });
}

interface HealthCheck {
  name: string;
  statusCode: number;
  responseTimeMs: number;
  healthy: boolean;
  error?: string;
}

const EXPENSIVE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Check if a service was recently checked (within the last 4 hours)
 * by querying the systemHealthLogs table. If the last check was healthy
 * and recent, we skip the expensive API call.
 */
async function wasRecentlyCheckedHealthy(serviceName: string): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - EXPENSIVE_CHECK_INTERVAL_MS).toISOString();
    const rows = await db
      .select({ status: systemHealthLogs.status })
      .from(systemHealthLogs)
      .where(
        sql`${systemHealthLogs.serviceName} = ${serviceName} AND ${systemHealthLogs.checkedAt} > ${cutoff}`
      )
      .orderBy(sql`${systemHealthLogs.checkedAt} DESC`)
      .limit(1);

    return rows.length > 0 && rows[0].status === "operational";
  } catch {
    // If we can't check, run the expensive check
    return false;
  }
}

async function runHealthChecks(): Promise<HealthCheck[]> {
  // Always run: Turso (SELECT 1, free), Twilio (free API), Resend (env only), Env vars
  const alwaysChecks: Promise<HealthCheck>[] = [
    checkTurso(),
    checkTwilio(),
    checkResend(),
    checkEnvVars(),
  ];

  // Expensive checks: only run if last healthy check was >4 hours ago
  const [anthropicRecent, humeRecent] = await Promise.all([
    wasRecentlyCheckedHealthy("Anthropic"),
    wasRecentlyCheckedHealthy("Hume"),
  ]);

  const expensiveChecks: Promise<HealthCheck>[] = [];

  if (!anthropicRecent) {
    expensiveChecks.push(checkAnthropic());
  }
  if (!humeRecent) {
    expensiveChecks.push(checkHume());
  }

  return Promise.all([...alwaysChecks, ...expensiveChecks]);
}

async function checkTwilio(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const resp = await fetch("https://api.twilio.com/2010-04-01.json", {
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    return {
      name: "Twilio",
      statusCode: resp.status,
      responseTimeMs: Date.now() - start,
      healthy: resp.ok,
    };
  } catch (error) {
    return {
      name: "Twilio",
      statusCode: 0,
      responseTimeMs: Date.now() - start,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkHume(): Promise<HealthCheck> {
  const start = Date.now();
  if (!env.HUME_API_KEY) {
    return { name: "Hume", statusCode: 0, responseTimeMs: 0, healthy: false, error: "HUME_API_KEY not set" };
  }
  try {
    const resp = await fetch("https://api.hume.ai/v0/evi/chats", {
      method: "GET",
      headers: { "X-Hume-Api-Key": env.HUME_API_KEY },
      signal: AbortSignal.timeout(10000),
    });
    return {
      name: "Hume",
      statusCode: resp.status,
      responseTimeMs: Date.now() - start,
      healthy: resp.status < 500,
    };
  } catch (error) {
    return {
      name: "Hume",
      statusCode: 0,
      responseTimeMs: Date.now() - start,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkAnthropic(): Promise<HealthCheck> {
  const start = Date.now();
  if (!env.ANTHROPIC_API_KEY) {
    return { name: "Anthropic", statusCode: 0, responseTimeMs: 0, healthy: false, error: "ANTHROPIC_API_KEY not set" };
  }
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    return {
      name: "Anthropic",
      statusCode: resp.status,
      responseTimeMs: Date.now() - start,
      healthy: resp.ok,
    };
  } catch (error) {
    return {
      name: "Anthropic",
      statusCode: 0,
      responseTimeMs: Date.now() - start,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkTurso(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Use a simple SELECT 1 query via Drizzle — no HTTP round-trip needed
    await db.run(sql`SELECT 1`);
    return {
      name: "Turso",
      statusCode: 200,
      responseTimeMs: Date.now() - start,
      healthy: true,
    };
  } catch (error) {
    return {
      name: "Turso",
      statusCode: 0,
      responseTimeMs: Date.now() - start,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkResend(): Promise<HealthCheck> {
  // Env var presence check only — no API call needed every 5-15 min
  const apiKey = process.env.RESEND_API_KEY;
  return {
    name: "Resend",
    statusCode: apiKey ? 200 : 0,
    responseTimeMs: 0,
    healthy: !!apiKey,
    error: apiKey ? undefined : "RESEND_API_KEY not set",
  };
}

const REQUIRED_ENV_VARS = [
  "CRON_SECRET",
  "CLIENT_AUTH_SECRET",
  "ADMIN_PASSWORD",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "HUME_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

async function checkEnvVars(): Promise<HealthCheck> {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  return {
    name: "Env Vars",
    statusCode: missing.length === 0 ? 200 : 0,
    responseTimeMs: 0,
    healthy: missing.length === 0,
    error: missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined,
  };
}
