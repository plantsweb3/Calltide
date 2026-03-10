import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, capacitySnapshots, capacityAlerts } from "@/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { getResend } from "@/lib/email/client";
import { PROVIDER_LIMITS, determineTier } from "@/lib/capacity/config";
import { projectBreachDate, estimateMonthlyCost } from "@/lib/capacity/modeling";
import { reportError } from "@/lib/error-reporting";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerEmail = env.OWNER_EMAIL;
  if (!ownerEmail || !env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing OWNER_EMAIL or RESEND_API_KEY" }, { status: 500 });
  }

  try {
    // Active clients
    const [clientResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(businesses)
      .where(eq(businesses.active, true));
    const activeClients = clientResult?.count ?? 0;
    const tier = determineTier(activeClients);

    // Last 7 days of snapshots
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSnapshots = await db
      .select()
      .from(capacitySnapshots)
      .where(gte(capacitySnapshots.date, sevenDaysAgo.toISOString().split("T")[0]))
      .orderBy(desc(capacitySnapshots.date));

    const latest = recentSnapshots[0];
    const oldest = recentSnapshots[recentSnapshots.length - 1];

    // Calculate WoW changes
    const callsAvg = recentSnapshots.length > 0
      ? recentSnapshots.reduce((s, r) => s + (r.callsToday ?? 0), 0) / recentSnapshots.length
      : 0;

    // Active alerts
    const alerts = await db
      .select()
      .from(capacityAlerts)
      .where(sql`${capacityAlerts.resolvedAt} IS NULL`)
      .orderBy(desc(capacityAlerts.createdAt))
      .limit(10);

    // Breach projections
    const dayOfMonth = new Date().getDate();
    const humeBreachDate = projectBreachDate(
      latest?.humeMinutesMtd ?? 0,
      PROVIDER_LIMITS.hume.monthlyMinutes,
      dayOfMonth,
    );

    // Cost estimates
    const costs = estimateMonthlyCost(activeClients);

    // Build email HTML
    const humePct = PROVIDER_LIMITS.hume.monthlyMinutes > 0
      ? (((latest?.humeMinutesMtd ?? 0) / PROVIDER_LIMITS.hume.monthlyMinutes) * 100).toFixed(1)
      : "0";
    const anthropicPct = PROVIDER_LIMITS.anthropic.monthlySpendLimit > 0
      ? (((latest?.anthropicSpendMtd ?? 0) / PROVIDER_LIMITS.anthropic.monthlySpendLimit) * 100).toFixed(1)
      : "0";

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span>
    <span style="color:#94A3B8;font-size:14px;margin-left:8px;">Weekly Capacity Report</span>
  </div>

  <h2 style="color:#1A1D24;margin-bottom:16px;">Infrastructure Status</h2>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr style="background:#F8FAFC;">
      <td style="padding:10px;font-weight:600;color:#475569;border:1px solid #E2E8F0;">Tier</td>
      <td style="padding:10px;color:#1A1D24;border:1px solid #E2E8F0;">${tier.toUpperCase()}</td>
    </tr>
    <tr>
      <td style="padding:10px;font-weight:600;color:#475569;border:1px solid #E2E8F0;">Active Clients</td>
      <td style="padding:10px;color:#1A1D24;border:1px solid #E2E8F0;">${activeClients}</td>
    </tr>
    <tr style="background:#F8FAFC;">
      <td style="padding:10px;font-weight:600;color:#475569;border:1px solid #E2E8F0;">Avg Calls/Day</td>
      <td style="padding:10px;color:#1A1D24;border:1px solid #E2E8F0;">${Math.round(callsAvg)}</td>
    </tr>
    <tr>
      <td style="padding:10px;font-weight:600;color:#475569;border:1px solid #E2E8F0;">Peak Concurrent</td>
      <td style="padding:10px;color:#1A1D24;border:1px solid #E2E8F0;">${latest?.peakConcurrent ?? 0} / ${PROVIDER_LIMITS.hume.concurrentLimit}</td>
    </tr>
  </table>

  <h3 style="color:#1A1D24;margin-bottom:12px;">Provider Utilization</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr style="background:#F8FAFC;">
      <th style="padding:8px;text-align:left;color:#475569;border:1px solid #E2E8F0;">Provider</th>
      <th style="padding:8px;text-align:left;color:#475569;border:1px solid #E2E8F0;">Metric</th>
      <th style="padding:8px;text-align:right;color:#475569;border:1px solid #E2E8F0;">% Used</th>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #E2E8F0;">Hume</td>
      <td style="padding:8px;border:1px solid #E2E8F0;">Monthly Minutes</td>
      <td style="padding:8px;text-align:right;border:1px solid #E2E8F0;color:${Number(humePct) > 85 ? '#ef4444' : Number(humePct) > 70 ? '#f59e0b' : '#4ade80'};">${humePct}%</td>
    </tr>
    <tr style="background:#F8FAFC;">
      <td style="padding:8px;border:1px solid #E2E8F0;">Anthropic</td>
      <td style="padding:8px;border:1px solid #E2E8F0;">Monthly Spend</td>
      <td style="padding:8px;text-align:right;border:1px solid #E2E8F0;color:${Number(anthropicPct) > 85 ? '#ef4444' : Number(anthropicPct) > 70 ? '#f59e0b' : '#4ade80'};">${anthropicPct}%</td>
    </tr>
    <tr>
      <td style="padding:8px;border:1px solid #E2E8F0;">Twilio</td>
      <td style="padding:8px;border:1px solid #E2E8F0;">Success Rate</td>
      <td style="padding:8px;text-align:right;border:1px solid #E2E8F0;color:#4ade80;">${(latest?.twilioSuccessRate ?? 100).toFixed(1)}%</td>
    </tr>
  </table>

  ${humeBreachDate ? `
  <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin-bottom:24px;">
    <p style="color:#92400e;font-weight:600;margin:0;">Projected Breach</p>
    <p style="color:#92400e;margin:4px 0 0;">Hume monthly minutes projected to hit limit by ${humeBreachDate.toLocaleDateString("en", { month: "short", day: "numeric" })}.</p>
  </div>` : ""}

  ${alerts.length > 0 ? `
  <h3 style="color:#1A1D24;margin-bottom:12px;">Active Alerts (${alerts.length})</h3>
  ${alerts.map((a) => `<p style="color:#f59e0b;margin:4px 0;">• ${a.message}</p>`).join("")}
  ` : ""}

  <h3 style="color:#1A1D24;margin-bottom:12px;">Estimated Monthly Cost</h3>
  <p style="color:#1A1D24;font-size:24px;font-weight:700;">$${(costs.total / 100).toFixed(0)}</p>

  <a href="${env.NEXT_PUBLIC_APP_URL}/admin/capacity" style="display:inline-block;background:#C59A27;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
    View Full Dashboard
  </a>

  <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
  <p style="color:#94A3B8;font-size:11px;">Capta LLC &middot; San Antonio, TX</p>
</div>`;

    const resend = getResend();
    const from = env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.capta.app>";
    await resend.emails.send({
      from,
      to: ownerEmail,
      subject: `Capta Capacity Report — ${tier.toUpperCase()} Tier, ${activeClients} clients`,
      html,
    });

    return NextResponse.json({ ok: true, tier, activeClients, alertCount: alerts.length });
  } catch (err) {
    reportError("[weekly report] Error", err);
    return NextResponse.json(
      { error: "Report failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
