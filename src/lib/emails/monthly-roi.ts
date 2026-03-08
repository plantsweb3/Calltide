import { TRADE_PROFILES, type TradeType } from "@/lib/receptionist/trade-profiles";

export interface MonthlyStats {
  totalCalls: number;
  afterHoursCalls: number;
  appointmentsBooked: number;
  estimatedRevenue: number;
  emergencyCalls: number;
  newCustomers: number;
  savedEstimate: number;
  prevMonthCalls: number;
  momChangePercent: number;
  roiMultiple: number;
  costPerLead: number;
  spanishCallPercent: number;
}

function getAvgJobValue(type: string, override?: number | null): number {
  if (override && override > 0) return override;
  const profile = TRADE_PROFILES[type as TradeType];
  return profile?.avgJobValue ?? 300;
}

export function calculateMonthlyStats(params: {
  totalCalls: number;
  afterHoursCalls: number;
  appointmentsBooked: number;
  emergencyCalls: number;
  newCustomers: number;
  prevMonthCalls: number;
  spanishCalls: number;
  businessType: string;
  avgJobValueOverride?: number | null;
}): MonthlyStats {
  const avgJobValue = getAvgJobValue(params.businessType, params.avgJobValueOverride);
  const estimatedRevenue = params.appointmentsBooked * avgJobValue;
  const savedEstimate = Math.round(params.afterHoursCalls * avgJobValue * 0.25);
  const monthlyPlanCost = 497;

  const roiMultiple = monthlyPlanCost > 0
    ? Math.round((estimatedRevenue / monthlyPlanCost) * 10) / 10
    : 0;

  const costPerLead = params.appointmentsBooked > 0
    ? Math.round((monthlyPlanCost / params.appointmentsBooked) * 100) / 100
    : 0;

  const momChangePercent = params.prevMonthCalls === 0
    ? params.totalCalls > 0 ? 100 : 0
    : Math.round(((params.totalCalls - params.prevMonthCalls) / params.prevMonthCalls) * 100);

  const spanishCallPercent = params.totalCalls > 0
    ? Math.round((params.spanishCalls / params.totalCalls) * 100)
    : 0;

  return {
    totalCalls: params.totalCalls,
    afterHoursCalls: params.afterHoursCalls,
    appointmentsBooked: params.appointmentsBooked,
    estimatedRevenue,
    emergencyCalls: params.emergencyCalls,
    newCustomers: params.newCustomers,
    savedEstimate,
    prevMonthCalls: params.prevMonthCalls,
    momChangePercent,
    roiMultiple,
    costPerLead,
    spanishCallPercent,
  };
}

function fmtMoney(cents: number): string {
  return `$${Math.round(cents).toLocaleString("en-US")}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function momArrow(pct: number): string {
  if (pct > 0) return `<span style="color:#4ade80;">&#9650; ${Math.abs(pct)}% more calls than last month</span>`;
  if (pct < 0) return `<span style="color:#f87171;">&#9660; ${Math.abs(pct)}% fewer calls than last month</span>`;
  return `<span style="color:#94a3b8;">Same call volume as last month</span>`;
}

function roiColor(multiple: number): string {
  if (multiple >= 3) return "#4ade80";
  if (multiple >= 1) return "#fbbf24";
  return "#f87171";
}

export function buildMonthlyRoiEmail(params: {
  receptionistName: string;
  businessName: string;
  monthLabel: string; // e.g. "February 2026"
  stats: MonthlyStats;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const { receptionistName, businessName, stats, dashboardUrl, monthLabel } = params;

  const subject = `${receptionistName} Monthly ROI Report — ${businessName}`;

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
      <span style="font-size:14px;color:#94a3b8;margin-left:8px;">Monthly ROI Report</span>
    </div>
    <p style="margin:0;font-size:24px;font-weight:700;color:#f8fafc;line-height:1.3;">
      ${monthLabel} at ${businessName}
    </p>
  </div>

  <!-- ROI Hero -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,rgba(212,168,67,0.08) 100%);padding:28px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="50%" style="padding:8px;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px 16px;text-align:center;border:1px solid rgba(212,168,67,0.15);">
            <p style="margin:0;font-size:36px;font-weight:800;color:#D4A843;">${fmtMoney(stats.estimatedRevenue)}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Revenue Generated</p>
          </div>
        </td>
        <td width="50%" style="padding:8px;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:24px 16px;text-align:center;border:1px solid rgba(74,222,128,0.15);">
            <p style="margin:0;font-size:36px;font-weight:800;color:${roiColor(stats.roiMultiple)};">${stats.roiMultiple}x</p>
            <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Return on $497/mo</p>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Stats Grid -->
  <div style="background:#1B2A4A;padding:0 28px 28px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="33%" style="padding:6px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#f8fafc;">${fmtNum(stats.totalCalls)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Calls Answered</p>
          </div>
        </td>
        <td width="33%" style="padding:6px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#4ade80;">${fmtNum(stats.appointmentsBooked)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Appointments Booked</p>
          </div>
        </td>
        <td width="33%" style="padding:6px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#fbbf24;">${fmtNum(stats.afterHoursCalls)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">After-Hours Calls</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="33%" style="padding:6px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#f87171;">${fmtNum(stats.emergencyCalls)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Emergencies</p>
          </div>
        </td>
        <td width="33%" style="padding:6px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#60a5fa;">${fmtNum(stats.newCustomers)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">New Customers</p>
          </div>
        </td>
        <td width="33%" style="padding:6px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#D4A843;">${fmtMoney(stats.costPerLead)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Cost Per Lead</p>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Highlights -->
  <div style="background:#1B2A4A;padding:0 28px 24px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    ${stats.savedEstimate > 0 ? `
    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;color:#f8fafc;">
        <span style="color:#4ade80;font-weight:600;">${receptionistName} saved you an estimated ${fmtMoney(stats.savedEstimate)} this month</span>
        <br /><span style="font-size:11px;color:#94a3b8;">from ${stats.afterHoursCalls} after-hours calls that would have gone to voicemail</span>
      </p>
    </div>
    ` : ""}

    ${stats.spanishCallPercent > 0 ? `
    <div style="background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;color:#f8fafc;">
        <span style="color:#60a5fa;font-weight:600;">${stats.spanishCallPercent}% of calls were in Spanish</span>
        <br /><span style="font-size:11px;color:#94a3b8;">Your bilingual receptionist is capturing revenue that competitors miss</span>
      </p>
    </div>
    ` : ""}

    <!-- Month-over-Month -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;">${momArrow(stats.momChangePercent)}</p>
    </div>
  </div>

  <!-- Bottom line -->
  <div style="background:#1B2A4A;padding:0 28px 24px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    <div style="background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:10px;padding:18px;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#D4A843;text-align:center;">
        You invested $497 this month. ${receptionistName} generated ${fmtMoney(stats.estimatedRevenue)}.
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
        That&rsquo;s a ${stats.roiMultiple}x return on your investment.
      </p>
    </div>
  </div>

  <!-- CTA -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:0 0 16px 16px;padding:24px 28px 32px;text-align:center;border:1px solid rgba(212,168,67,0.2);border-top:none;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#D4A843;color:#0f1729;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
      View Full Dashboard &rarr;
    </a>
    <p style="margin:16px 0 0;font-size:11px;color:#64748b;">
      Calltide Inc. &middot; San Antonio, TX
    </p>
  </div>

</div>
</body>
</html>`;

  return { subject, html };
}

export function buildMonthlyRoiSms(params: {
  receptionistName: string;
  stats: MonthlyStats;
  monthLabel: string;
}): string {
  const { receptionistName, stats, monthLabel } = params;
  return `${receptionistName} ${monthLabel} Report: ${stats.totalCalls} calls, ${stats.appointmentsBooked} appointments (~${fmtMoney(stats.estimatedRevenue)}), ${stats.roiMultiple}x ROI on $497. Check your email for full report. — Calltide`;
}
