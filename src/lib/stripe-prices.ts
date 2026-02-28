/** Stripe price configuration for monthly and annual plans */

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_ID ?? "",
  annual: process.env.STRIPE_PRICE_ANNUAL ?? "",
} as const;

export type PlanType = "monthly" | "annual";

export const PLAN_DETAILS: Record<PlanType, {
  name: string;
  monthlyRate: number; // cents
  billingAmount: number; // cents charged per period
  billingInterval: "month" | "year";
  savings: number; // cents saved per year vs monthly
  label: string;
}> = {
  monthly: {
    name: "Professional",
    monthlyRate: 49700, // $497/mo
    billingAmount: 49700,
    billingInterval: "month",
    savings: 0,
    label: "$497/mo",
  },
  annual: {
    name: "Professional (Annual)",
    monthlyRate: 39700, // $397/mo effective
    billingAmount: 476400, // $4,764/year
    billingInterval: "year",
    savings: 120000, // $1,200 saved per year
    label: "$397/mo (billed annually)",
  },
};

export function getPriceId(plan: PlanType): string {
  return STRIPE_PRICES[plan];
}

export function getMrrForPlan(plan: PlanType): number {
  return PLAN_DETAILS[plan].monthlyRate;
}
