import type { DigestData } from "./aggregator";
import { env } from "@/lib/env";

const STATUS_EMOJI: Record<string, string> = {
  confirmed: "\u2705",
  adjusted: "\u2705",
  pending_review: "\ud83d\udfe1",
  awaiting_adjustment: "\ud83d\udfe1",
  site_visit_requested: "\ud83d\udccd",
  expired: "\u23f0",
  no_intake: "",
};

/**
 * Format digest data into an SMS message.
 * Target: under 1600 characters (single MMS or ~10 SMS segments).
 * Prioritizes: action items > new leads > appointments > stats.
 */
export function formatDigestSMS(
  data: DigestData,
  businessName: string,
  ownerName: string,
  receptionistName: string,
): string {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Quiet day
  if (data.totalCalls === 0 && data.pendingJobCards === 0 && data.tomorrowAppointments.length === 0) {
    return [
      `\ud83d\udcca ${receptionistName}'s Daily Report`,
      today,
      "",
      `Quiet day at ${businessName} \u2014 0 calls today.`,
      "",
      data.tomorrowAppointments.length > 0
        ? `\ud83d\udcc5 Tomorrow: ${data.tomorrowAppointments.length} appointment${data.tomorrowAppointments.length > 1 ? "s" : ""}`
        : "\ud83d\udcc5 No appointments tomorrow",
      "",
      `\u2705 ${receptionistName}'s keeping watch. Enjoy your evening, ${ownerName}!`,
    ].join("\n");
  }

  const lines: string[] = [];

  // Header
  lines.push(`\ud83d\udcca ${receptionistName}'s Daily Report for ${businessName}`);
  lines.push(today);
  lines.push("");

  // Call summary
  lines.push(`\ud83d\udcde ${data.totalCalls} call${data.totalCalls !== 1 ? "s" : ""} today`);

  // New leads (limit to 5 for SMS length)
  if (data.callBreakdown.newLeads.length > 0) {
    const leadCount = data.callBreakdown.newLeads.length;
    lines.push(`\u2022 ${leadCount} new lead${leadCount > 1 ? "s" : ""}:`);
    for (const lead of data.callBreakdown.newLeads.slice(0, 5)) {
      const emoji = STATUS_EMOJI[lead.status] || "";
      const estimate = lead.estimateRange ? `, ${lead.estimateRange}` : "";
      const photos = lead.photoCount > 0 ? `, \u{1F4F8}${lead.photoCount} photo${lead.photoCount > 1 ? "s" : ""}` : "";
      const statusLabel = lead.status === "confirmed" || lead.status === "adjusted" ? " Confirmed" : lead.status === "pending_review" ? " Pending" : "";
      lines.push(`  - ${lead.callerName}: ${lead.jobType}${estimate}${photos} ${emoji}${statusLabel}`);
    }
    if (leadCount > 5) lines.push(`  + ${leadCount - 5} more`);
  }

  // Existing customers
  if (data.callBreakdown.existingCustomers.length > 0) {
    const custList = data.callBreakdown.existingCustomers.slice(0, 3)
      .map((c) => `${c.callerName} (${c.reason})`).join(", ");
    lines.push(`\u2022 ${data.callBreakdown.existingCustomers.length} existing customer${data.callBreakdown.existingCustomers.length > 1 ? "s" : ""} (${custList})`);
  }

  // Suppliers
  if (data.callBreakdown.suppliers.length > 0) {
    const suppList = data.callBreakdown.suppliers.slice(0, 2)
      .map((s) => `${s.callerName} \u2014 ${s.reason}`).join(", ");
    lines.push(`\u2022 ${data.callBreakdown.suppliers.length} supplier (${suppList})`);
  }

  // Missed/spam
  if (data.callBreakdown.missed > 0) {
    lines.push(`\u2022 ${data.callBreakdown.missed} missed`);
  }

  // Tomorrow appointments
  lines.push("");
  if (data.tomorrowAppointments.length > 0) {
    lines.push(`\ud83d\udcc5 Tomorrow: ${data.tomorrowAppointments.length} appointment${data.tomorrowAppointments.length > 1 ? "s" : ""}`);
    for (const appt of data.tomorrowAppointments.slice(0, 4)) {
      lines.push(`\u2022 ${appt.time} \u2014 ${appt.customerName}, ${appt.jobType}`);
    }
  } else {
    lines.push("\ud83d\udcc5 No appointments tomorrow");
  }

  // Action items
  if (data.actionItems.length > 0) {
    lines.push("");
    lines.push("\u26a1 Action needed:");
    for (const item of data.actionItems.slice(0, 4)) {
      lines.push(`\u2022 ${item.description}`);
    }
  }

  // Monthly revenue
  if (data.estimatedRevenueCaptured && data.estimatedRevenueCaptured > 0) {
    lines.push("");
    lines.push(`\ud83d\udcb0 This month: ${receptionistName} has captured ~$${data.estimatedRevenueCaptured.toLocaleString()} in estimated job value.`);
  }

  // Sign off
  lines.push("");
  lines.push(`Have a good evening, ${ownerName}!`);

  let result = lines.join("\n");

  // Truncate if needed — prioritize keeping action items and leads
  if (result.length > 1600) {
    result = result.slice(0, 1597) + "...";
  }

  return result;
}

/**
 * Format digest data into an email.
 * Uses the existing Capta email template patterns (navy/gold theme).
 * NOTE: Does NOT include customer phone numbers in email (less secure than SMS).
 */
export function formatDigestEmail(
  data: DigestData,
  businessName: string,
  ownerName: string,
  receptionistName: string,
): { subject: string; html: string } {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL || "https://capta.app"}/dashboard/job-cards`;

  // Subject line
  const subjectParts: string[] = [];
  if (data.totalCalls > 0) subjectParts.push(`${data.totalCalls} call${data.totalCalls !== 1 ? "s" : ""}`);
  if (data.callBreakdown.newLeads.length > 0) subjectParts.push(`${data.callBreakdown.newLeads.length} new lead${data.callBreakdown.newLeads.length > 1 ? "s" : ""}`);
  if (data.pendingJobCards > 0) subjectParts.push(`${data.pendingJobCards} pending`);
  const subject = subjectParts.length > 0
    ? `${receptionistName}'s Daily Report \u2014 ${subjectParts.join(", ")}`
    : `${receptionistName}'s Daily Report \u2014 ${businessName}`;

  // Quiet day email
  const isQuietDay = data.totalCalls === 0 && data.pendingJobCards === 0 && data.tomorrowAppointments.length === 0;

  const leadsHtml = data.callBreakdown.newLeads.map((lead) => {
    const statusColor = lead.status === "confirmed" || lead.status === "adjusted" ? "#4ade80" : lead.status === "pending_review" ? "#fbbf24" : "#94a3b8";
    const statusLabel = lead.status === "confirmed" || lead.status === "adjusted" ? "Confirmed" : lead.status === "pending_review" ? "Pending" : lead.status === "site_visit_requested" ? "Site Visit" : "";
    const estimate = lead.estimateRange ? `<span style="color:#D4A843;font-weight:600;">${escapeHtml(lead.estimateRange)}</span>` : "";
    const photos = lead.photoCount > 0 ? `<span style="color:#94a3b8;font-size:11px;margin-left:4px;">\u{1F4F8}${lead.photoCount}</span>` : "";
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#f8fafc;font-size:13px;">${escapeHtml(lead.callerName)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#94a3b8;font-size:13px;">${escapeHtml(lead.jobType)}${photos}</td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">${estimate}</td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;"><span style="color:${statusColor};font-weight:500;">${statusLabel}</span></td>
    </tr>`;
  }).join("");

  const appointmentsHtml = data.tomorrowAppointments.map((appt) =>
    `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">
      <span style="color:#D4A843;font-weight:600;">${escapeHtml(appt.time)}</span>
      <span style="color:#f8fafc;margin-left:8px;">${escapeHtml(appt.customerName)}</span>
      <span style="color:#94a3b8;margin-left:8px;">\u2014 ${escapeHtml(appt.jobType)}</span>
    </div>`,
  ).join("");

  const actionItemsHtml = data.actionItems.map((item) =>
    `<div style="padding:6px 0;font-size:13px;color:#fbbf24;">\u2022 ${escapeHtml(item.description)}</div>`,
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0f1729;font-family:'Inter',system-ui,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:16px 16px 0 0;padding:32px 28px 24px;border:1px solid rgba(212,168,67,0.2);border-bottom:none;">
    <div style="margin-bottom:4px;">
      <span style="font-size:22px;font-weight:700;color:#D4A843;">${escapeHtml(receptionistName)}</span>
      <span style="font-size:14px;color:#94a3b8;margin-left:8px;">Daily Report</span>
    </div>
    <p style="margin:0;font-size:20px;font-weight:700;color:#f8fafc;">${escapeHtml(businessName)}</p>
    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${today}</p>
  </div>

  <!-- Content -->
  <div style="background:#1B2A4A;padding:28px;border-left:1px solid rgba(212,168,67,0.2);border-right:1px solid rgba(212,168,67,0.2);">

    ${isQuietDay ? `
    <div style="text-align:center;padding:24px 0;">
      <p style="margin:0;font-size:16px;color:#f8fafc;">Quiet day \u2014 0 calls today.</p>
      <p style="margin:12px 0 0;font-size:14px;color:#94a3b8;">${escapeHtml(receptionistName)}'s keeping watch. Enjoy your evening, ${escapeHtml(ownerName)}!</p>
    </div>
    ` : `

    <!-- Stats Row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td width="25%" style="padding:8px;text-align:center;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#f8fafc;">${data.totalCalls}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Calls</p>
          </div>
        </td>
        <td width="25%" style="padding:8px;text-align:center;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#4ade80;">${data.callBreakdown.newLeads.length}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">New Leads</p>
          </div>
        </td>
        <td width="25%" style="padding:8px;text-align:center;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#fbbf24;">${data.appointmentsBooked}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Booked</p>
          </div>
        </td>
        <td width="25%" style="padding:8px;text-align:center;">
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px 8px;border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:28px;font-weight:800;color:#D4A843;">${data.pendingJobCards}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Pending</p>
          </div>
        </td>
      </tr>
    </table>

    ${data.callBreakdown.newLeads.length > 0 ? `
    <!-- New Leads Table -->
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#f8fafc;">New Leads</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
          <th style="padding:6px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;">Name</th>
          <th style="padding:6px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;">Job</th>
          <th style="padding:6px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;">Estimate</th>
          <th style="padding:6px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;">Status</th>
        </tr>
        ${leadsHtml}
      </table>
    </div>
    ` : ""}

    ${data.tomorrowAppointments.length > 0 ? `
    <!-- Tomorrow's Appointments -->
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#f8fafc;">Tomorrow's Appointments</p>
      ${appointmentsHtml}
    </div>
    ` : ""}

    ${data.actionItems.length > 0 ? `
    <!-- Action Items -->
    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#fbbf24;">Action Needed</p>
      ${actionItemsHtml}
    </div>
    ` : ""}

    ${data.estimatedRevenueCaptured && data.estimatedRevenueCaptured > 0 ? `
    <!-- Monthly Revenue -->
    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#f8fafc;">
        <span style="color:#4ade80;font-weight:600;">${escapeHtml(receptionistName)} has captured ~$${data.estimatedRevenueCaptured.toLocaleString()} in estimated job value this month.</span>
      </p>
    </div>
    ` : ""}

    `}
  </div>

  <!-- Footer -->
  <div style="background:linear-gradient(135deg,#1B2A4A 0%,#0f1729 100%);border-radius:0 0 16px 16px;padding:24px 28px 32px;text-align:center;border:1px solid rgba(212,168,67,0.2);border-top:none;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#D4A843;color:#0f1729;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
      View Job Cards &rarr;
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

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
