import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { db } from "@/db";
import {
  businesses,
  calls,
  appointments,
  callQaScores,
  clientSuccessLog,
  npsResponses,
  referrals,
  churnRiskScores,
  agentConfig,
} from "@/db/schema";
import { eq, sql, desc, and, gte, lt, ne } from "drizzle-orm";
import { logAgentActivity } from "@/lib/agents";
import { reportError } from "@/lib/error-reporting";
import { canContactToday, logOutreach } from "@/lib/outreach";

import { BRAND_COLOR, COMPANY_ADDRESS, MARKETING_URL } from "@/lib/constants";

// ── Constants ──

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.calltide.app";
const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const CALL_MILESTONES = [50, 100, 250, 500, 1000];
const REVENUE_MILESTONES = [5_000, 10_000, 25_000, 50_000, 100_000];

// ── Exported HMAC helper (reused by NPS verification route) ──

export function generateNpsToken(businessId: string, score: number): string {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) throw new Error("CLIENT_AUTH_SECRET not configured");
  return crypto
    .createHmac("sha256", secret)
    .update(`${businessId}:${score}`)
    .digest("hex");
}

// ── Utility functions ──

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function scoreToGrade(avgScore: number): string {
  if (avgScore >= 90) return "A";
  if (avgScore >= 80) return "B";
  if (avgScore >= 70) return "C";
  if (avgScore >= 60) return "D";
  return "F";
}

function fmt$(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });
}

function pctChange(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? "+100%" : "0%";
  const pct = Math.round(((curr - prev) / prev) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  return new Resend(key);
}

function emailWrapper(content: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:${FONT_STACK};background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <img src="${MARKETING_URL}/images/logo.webp" alt="Calltide" style="height:24px;margin-bottom:24px;" />
  ${content}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
    <p>Calltide — AI Voice Agents for Local Businesses</p>
    <p style="margin-top:8px;">${COMPANY_ADDRESS}</p>
    <p style="margin-top:8px;">
      <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

function unsubUrl(email: string): string {
  return `${MARKETING_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
}

// ── Business type alias for readability ──

type Business = typeof businesses.$inferSelect;

// ── 1. First Week Report ──

async function generateFirstWeekReport(business: Business, now: Date): Promise<string> {
  const createdAt = new Date(business.createdAt);
  const weekEnd = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Calls in first 7 days
  const callRows = await db
    .select()
    .from(calls)
    .where(
      sql`${calls.businessId} = ${business.id} AND ${calls.createdAt} >= ${createdAt.toISOString()} AND ${calls.createdAt} < ${weekEnd.toISOString()}`,
    );

  const totalCalls = callRows.length;
  const completedCalls = callRows.filter((c) => c.status === "completed").length;

  // Appointments from those calls
  const [apptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      sql`${appointments.businessId} = ${business.id} AND ${appointments.createdAt} >= ${createdAt.toISOString()} AND ${appointments.createdAt} < ${weekEnd.toISOString()}`,
    );
  const appts = apptCount?.count ?? 0;

  // QA scores for first week
  const qaRows = await db
    .select({ score: callQaScores.score })
    .from(callQaScores)
    .where(
      and(
        eq(callQaScores.businessId, business.id),
        eq(callQaScores.isFirstWeek, true),
      ),
    );

  const avgQa = qaRows.length > 0
    ? Math.round(qaRows.reduce((sum, r) => sum + r.score, 0) / qaRows.length)
    : 0;
  const grade = qaRows.length > 0 ? scoreToGrade(avgQa) : "N/A";

  const avgJobValue = business.avgJobValue ?? 250;
  const estRevenue = completedCalls * avgJobValue;
  const isEn = business.defaultLanguage !== "es";

  const subject = isEn
    ? `Your First Week Report — ${business.name}`
    : `Su Reporte de la Primera Semana — ${business.name}`;

  const headline = isEn ? "Your First Week with Calltide" : "Su Primera Semana con Calltide";

  const gradeColor = grade === "A" ? "#22c55e" : grade === "B" ? "#3b82f6" : grade === "C" ? "#f59e0b" : "#ef4444";

  const body = isEn
    ? `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 16px;">${headline}</h2>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Here's how your AI receptionist performed during your first 7 days:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Total Calls</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:#0f172a;">${totalCalls}</td>
          </tr>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Completed Calls</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:#0f172a;">${completedCalls}</td>
          </tr>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Appointments Booked</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:${BRAND_COLOR};">${appts}</td>
          </tr>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Estimated Revenue</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:${BRAND_COLOR};">${fmt$(estRevenue)}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#64748b;font-size:14px;">QA Score</td>
            <td style="padding:12px;font-weight:700;font-size:18px;text-align:right;">
              <span style="color:${gradeColor};">${avgQa}/100 (${grade})</span>
            </td>
          </tr>
        </table>

        ${grade === "A" || grade === "B"
          ? `<p style="color:#475569;font-size:14px;line-height:1.7;">Maria is performing well on your calls. We'll keep monitoring quality and send you a monthly report going forward.</p>`
          : `<p style="color:#475569;font-size:14px;line-height:1.7;">We've identified some areas for improvement and are actively tuning Maria's responses. You'll see improvements reflected in your monthly reports.</p>`}
      </div>

      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        View Your Dashboard &rarr;
      </a>`
    : `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 16px;">${headline}</h2>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Así fue el rendimiento de su recepcionista IA durante sus primeros 7 días:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Total de Llamadas</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:#0f172a;">${totalCalls}</td>
          </tr>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Llamadas Completadas</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:#0f172a;">${completedCalls}</td>
          </tr>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Citas Agendadas</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:${BRAND_COLOR};">${appts}</td>
          </tr>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Ingresos Estimados</td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:18px;text-align:right;color:${BRAND_COLOR};">${fmt$(estRevenue)}</td>
          </tr>
          <tr>
            <td style="padding:12px;color:#64748b;font-size:14px;">Puntaje de Calidad</td>
            <td style="padding:12px;font-weight:700;font-size:18px;text-align:right;">
              <span style="color:${gradeColor};">${avgQa}/100 (${grade})</span>
            </td>
          </tr>
        </table>

        ${grade === "A" || grade === "B"
          ? `<p style="color:#475569;font-size:14px;line-height:1.7;">Maria está funcionando bien en sus llamadas. Seguiremos monitoreando la calidad y le enviaremos un reporte mensual.</p>`
          : `<p style="color:#475569;font-size:14px;line-height:1.7;">Hemos identificado áreas de mejora y estamos ajustando las respuestas de Maria. Verá mejoras reflejadas en sus reportes mensuales.</p>`}
      </div>

      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Ver Su Panel &rarr;
      </a>`;

  const email = business.ownerEmail;
  if (!email) return "no_email";

  const html = emailWrapper(body, unsubUrl(email));

  try {
    const resend = getResend();
    await resend.emails.send({
      from: "Calltide <success@calltide.app>",
      to: email,
      subject,
      html,
    });
  } catch (error) {
    reportError("Failed to send first week report", error, { businessId: business.id });
    return "email_failed";
  }

  // Log in clientSuccessLog
  await db.insert(clientSuccessLog).values({
    businessId: business.id,
    eventType: "first_week_report",
    eventData: { totalCalls, completedCalls, appointments: appts, avgQa, grade, estRevenue },
    emailSentAt: now.toISOString(),
  });

  // Update business QA fields
  await db
    .update(businesses)
    .set({
      onboardingQaGrade: grade !== "N/A" ? grade : null,
      onboardingQaCompleteAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
    .where(eq(businesses.id, business.id));

  await logAgentActivity({
    agentName: "success",
    actionType: "report_sent",
    targetId: business.id,
    targetType: "client",
    inputSummary: `First week report: ${business.name}`,
    outputSummary: `Calls: ${totalCalls}, QA: ${avgQa} (${grade}), Est rev: ${fmt$(estRevenue)}`,
  });

  return "first_week_report_sent";
}

// ── 2. Monthly Report ──

async function generateMonthlyReport(business: Business, now: Date): Promise<string> {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = thisMonthStart;

  // This month calls
  const [thisMonthCalls] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(
      sql`${calls.businessId} = ${business.id} AND ${calls.createdAt} >= ${thisMonthStart.toISOString()}`,
    );

  // Last month calls
  const [lastMonthCalls] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(
      sql`${calls.businessId} = ${business.id} AND ${calls.createdAt} >= ${lastMonthStart.toISOString()} AND ${calls.createdAt} < ${lastMonthEnd.toISOString()}`,
    );

  // This month appointments
  const [thisMonthAppts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      sql`${appointments.businessId} = ${business.id} AND ${appointments.createdAt} >= ${thisMonthStart.toISOString()}`,
    );

  // Last month appointments
  const [lastMonthAppts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      sql`${appointments.businessId} = ${business.id} AND ${appointments.createdAt} >= ${lastMonthStart.toISOString()} AND ${appointments.createdAt} < ${lastMonthEnd.toISOString()}`,
    );

  const avgJobValue = business.avgJobValue ?? 250;
  const thisRev = (thisMonthAppts?.count ?? 0) * avgJobValue;
  const lastRev = (lastMonthAppts?.count ?? 0) * avgJobValue;
  const callChange = pctChange(thisMonthCalls?.count ?? 0, lastMonthCalls?.count ?? 0);
  const apptChange = pctChange(thisMonthAppts?.count ?? 0, lastMonthAppts?.count ?? 0);
  const revChange = pctChange(thisRev, lastRev);

  const isEn = business.defaultLanguage !== "es";
  const refCode = business.referralCode ?? "";

  const subject = isEn
    ? `Monthly Report — ${business.name}`
    : `Reporte Mensual — ${business.name}`;

  const monthNames = isEn
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const monthLabel = monthNames[now.getMonth()];

  const body = isEn
    ? `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">${monthLabel} Report</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Here's how your AI receptionist performed this month compared to last month.</p>

        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Metric</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">This Month</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Last Month</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">Calls</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${thisMonthCalls?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${lastMonthCalls?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:${callChange.startsWith("+") ? BRAND_COLOR : "#ef4444"};">${callChange}</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">Appointments</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${thisMonthAppts?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${lastMonthAppts?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:${apptChange.startsWith("+") ? BRAND_COLOR : "#ef4444"};">${apptChange}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#0f172a;font-size:14px;">Est. Revenue</td>
              <td style="padding:12px;text-align:right;font-weight:700;color:${BRAND_COLOR};">${fmt$(thisRev)}</td>
              <td style="padding:12px;text-align:right;color:#64748b;">${fmt$(lastRev)}</td>
              <td style="padding:12px;text-align:right;font-weight:600;color:${revChange.startsWith("+") ? BRAND_COLOR : "#ef4444"};">${revChange}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        View Full Dashboard &rarr;
      </a>

      ${refCode ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-top:24px;text-align:center;">
        <p style="color:#166534;font-size:14px;margin:0 0 8px;"><strong>Refer a friend and earn $497 off your next month</strong></p>
        <p style="color:#166534;font-size:13px;margin:0;">Share your code: <strong style="font-size:16px;letter-spacing:1px;">${refCode}</strong></p>
        <p style="color:#166534;font-size:12px;margin:8px 0 0;"><a href="${MARKETING_URL}/?ref=${refCode}" style="color:${BRAND_COLOR};text-decoration:underline;">${MARKETING_URL}/?ref=${refCode}</a></p>
      </div>` : ""}`
    : `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">Reporte de ${monthLabel}</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Así fue el rendimiento de su recepcionista IA este mes comparado con el mes pasado.</p>

        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Métrica</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Este Mes</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Mes Pasado</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Cambio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">Llamadas</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${thisMonthCalls?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${lastMonthCalls?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:${callChange.startsWith("+") ? BRAND_COLOR : "#ef4444"};">${callChange}</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">Citas</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${thisMonthAppts?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${lastMonthAppts?.count ?? 0}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:${apptChange.startsWith("+") ? BRAND_COLOR : "#ef4444"};">${apptChange}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#0f172a;font-size:14px;">Ingresos Est.</td>
              <td style="padding:12px;text-align:right;font-weight:700;color:${BRAND_COLOR};">${fmt$(thisRev)}</td>
              <td style="padding:12px;text-align:right;color:#64748b;">${fmt$(lastRev)}</td>
              <td style="padding:12px;text-align:right;font-weight:600;color:${revChange.startsWith("+") ? BRAND_COLOR : "#ef4444"};">${revChange}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Ver Panel Completo &rarr;
      </a>

      ${refCode ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-top:24px;text-align:center;">
        <p style="color:#166534;font-size:14px;margin:0 0 8px;"><strong>Refiera a un amigo y gane $497 de descuento en su próximo mes</strong></p>
        <p style="color:#166534;font-size:13px;margin:0;">Comparta su código: <strong style="font-size:16px;letter-spacing:1px;">${refCode}</strong></p>
        <p style="color:#166534;font-size:12px;margin:8px 0 0;"><a href="${MARKETING_URL}/?ref=${refCode}" style="color:${BRAND_COLOR};text-decoration:underline;">${MARKETING_URL}/?ref=${refCode}</a></p>
      </div>` : ""}`;

  const email = business.ownerEmail;
  if (!email) return "no_email";

  const html = emailWrapper(body, unsubUrl(email));

  try {
    const resend = getResend();
    await resend.emails.send({
      from: "Calltide <success@calltide.app>",
      to: email,
      subject,
      html,
    });
  } catch (error) {
    reportError("Failed to send monthly report", error, { businessId: business.id });
    return "email_failed";
  }

  await db.insert(clientSuccessLog).values({
    businessId: business.id,
    eventType: "monthly_report",
    eventData: {
      month: monthLabel,
      callsThisMonth: thisMonthCalls?.count ?? 0,
      callsLastMonth: lastMonthCalls?.count ?? 0,
      apptsThisMonth: thisMonthAppts?.count ?? 0,
      apptsLastMonth: lastMonthAppts?.count ?? 0,
      revenueThisMonth: thisRev,
      revenueLastMonth: lastRev,
    },
    emailSentAt: now.toISOString(),
  });

  await logAgentActivity({
    agentName: "success",
    actionType: "report_sent",
    targetId: business.id,
    targetType: "client",
    inputSummary: `Monthly report: ${business.name}`,
    outputSummary: `Calls: ${thisMonthCalls?.count ?? 0} (${callChange}), Rev: ${fmt$(thisRev)} (${revChange})`,
  });

  return "monthly_report_sent";
}

// ── 3. NPS Survey ──

async function sendNpsSurvey(business: Business, now: Date): Promise<string> {
  const email = business.ownerEmail;
  if (!email) return "no_email";

  const isEn = business.defaultLanguage !== "es";

  const subject = isEn
    ? `Quick question — how are we doing? | ${business.name}`
    : `Pregunta rápida — ¿cómo lo estamos haciendo? | ${business.name}`;

  // Build score buttons
  const scoreButtons = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    const token = generateNpsToken(business.id, score);
    const url = `${BASE_URL}/api/success/nps?businessId=${business.id}&score=${score}&token=${token}`;
    const bgColor = score <= 6 ? "#fee2e2" : score <= 8 ? "#fef9c3" : "#dcfce7";
    const textColor = score <= 6 ? "#dc2626" : score <= 8 ? "#ca8a04" : "#16a34a";
    const borderColor = score <= 6 ? "#fca5a5" : score <= 8 ? "#fde047" : "#86efac";
    return `<a href="${url}" style="display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;background:${bgColor};color:${textColor};border:1px solid ${borderColor};border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin:0 3px;">${score}</a>`;
  }).join("");

  const body = isEn
    ? `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">How likely are you to recommend Calltide?</h2>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">Hi ${business.ownerName.split(" ")[0]}, we'd love your honest feedback. On a scale of 1-10, how likely are you to recommend Calltide to another business owner?</p>

        <div style="text-align:center;margin:24px 0;">
          ${scoreButtons}
        </div>

        <div style="display:flex;justify-content:space-between;margin:0 3px;">
          <span style="color:#94a3b8;font-size:12px;">Not likely</span>
          <span style="color:#94a3b8;font-size:12px;">Very likely</span>
        </div>

        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0;text-align:center;">Just click a number — takes 2 seconds.</p>
      </div>`
    : `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">¿Qué tan probable es que recomiende Calltide?</h2>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">Hola ${business.ownerName.split(" ")[0]}, nos encantaría su opinión honesta. En una escala de 1-10, ¿qué tan probable es que recomiende Calltide a otro dueño de negocio?</p>

        <div style="text-align:center;margin:24px 0;">
          ${scoreButtons}
        </div>

        <div style="display:flex;justify-content:space-between;margin:0 3px;">
          <span style="color:#94a3b8;font-size:12px;">Poco probable</span>
          <span style="color:#94a3b8;font-size:12px;">Muy probable</span>
        </div>

        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0;text-align:center;">Solo haga clic en un número — toma 2 segundos.</p>
      </div>`;

  const html = emailWrapper(body, unsubUrl(email));

  try {
    const resend = getResend();
    await resend.emails.send({
      from: "Calltide <success@calltide.app>",
      to: email,
      subject,
      html,
    });
  } catch (error) {
    reportError("Failed to send NPS survey", error, { businessId: business.id });
    return "email_failed";
  }

  await db.insert(clientSuccessLog).values({
    businessId: business.id,
    eventType: "nps_survey_sent",
    eventData: { sentAt: now.toISOString() },
    emailSentAt: now.toISOString(),
  });

  await logAgentActivity({
    agentName: "success",
    actionType: "nps_sent",
    targetId: business.id,
    targetType: "client",
    inputSummary: `NPS survey sent: ${business.name}`,
    outputSummary: `Survey emailed to ${email}`,
  });

  return "nps_survey_sent";
}

// ── 4. Milestone Email ──

async function sendMilestoneEmail(business: Business, milestone: string, now: Date): Promise<string> {
  const email = business.ownerEmail;
  if (!email) return "no_email";

  const isEn = business.defaultLanguage !== "es";
  const refCode = business.referralCode ?? "";

  const subject = isEn
    ? `Milestone reached! ${milestone} | ${business.name}`
    : `¡Hito alcanzado! ${milestone} | ${business.name}`;

  const body = isEn
    ? `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">&#127942;</div>
        <h2 style="color:#0f172a;margin:0 0 8px;">Congratulations!</h2>
        <p style="color:${BRAND_COLOR};font-size:24px;font-weight:800;margin:0 0 16px;">${milestone}</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;">
          ${business.ownerName.split(" ")[0]}, your business just hit an incredible milestone with Calltide.
          This is a testament to the growth you're driving.
        </p>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Keep up the amazing work!</p>
      </div>

      ${refCode ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-top:16px;text-align:center;">
        <p style="color:#166534;font-size:14px;margin:0 0 8px;"><strong>Know someone who could use their own AI receptionist?</strong></p>
        <p style="color:#166534;font-size:13px;margin:0;">Share your referral code and earn $497 off your next month:</p>
        <p style="color:${BRAND_COLOR};font-size:20px;font-weight:800;letter-spacing:2px;margin:12px 0 4px;">${refCode}</p>
        <p style="font-size:12px;margin:0;"><a href="${MARKETING_URL}/?ref=${refCode}" style="color:${BRAND_COLOR};text-decoration:underline;">${MARKETING_URL}/?ref=${refCode}</a></p>
      </div>` : ""}`
    : `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">&#127942;</div>
        <h2 style="color:#0f172a;margin:0 0 8px;">¡Felicidades!</h2>
        <p style="color:${BRAND_COLOR};font-size:24px;font-weight:800;margin:0 0 16px;">${milestone}</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;">
          ${business.ownerName.split(" ")[0]}, su negocio acaba de alcanzar un hito increíble con Calltide.
          Esto es un testimonio del crecimiento que está impulsando.
        </p>
        <p style="color:#475569;font-size:15px;line-height:1.7;">¡Siga con el excelente trabajo!</p>
      </div>

      ${refCode ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-top:16px;text-align:center;">
        <p style="color:#166534;font-size:14px;margin:0 0 8px;"><strong>¿Conoce a alguien que necesite su propia recepcionista IA?</strong></p>
        <p style="color:#166534;font-size:13px;margin:0;">Comparta su código de referido y gane $497 de descuento:</p>
        <p style="color:${BRAND_COLOR};font-size:20px;font-weight:800;letter-spacing:2px;margin:12px 0 4px;">${refCode}</p>
        <p style="font-size:12px;margin:0;"><a href="${MARKETING_URL}/?ref=${refCode}" style="color:${BRAND_COLOR};text-decoration:underline;">${MARKETING_URL}/?ref=${refCode}</a></p>
      </div>` : ""}`;

  const html = emailWrapper(body, unsubUrl(email));

  try {
    const resend = getResend();
    await resend.emails.send({
      from: "Calltide <success@calltide.app>",
      to: email,
      subject,
      html,
    });
  } catch (error) {
    reportError("Failed to send milestone email", error, { businessId: business.id });
    return "email_failed";
  }

  await db.insert(clientSuccessLog).values({
    businessId: business.id,
    eventType: "milestone",
    eventData: { milestone },
    emailSentAt: now.toISOString(),
  });

  await logAgentActivity({
    agentName: "success",
    actionType: "milestone",
    targetId: business.id,
    targetType: "client",
    inputSummary: `Milestone: ${milestone} for ${business.name}`,
    outputSummary: `Milestone email sent: ${milestone}`,
  });

  return "milestone_sent";
}

// ── 5. Comprehensive Review (Day 90, 180, 365) ──

async function sendComprehensiveReview(business: Business, dayMark: number, now: Date): Promise<string> {
  const email = business.ownerEmail;
  if (!email) return "no_email";

  const isEn = business.defaultLanguage !== "es";

  // Total lifetime stats
  const [totalCallCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(eq(calls.businessId, business.id));

  const [totalApptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.businessId, business.id));

  const avgJobValue = business.avgJobValue ?? 250;
  const totalRevenue = (totalApptCount?.count ?? 0) * avgJobValue;

  const periodLabel = isEn
    ? dayMark === 90 ? "90-Day" : dayMark === 180 ? "6-Month" : "1-Year"
    : dayMark === 90 ? "90 Días" : dayMark === 180 ? "6 Meses" : "1 Año";

  const subject = isEn
    ? `Your ${periodLabel} Review — ${business.name}`
    : `Su Revisión de ${periodLabel} — ${business.name}`;

  const body = isEn
    ? `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">Your ${periodLabel} Review</h2>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Here's a snapshot of everything Calltide has done for ${business.name} over the past ${dayMark} days:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Total Calls Handled</td>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:20px;text-align:right;color:#0f172a;">${totalCallCount?.count ?? 0}</td>
          </tr>
          <tr>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Total Appointments</td>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:20px;text-align:right;color:${BRAND_COLOR};">${totalApptCount?.count ?? 0}</td>
          </tr>
          <tr>
            <td style="padding:14px;color:#64748b;font-size:14px;">Estimated Revenue Generated</td>
            <td style="padding:14px;font-weight:700;font-size:20px;text-align:right;color:${BRAND_COLOR};">${fmt$(totalRevenue)}</td>
          </tr>
        </table>

        <p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px;">
          Thank you for trusting Calltide with your business. We're committed to helping you grow.
        </p>
      </div>

      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        View Your Dashboard &rarr;
      </a>`
    : `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 8px;">Su Revisión de ${periodLabel}</h2>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Aquí hay un resumen de todo lo que Calltide ha hecho por ${business.name} en los últimos ${dayMark} días:</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Total de Llamadas</td>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:20px;text-align:right;color:#0f172a;">${totalCallCount?.count ?? 0}</td>
          </tr>
          <tr>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">Total de Citas</td>
            <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:20px;text-align:right;color:${BRAND_COLOR};">${totalApptCount?.count ?? 0}</td>
          </tr>
          <tr>
            <td style="padding:14px;color:#64748b;font-size:14px;">Ingresos Estimados Generados</td>
            <td style="padding:14px;font-weight:700;font-size:20px;text-align:right;color:${BRAND_COLOR};">${fmt$(totalRevenue)}</td>
          </tr>
        </table>

        <p style="color:#475569;font-size:14px;line-height:1.7;margin-top:16px;">
          Gracias por confiar en Calltide con su negocio. Estamos comprometidos a ayudarle a crecer.
        </p>
      </div>

      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
        Ver Su Panel &rarr;
      </a>`;

  const html = emailWrapper(body, unsubUrl(email));

  try {
    const resend = getResend();
    await resend.emails.send({
      from: "Calltide <success@calltide.app>",
      to: email,
      subject,
      html,
    });
  } catch (error) {
    reportError(`Failed to send ${dayMark}-day review`, error, { businessId: business.id });
    return "email_failed";
  }

  await db.insert(clientSuccessLog).values({
    businessId: business.id,
    eventType: "quarterly_review",
    eventData: { dayMark, totalCalls: totalCallCount?.count ?? 0, totalAppts: totalApptCount?.count ?? 0, totalRevenue },
    emailSentAt: now.toISOString(),
  });

  await logAgentActivity({
    agentName: "success",
    actionType: "report_sent",
    targetId: business.id,
    targetType: "client",
    inputSummary: `${dayMark}-day review: ${business.name}`,
    outputSummary: `Calls: ${totalCallCount?.count ?? 0}, Rev: ${fmt$(totalRevenue)}`,
  });

  return `${dayMark}_day_review_sent`;
}

// ── 6. Health Score Calculator ──

async function calculateHealthScore(business: Business): Promise<number> {
  const now = new Date();
  let score = 0;

  // 1. Call volume trend: this week vs 4-week avg (+25, +10, or 0)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();

  const [thisWeekCalls] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(sql`${calls.businessId} = ${business.id} AND ${calls.createdAt} >= ${oneWeekAgo}`);

  const [fourWeekCalls] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(
      sql`${calls.businessId} = ${business.id} AND ${calls.createdAt} >= ${fourWeeksAgo} AND ${calls.createdAt} < ${oneWeekAgo}`,
    );

  const weeklyCount = thisWeekCalls?.count ?? 0;
  const fourWeekAvg = (fourWeekCalls?.count ?? 0) / 3; // 3 weeks in the preceding period

  if (fourWeekAvg === 0 || weeklyCount >= fourWeekAvg) {
    score += 25; // stable or up
  } else {
    const dropPct = ((fourWeekAvg - weeklyCount) / fourWeekAvg) * 100;
    if (dropPct <= 25) score += 25;
    else if (dropPct <= 50) score += 10;
    // > 50% drop = 0 points
  }

  // 2. Last QA score (+20, +10, or 0)
  const [latestQa] = await db
    .select({ score: callQaScores.score })
    .from(callQaScores)
    .where(eq(callQaScores.businessId, business.id))
    .orderBy(desc(callQaScores.createdAt))
    .limit(1);

  if (latestQa) {
    if (latestQa.score > 80) score += 20;
    else if (latestQa.score >= 70) score += 10;
  }

  // 3. Last NPS (+20, +10, or 0)
  const [latestNps] = await db
    .select({ score: npsResponses.score })
    .from(npsResponses)
    .where(eq(npsResponses.businessId, business.id))
    .orderBy(desc(npsResponses.createdAt))
    .limit(1);

  if (latestNps) {
    if (latestNps.score >= 9) score += 20;
    else if (latestNps.score >= 7) score += 10;
  }

  // 4. Dashboard login this week: assume yes (+15)
  score += 15;

  // 5. Payment current: assume yes (+20)
  score += 20;

  // Update business health score
  await db
    .update(businesses)
    .set({
      healthScore: score,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(businesses.id, business.id));

  await logAgentActivity({
    agentName: "success",
    actionType: "health_score_updated",
    targetId: business.id,
    targetType: "client",
    inputSummary: `Health score: ${business.name}`,
    outputSummary: `Score: ${score}/100 (calls: ${weeklyCount}, qa: ${latestQa?.score ?? "none"}, nps: ${latestNps?.score ?? "none"})`,
  });

  return score;
}

// ── 7. Milestone Checker ──

async function checkMilestones(business: Business, now: Date): Promise<string[]> {
  const results: string[] = [];

  // Get existing milestone events for this business
  const existingMilestones = await db
    .select({ eventData: clientSuccessLog.eventData })
    .from(clientSuccessLog)
    .where(
      and(
        eq(clientSuccessLog.businessId, business.id),
        eq(clientSuccessLog.eventType, "milestone"),
      ),
    );

  const sentMilestones = new Set(
    existingMilestones.map((m) => (m.eventData as Record<string, unknown>)?.milestone as string).filter(Boolean),
  );

  // Total calls
  const [callCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(eq(calls.businessId, business.id));

  const totalCalls = callCount?.count ?? 0;

  for (const threshold of CALL_MILESTONES) {
    const label = `${threshold} Calls`;
    if (totalCalls >= threshold && !sentMilestones.has(label)) {
      const result = await sendMilestoneEmail(business, label, now);
      results.push(`milestone_${label}: ${result}`);
    }
  }

  // Estimated revenue (appointments * avgJobValue)
  const [apptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.businessId, business.id));

  const totalAppts = apptCount?.count ?? 0;
  const avgJobValue = business.avgJobValue ?? 250;
  const estimatedRevenue = totalAppts * avgJobValue;

  for (const threshold of REVENUE_MILESTONES) {
    const label = `${fmt$(threshold)} Revenue`;
    if (estimatedRevenue >= threshold && !sentMilestones.has(label)) {
      const result = await sendMilestoneEmail(business, label, now);
      results.push(`milestone_${label}: ${result}`);
    }
  }

  return results;
}

// ── Main processor for a single business ──

async function processBusinessSuccess(business: Business, now: Date): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { businessId: business.id, name: business.name };
  const age = daysBetween(business.createdAt, now);

  // Skip email-sending actions if already contacted today
  const canContact = await canContactToday(business.id);

  try {
    // a. DAY 7: First week report
    if (age === 7 && !business.onboardingQaCompleteAt && canContact) {
      result.firstWeek = await generateFirstWeekReport(business, now);
      await logOutreach(business.id, "success_agent", "email");
    }

    // b. DAY 30: Monthly report + NPS survey
    if (age === 30 && canContact) {
      result.monthlyReport = await generateMonthlyReport(business, now);
      result.npsSurvey = await sendNpsSurvey(business, now);
      await logOutreach(business.id, "success_agent", "email");
    }

    // c. FIRST OF MONTH: Monthly report for clients active 30+ days (skip if already sent for day-30)
    if (now.getDate() === 1 && age > 30 && canContact) {
      result.monthlyReport = await generateMonthlyReport(business, now);
      await logOutreach(business.id, "success_agent", "email");
    }

    // d. DAY 90, 180, 365: Comprehensive review
    if ((age === 90 || age === 180 || age === 365) && canContact) {
      result.comprehensiveReview = await sendComprehensiveReview(business, age, now);
      result.npsSurvey = await sendNpsSurvey(business, now);
      await logOutreach(business.id, "success_agent", "email");
    }

    // e. MILESTONES: Check call/revenue thresholds
    if (canContact) {
      const milestoneResults = await checkMilestones(business, now);
      if (milestoneResults.length > 0) {
        result.milestones = milestoneResults;
        await logOutreach(business.id, "success_agent", "email");
      }
    }

    // f. HEALTH SCORE: Calculate for every client daily
    result.healthScore = await calculateHealthScore(business);
  } catch (error) {
    reportError(`Success agent error for ${business.name}`, error, { businessId: business.id });
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

// ── GET Handler (cron-triggered) ──

/**
 * GET /api/agents/success
 *
 * Cron-triggered client success lifecycle agent.
 * Runs daily at 9 AM CT (15:00 UTC).
 * Schedule: 0 15 * * *
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

  // Check agentConfig — if disabled, return 200
  const [config] = await db
    .select()
    .from(agentConfig)
    .where(eq(agentConfig.agentName, "success"))
    .limit(1);

  if (config && config.enabled === false) {
    return NextResponse.json({ message: "Success agent is disabled" }, { status: 200 });
  }

  const now = new Date();

  // Get all active businesses
  const activeClients = await db
    .select()
    .from(businesses)
    .where(eq(businesses.active, true));

  const results = [];

  for (const client of activeClients) {
    const clientResult = await processBusinessSuccess(client, now);
    results.push(clientResult);
  }

  // Update agentConfig.lastRunAt
  if (config) {
    await db
      .update(agentConfig)
      .set({ lastRunAt: now.toISOString(), updatedAt: now.toISOString() })
      .where(eq(agentConfig.id, config.id));
  } else {
    // Create config entry if it doesn't exist
    await db.insert(agentConfig).values({
      agentName: "success",
      enabled: true,
      cronExpression: "0 15 * * *",
      lastRunAt: now.toISOString(),
    });
  }

  return NextResponse.json({ processed: results.length, results });
}

// ── POST Handler (manual trigger) ──

/**
 * POST /api/agents/success
 *
 * Manually trigger success lifecycle checks for a specific business.
 * Body: { businessId: string }
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessId } = body;

  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const [client] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const now = new Date();
  const result = await processBusinessSuccess(client, now);

  return NextResponse.json(result);
}
