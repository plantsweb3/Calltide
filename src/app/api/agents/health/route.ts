import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runAgent, SHARED_TOOLS, AGENT_PROMPTS } from "@/lib/agents";

const HEALTH_TOOLS = SHARED_TOOLS.filter((t) =>
  ["log_health_status", "escalate_to_owner"].includes(t.name),
);

/**
 * GET /api/agents/health
 *
 * Cron-triggered health check.
 * Pings all external services and logs results.
 * Schedule: every 5 minutes (* /5 * * * *)
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run health checks against all services
  const checks = await runHealthChecks();

  const message = `Here are the health check results for all Calltide services. Log each result and escalate if any service is unhealthy or degraded.

${checks.map((c) => `SERVICE: ${c.name}
  Status Code: ${c.statusCode}
  Response Time: ${c.responseTimeMs}ms
  Healthy: ${c.healthy}
  ${c.error ? `Error: ${c.error}` : ""}`).join("\n\n")}

Log all results using log_health_status. If any service is unhealthy, escalate to the owner.`;

  const result = await runAgent({
    agentName: "health",
    systemPrompt: AGENT_PROMPTS.health,
    userMessage: message,
    tools: HEALTH_TOOLS,
    targetType: "system",
    inputSummary: `Health check: ${checks.filter((c) => !c.healthy).length} unhealthy`,
  });

  return NextResponse.json({
    checks,
    agentResult: result,
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
