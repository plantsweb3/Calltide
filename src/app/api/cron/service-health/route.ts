import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

interface ServiceCheck {
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  error?: string;
}

/**
 * GET /api/cron/service-health
 *
 * Pings external services (Twilio, Hume, Stripe, Resend, Turso)
 * and reports degraded/down status to Sentry.
 * Run every 5 minutes via cron.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronMonitor("service-health", "*/5 * * * *", async () => {
    const checks: ServiceCheck[] = await Promise.all([
      checkTwilio(),
      checkHume(),
      checkStripe(),
      checkResend(),
      checkTurso(),
    ]);

    const degraded = checks.filter((c) => c.status === "degraded");
    const down = checks.filter((c) => c.status === "down");

    // Report issues to Sentry
    for (const check of down) {
      reportError(`[service-health] ${check.name} is DOWN`, new Error(check.error || "Service unreachable"), {
        extra: { service: check.name, latencyMs: check.latencyMs },
      });
    }

    for (const check of degraded) {
      reportWarning(`[service-health] ${check.name} is DEGRADED (${check.latencyMs}ms)`, {
        service: check.name,
        latencyMs: check.latencyMs,
        error: check.error,
      });
    }

    // Track as Sentry custom metric
    if (down.length > 0 || degraded.length > 0) {
      Sentry.withScope((scope) => {
        scope.setTag("monitor.type", "service-health");
        scope.setExtras({
          checks: checks.map((c) => ({ name: c.name, status: c.status, latencyMs: c.latencyMs })),
          downCount: down.length,
          degradedCount: degraded.length,
        });
        if (down.length > 0) {
          Sentry.captureMessage(
            `Service health: ${down.map((d) => d.name).join(", ")} DOWN`,
            "error",
          );
        }
      });
    }

    return NextResponse.json({
      ok: down.length === 0,
      timestamp: new Date().toISOString(),
      checks: checks.map((c) => ({
        name: c.name,
        status: c.status,
        latencyMs: c.latencyMs,
        ...(c.error ? { error: c.error } : {}),
      })),
    });
  });
}

const LATENCY_THRESHOLD = 5000; // 5s = degraded

async function timedFetch(url: string, options?: RequestInit): Promise<{ ok: boolean; status: number; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkTwilio(): Promise<ServiceCheck> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return { name: "Twilio", status: "down", latencyMs: 0, error: "Not configured" };

  const { ok, latencyMs, error } = await timedFetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
    { headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") } },
  );

  if (!ok) return { name: "Twilio", status: "down", latencyMs, error: error || "API returned error" };
  if (latencyMs > LATENCY_THRESHOLD) return { name: "Twilio", status: "degraded", latencyMs };
  return { name: "Twilio", status: "ok", latencyMs };
}

async function checkHume(): Promise<ServiceCheck> {
  const apiKey = process.env.HUME_API_KEY;
  if (!apiKey) return { name: "Hume", status: "down", latencyMs: 0, error: "Not configured" };

  const { ok, latencyMs, error } = await timedFetch(
    "https://api.hume.ai/v0/evi/configs",
    { headers: { "X-Hume-Api-Key": apiKey } },
  );

  if (!ok) return { name: "Hume", status: "down", latencyMs, error: error || "API returned error" };
  if (latencyMs > LATENCY_THRESHOLD) return { name: "Hume", status: "degraded", latencyMs };
  return { name: "Hume", status: "ok", latencyMs };
}

async function checkStripe(): Promise<ServiceCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { name: "Stripe", status: "down", latencyMs: 0, error: "Not configured" };

  const { ok, latencyMs, error } = await timedFetch(
    "https://api.stripe.com/v1/balance",
    { headers: { Authorization: `Bearer ${key}` } },
  );

  if (!ok) return { name: "Stripe", status: "down", latencyMs, error: error || "API returned error" };
  if (latencyMs > LATENCY_THRESHOLD) return { name: "Stripe", status: "degraded", latencyMs };
  return { name: "Stripe", status: "ok", latencyMs };
}

async function checkResend(): Promise<ServiceCheck> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { name: "Resend", status: "down", latencyMs: 0, error: "Not configured" };

  const { ok, latencyMs, error } = await timedFetch(
    "https://api.resend.com/domains",
    { headers: { Authorization: `Bearer ${key}` } },
  );

  if (!ok) return { name: "Resend", status: "down", latencyMs, error: error || "API returned error" };
  if (latencyMs > LATENCY_THRESHOLD) return { name: "Resend", status: "degraded", latencyMs };
  return { name: "Resend", status: "ok", latencyMs };
}

async function checkTurso(): Promise<ServiceCheck> {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return { name: "Turso", status: "down", latencyMs: 0, error: "Not configured" };

  // Quick DB query to check connectivity
  const start = Date.now();
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    await client.execute("SELECT 1");
    const latencyMs = Date.now() - start;
    if (latencyMs > LATENCY_THRESHOLD) return { name: "Turso", status: "degraded", latencyMs };
    return { name: "Turso", status: "ok", latencyMs };
  } catch (err) {
    return {
      name: "Turso",
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
