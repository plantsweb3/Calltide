import { TRADE_PROFILES, type TradeType } from "@/lib/receptionist/trade-profiles";

export interface DigestStats {
  totalCalls: number;
  afterHoursCalls: number;
  appointmentsBooked: number;
  estimatedRevenue: number;
  emergencyCalls: number;
  newCustomers: number;
  busiestDay: string;
  busiestDayCount: number;
  prevWeekCalls: number;
  wowChangePercent: number;
  savedEstimate: number;
}

/**
 * Get the average job value for a trade type, with optional override.
 */
export function getAvgJobValue(type: string, override?: number | null): number {
  if (override && override > 0) return override;
  const profile = TRADE_PROFILES[type as TradeType];
  return profile?.avgJobValue ?? 300;
}

/**
 * Calculate the "saved estimate" — what after-hours calls would have cost if missed.
 * afterHoursCalls × avgJobValue × conversionRate (25%)
 */
export function calculateSavedEstimate(afterHoursCalls: number, avgJobValue: number): number {
  return Math.round(afterHoursCalls * avgJobValue * 0.25);
}

function fmtMoney(cents: number): string {
  return `$${Math.round(cents).toLocaleString("en-US")}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function wowArrow(pct: number): string {
  if (pct > 0) return `<span style="color:#4ade80;">&#9650; ${Math.abs(pct)}% more calls than last week</span>`;
  if (pct < 0) return `<span style="color:#f87171;">&#9660; ${Math.abs(pct)}% fewer calls than last week</span>`;
  return `<span style="color:#94a3b8;">Same call volume as last week</span>`;
}

/**
 * Build the weekly digest email HTML.
 */
export function buildDigestEmail(params: {
  receptionistName: string;
  businessName: string;
  weekStartDate: string; // ISO date
  weekEndDate: string;
  stats: DigestStats;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const { receptionistName, businessName, stats, dashboardUrl } = params;

  // Format date range
  const start = new Date(params.weekStartDate + "T12:00:00");
  const end = new Date(params.weekEndDate + "T12:00:00");
  const dateRange = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const subject = stats.savedEstimate > 0
    ? `${receptionistName} saved you $${Math.round(stats.savedEstimate).toLocaleString("en-US")} this week`
    : `${receptionistName} Weekly Report — ${businessName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Inter',system-ui,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:16px 16px 0 0;padding:32px 28px 24px;border:1px solid rgba(212,168,67,0.2);border-bottom:none;">
    <div style="margin-bottom:4px;">
      <span style="font-size:22px;font-weight:700;color:#D4A843;">${receptionistName}</span>
      <span style="font-size:14px;color:#94a3b8;margin-left:8px;">Weekly Report</span>
    </div>
    <p style="margin:0;font-size:24px;font-weight:700;color:#f8fafc;line-height:1.3;">
      ${receptionistName}'s Week at ${businessName}
    </p>
    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${dateRange}</p>
  </div>

  <!-- Stats Grid -->
  <div style="background:#1B2A4A;padding:28px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#f8fafc;">${fmtNum(stats.totalCalls)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Calls Answered</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#fbbf24;">${fmtNum(stats.afterHoursCalls)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">After-Hours Calls</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#4ade80;">${fmtNum(stats.appointmentsBooked)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Appointments Booked</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#D4A843;">${fmtMoney(stats.estimatedRevenue)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Est. Revenue</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#f87171;">${fmtNum(stats.emergencyCalls)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Emergencies</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#60a5fa;">${fmtNum(stats.newCustomers)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">New Customers</p>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Highlights -->
  <div style="background:#1B2A4A;padding:0 28px 24px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    <!-- Busiest Day -->
    <div style="background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;color:#f8fafc;">
        <span style="color:#D4A843;font-weight:600;">Busiest day:</span> ${stats.busiestDay} (${stats.busiestDayCount} calls)
      </p>
    </div>

    <!-- Saved Estimate -->
    ${stats.savedEstimate > 0 ? `
    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;color:#f8fafc;">
        <span style="color:#4ade80;font-weight:600;">${receptionistName} saved you an estimated ${fmtMoney(stats.savedEstimate)} this week</span>
        <br /><span style="font-size:11px;color:#94a3b8;">from ${stats.afterHoursCalls} after-hours calls that would have gone to voicemail</span>
      </p>
    </div>
    ` : ""}

    <!-- Week-over-Week -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;">${wowArrow(stats.wowChangePercent)}</p>
    </div>
  </div>

  <!-- CTA -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:0 0 16px 16px;padding:24px 28px 32px;text-align:center;border:1px solid rgba(212,168,67,0.2);border-top:none;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#D4A843;color:#0f1729;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
      View Full Dashboard &rarr;
    </a>
    <p style="margin:16px 0 0;font-size:11px;color:#64748b;">
      Capta LLC &middot; San Antonio, TX
    </p>
  </div>

</div>
</body>
</html>`;

  return { subject, html };
}

/**
 * Build the SMS summary for the weekly digest.
 */
export function buildDigestSms(params: {
  receptionistName: string;
  stats: DigestStats;
}): string {
  const { receptionistName, stats } = params;
  return `${receptionistName} Weekly Report: ${stats.totalCalls} calls answered, ${stats.appointmentsBooked} appointments booked (~${fmtMoney(stats.estimatedRevenue)} revenue), ${stats.afterHoursCalls} after-hours calls caught. Full report in your email. — Capta`;
}
