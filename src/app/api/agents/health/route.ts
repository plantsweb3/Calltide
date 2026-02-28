import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/db";
import { systemHealthLogs } from "@/db/schema";
import { createNotification } from "@/lib/notifications";

/**
 * GET /api/agents/health
 *
 * Cron-triggered health check.
 * Pings all external services and logs results directly — no LLM call needed.
 * Schedule: every 15 minutes
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
    console.error("Stale call cleanup error (non-fatal):", err);
  }

  // Incident engine hooks — detect/resolve incidents automatically
  try {
    const { handleUnhealthyService, handleHealthyService } = await import("@/lib/incidents/engine");
    const { checkAndGeneratePendingPostmortems } = await import("@/lib/incidents/postmortem");

    for (const check of checks) {
      if (!check.healthy) await handleUnhealthyService(check);
      else await handleHealthyService(check);
    }
    await checkAndGeneratePendingPostmortems();
  } catch (err) {
    console.error("Incident engine error (non-fatal):", err);
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

async function runHealthChecks(): Promise<HealthCheck[]> {
  const checks: Promise<HealthCheck>[] = [
    checkTwilio(),
    checkHume(),
    checkAnthropic(),
    checkTurso(),
    checkResend(),
  ];

  return Promise.all(checks);
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
    const url = new URL(env.TURSO_DATABASE_URL);
    // Hit the health endpoint of the Turso HTTP API
    const healthUrl = `https://${url.hostname}/health`;
    const resp = await fetch(healthUrl, {
      signal: AbortSignal.timeout(10000),
    });
    return {
      name: "Turso",
      statusCode: resp.status,
      responseTimeMs: Date.now() - start,
      healthy: resp.ok,
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
  const start = Date.now();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { name: "Resend", statusCode: 0, responseTimeMs: 0, healthy: false, error: "RESEND_API_KEY not set" };
  }
  try {
    const resp = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    return {
      name: "Resend",
      statusCode: resp.status,
      responseTimeMs: Date.now() - start,
      healthy: resp.ok,
    };
  } catch (error) {
    return {
      name: "Resend",
      statusCode: 0,
      responseTimeMs: Date.now() - start,
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
