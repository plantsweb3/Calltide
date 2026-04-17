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

function fmtMoney(cents: number, lang: "en" | "es" = "en"): string {
  const locale = lang === "es" ? "es-MX" : "en-US";
  return `$${Math.round(cents).toLocaleString(locale)}`;
}

function fmtNum(n: number, lang: "en" | "es" = "en"): string {
  const locale = lang === "es" ? "es-MX" : "en-US";
  return n.toLocaleString(locale);
}

function wowArrow(pct: number, lang: "en" | "es" = "en"): string {
  if (lang === "es") {
    if (pct > 0) return `<span style="color:#4ade80;">&#9650; ${Math.abs(pct)}% más llamadas que la semana pasada</span>`;
    if (pct < 0) return `<span style="color:#f87171;">&#9660; ${Math.abs(pct)}% menos llamadas que la semana pasada</span>`;
    return `<span style="color:#94a3b8;">Mismo volumen de llamadas que la semana pasada</span>`;
  }
  if (pct > 0) return `<span style="color:#4ade80;">&#9650; ${Math.abs(pct)}% more calls than last week</span>`;
  if (pct < 0) return `<span style="color:#f87171;">&#9660; ${Math.abs(pct)}% fewer calls than last week</span>`;
  return `<span style="color:#94a3b8;">Same call volume as last week</span>`;
}

const EN = {
  weeklyReport: "Weekly Report",
  weekAt: (r: string, b: string) => `${r}'s Week at ${b}`,
  callsAnswered: "Calls Answered",
  afterHoursCalls: "After-Hours Calls",
  appointmentsBooked: "Appointments Booked",
  estRevenue: "Est. Revenue",
  emergencies: "Emergencies",
  newCustomers: "New Customers",
  busiestDay: "Busiest day",
  savedYou: (r: string, amt: string) => `${r} saved you an estimated ${amt} this week`,
  savedDetail: (n: number) => `from ${n} after-hours calls that would have gone to voicemail`,
  viewDashboard: "View Full Dashboard \u2192",
  smsLine: (r: string, calls: number, appts: number, revenue: string, afterHours: number) =>
    `${r} Weekly Report: ${calls} calls answered, ${appts} appointments booked (~${revenue} revenue), ${afterHours} after-hours calls caught. Full report in your email. \u2014 Capta`,
  subjectSaved: (r: string, amt: string) => `${r} saved you ${amt} this week`,
  subjectReport: (r: string, b: string) => `${r} Weekly Report \u2014 ${b}`,
  calls: "calls",
};

const ES: typeof EN = {
  weeklyReport: "Reporte Semanal",
  weekAt: (r: string, b: string) => `La semana de ${r} en ${b}`,
  callsAnswered: "Llamadas Contestadas",
  afterHoursCalls: "Llamadas Fuera de Horario",
  appointmentsBooked: "Citas Programadas",
  estRevenue: "Ingreso Est.",
  emergencies: "Emergencias",
  newCustomers: "Clientes Nuevos",
  busiestDay: "Día más ocupado",
  savedYou: (r: string, amt: string) => `${r} le ahorró aproximadamente ${amt} esta semana`,
  savedDetail: (n: number) => `de ${n} llamadas fuera de horario que habrían ido a buzón`,
  viewDashboard: "Ver Panel Completo \u2192",
  smsLine: (r: string, calls: number, appts: number, revenue: string, afterHours: number) =>
    `Reporte Semanal de ${r}: ${calls} llamadas contestadas, ${appts} citas (~${revenue} ingreso), ${afterHours} fuera de horario. Reporte en tu correo. \u2014 Capta`,
  subjectSaved: (r: string, amt: string) => `${r} le ahorró ${amt} esta semana`,
  subjectReport: (r: string, b: string) => `Reporte Semanal de ${r} \u2014 ${b}`,
  calls: "llamadas",
};

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
  lang?: "en" | "es";
}): { subject: string; html: string } {
  const { receptionistName, businessName, stats, dashboardUrl } = params;
  const lang = params.lang === "es" ? "es" : "en";
  const L = lang === "es" ? ES : EN;
  const locale = lang === "es" ? "es-MX" : "en-US";

  // Format date range
  const start = new Date(params.weekStartDate + "T12:00:00");
  const end = new Date(params.weekEndDate + "T12:00:00");
  const dateRange = `${start.toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`;

  const subject = stats.savedEstimate > 0
    ? L.subjectSaved(receptionistName, fmtMoney(stats.savedEstimate, lang))
    : L.subjectReport(receptionistName, businessName);

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Inter',system-ui,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:16px 16px 0 0;padding:32px 28px 24px;border:1px solid rgba(212,168,67,0.2);border-bottom:none;">
    <div style="margin-bottom:4px;">
      <span style="font-size:22px;font-weight:700;color:#D4A843;">${receptionistName}</span>
      <span style="font-size:14px;color:#94a3b8;margin-left:8px;">${L.weeklyReport}</span>
    </div>
    <p style="margin:0;font-size:24px;font-weight:700;color:#f8fafc;line-height:1.3;">
      ${L.weekAt(receptionistName, businessName)}
    </p>
    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${dateRange}</p>
  </div>

  <!-- Stats Grid -->
  <div style="background:#1B2A4A;padding:28px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#f8fafc;">${fmtNum(stats.totalCalls, lang)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${L.callsAnswered}</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#fbbf24;">${fmtNum(stats.afterHoursCalls, lang)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${L.afterHoursCalls}</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#4ade80;">${fmtNum(stats.appointmentsBooked, lang)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${L.appointmentsBooked}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#D4A843;">${fmtMoney(stats.estimatedRevenue, lang)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${L.estRevenue}</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#f87171;">${fmtNum(stats.emergencyCalls, lang)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${L.emergencies}</p>
          </div>
        </td>
        <td width="33%" style="padding:8px;text-align:center;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px 12px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:32px;font-weight:800;color:#60a5fa;">${fmtNum(stats.newCustomers, lang)}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">${L.newCustomers}</p>
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
        <span style="color:#D4A843;font-weight:600;">${L.busiestDay}:</span> ${stats.busiestDay} (${stats.busiestDayCount} ${L.calls})
      </p>
    </div>

    <!-- Saved Estimate -->
    ${stats.savedEstimate > 0 ? `
    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:14px 18px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;color:#f8fafc;">
        <span style="color:#4ade80;font-weight:600;">${L.savedYou(receptionistName, fmtMoney(stats.savedEstimate, lang))}</span>
        <br /><span style="font-size:11px;color:#94a3b8;">${L.savedDetail(stats.afterHoursCalls)}</span>
      </p>
    </div>
    ` : ""}

    <!-- Week-over-Week -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;">${wowArrow(stats.wowChangePercent, lang)}</p>
    </div>
  </div>

  <!-- CTA -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:0 0 16px 16px;padding:24px 28px 32px;text-align:center;border:1px solid rgba(212,168,67,0.2);border-top:none;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#D4A843;color:#0f1729;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
      ${L.viewDashboard}
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
  lang?: "en" | "es";
}): string {
  const { receptionistName, stats } = params;
  const lang = params.lang === "es" ? "es" : "en";
  const L = lang === "es" ? ES : EN;
  return L.smsLine(
    receptionistName,
    stats.totalCalls,
    stats.appointmentsBooked,
    fmtMoney(stats.estimatedRevenue, lang),
    stats.afterHoursCalls,
  );
}
