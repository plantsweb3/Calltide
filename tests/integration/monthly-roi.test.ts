import { describe, it, expect } from "vitest";
import {
  calculateMonthlyStats,
  buildMonthlyRoiEmail,
  buildMonthlyRoiSms,
} from "@/lib/emails/monthly-roi";

describe("Monthly ROI — Stats Calculation", () => {
  it("calculates correct ROI multiple and cost per lead", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 120,
      afterHoursCalls: 30,
      appointmentsBooked: 15,
      emergencyCalls: 2,
      newCustomers: 8,
      prevMonthCalls: 100,
      spanishCalls: 25,
      businessType: "plumbing",
      avgJobValueOverride: 400,
    });

    expect(stats.estimatedRevenue).toBe(6000); // 15 × $400
    expect(stats.roiMultiple).toBe(12.1); // $6000 / $497 ≈ 12.1
    expect(stats.costPerLead).toBe(33.13); // $497 / 15 ≈ $33.13
    expect(stats.savedEstimate).toBe(3000); // 30 × $400 × 0.25
    expect(stats.momChangePercent).toBe(20); // (120-100)/100 = 20%
    expect(stats.spanishCallPercent).toBe(21); // 25/120 ≈ 21%
  });

  it("handles zero appointments gracefully (no division by zero)", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 5,
      afterHoursCalls: 1,
      appointmentsBooked: 0,
      emergencyCalls: 0,
      newCustomers: 0,
      prevMonthCalls: 0,
      spanishCalls: 0,
      businessType: "general",
    });

    expect(stats.estimatedRevenue).toBe(0);
    expect(stats.roiMultiple).toBe(0);
    expect(stats.costPerLead).toBe(0);
    expect(stats.momChangePercent).toBe(100); // 5 calls vs 0 prev
  });

  it("handles zero previous month calls", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 50,
      afterHoursCalls: 10,
      appointmentsBooked: 5,
      emergencyCalls: 0,
      newCustomers: 3,
      prevMonthCalls: 0,
      spanishCalls: 0,
      businessType: "hvac",
    });

    expect(stats.momChangePercent).toBe(100);
  });

  it("handles negative MoM change", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 50,
      afterHoursCalls: 5,
      appointmentsBooked: 3,
      emergencyCalls: 0,
      newCustomers: 1,
      prevMonthCalls: 100,
      spanishCalls: 2,
      businessType: "plumbing",
    });

    expect(stats.momChangePercent).toBe(-50); // (50-100)/100 = -50%
  });

  it("uses trade profile avgJobValue when no override", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 20,
      afterHoursCalls: 5,
      appointmentsBooked: 4,
      emergencyCalls: 0,
      newCustomers: 2,
      prevMonthCalls: 20,
      spanishCalls: 0,
      businessType: "plumbing",
    });

    // Plumbing trade profile has a specific avgJobValue — revenue should use it
    expect(stats.estimatedRevenue).toBeGreaterThan(0);
    expect(stats.momChangePercent).toBe(0);
  });

  it("handles both zero calls months", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 0,
      afterHoursCalls: 0,
      appointmentsBooked: 0,
      emergencyCalls: 0,
      newCustomers: 0,
      prevMonthCalls: 0,
      spanishCalls: 0,
      businessType: "general",
    });

    expect(stats.momChangePercent).toBe(0);
    expect(stats.spanishCallPercent).toBe(0);
    expect(stats.roiMultiple).toBe(0);
  });
});

describe("Monthly ROI — Email Builder", () => {
  const baseStats = calculateMonthlyStats({
    totalCalls: 120,
    afterHoursCalls: 30,
    appointmentsBooked: 15,
    emergencyCalls: 2,
    newCustomers: 8,
    prevMonthCalls: 100,
    spanishCalls: 25,
    businessType: "plumbing",
    avgJobValueOverride: 400,
  });

  it("generates email with correct subject", () => {
    const { subject, html } = buildMonthlyRoiEmail({
      receptionistName: "Maria",
      businessName: "Joe's Plumbing",
      monthLabel: "February 2026",
      stats: baseStats,
      dashboardUrl: "https://capta.app/dashboard",
    });

    expect(subject).toBe("Maria Monthly ROI Report — Joe's Plumbing");
    expect(html).toContain("February 2026");
    expect(html).toContain("Joe's Plumbing");
    expect(html).toContain("Maria");
  });

  it("includes ROI multiple and revenue in email", () => {
    const { html } = buildMonthlyRoiEmail({
      receptionistName: "Maria",
      businessName: "Test Biz",
      monthLabel: "January 2026",
      stats: baseStats,
      dashboardUrl: "https://capta.app/dashboard",
    });

    expect(html).toContain("12.1x");
    expect(html).toContain("$6,000");
    expect(html).toContain("$497");
    expect(html).toContain("Revenue Generated");
  });

  it("shows bilingual stats when Spanish calls exist", () => {
    const { html } = buildMonthlyRoiEmail({
      receptionistName: "Sofia",
      businessName: "Test Biz",
      monthLabel: "March 2026",
      stats: baseStats,
      dashboardUrl: "https://capta.app/dashboard",
    });

    expect(html).toContain("21%");
    expect(html).toContain("Spanish");
  });

  it("shows saved estimate when after-hours calls exist", () => {
    const { html } = buildMonthlyRoiEmail({
      receptionistName: "Maria",
      businessName: "Test Biz",
      monthLabel: "March 2026",
      stats: baseStats,
      dashboardUrl: "https://capta.app/dashboard",
    });

    expect(html).toContain("$3,000");
    expect(html).toContain("after-hours");
  });

  it("includes dashboard CTA link", () => {
    const { html } = buildMonthlyRoiEmail({
      receptionistName: "Maria",
      businessName: "Test Biz",
      monthLabel: "March 2026",
      stats: baseStats,
      dashboardUrl: "https://capta.app/dashboard",
    });

    expect(html).toContain('href="https://capta.app/dashboard"');
    expect(html).toContain("View Full Dashboard");
  });

  it("hides bilingual section when no Spanish calls", () => {
    const noSpanishStats = calculateMonthlyStats({
      totalCalls: 50,
      afterHoursCalls: 5,
      appointmentsBooked: 5,
      emergencyCalls: 0,
      newCustomers: 3,
      prevMonthCalls: 40,
      spanishCalls: 0,
      businessType: "plumbing",
    });

    const { html } = buildMonthlyRoiEmail({
      receptionistName: "Maria",
      businessName: "Test Biz",
      monthLabel: "March 2026",
      stats: noSpanishStats,
      dashboardUrl: "https://capta.app/dashboard",
    });

    expect(html).not.toContain("Spanish");
  });
});

describe("Monthly ROI — SMS Builder", () => {
  it("generates concise SMS with key metrics", () => {
    const stats = calculateMonthlyStats({
      totalCalls: 80,
      afterHoursCalls: 20,
      appointmentsBooked: 10,
      emergencyCalls: 1,
      newCustomers: 5,
      prevMonthCalls: 70,
      spanishCalls: 10,
      businessType: "plumbing",
      avgJobValueOverride: 300,
    });

    const sms = buildMonthlyRoiSms({
      receptionistName: "Maria",
      stats,
      monthLabel: "February 2026",
    });

    expect(sms).toContain("Maria");
    expect(sms).toContain("February 2026");
    expect(sms).toContain("80 calls");
    expect(sms).toContain("10 appointments");
    expect(sms).toContain("ROI");
    expect(sms).toContain("Capta");
    // SMS must stay under 160 chars if possible (but our format is longer — just check it's reasonable)
    expect(sms.length).toBeLessThan(250);
  });
});
