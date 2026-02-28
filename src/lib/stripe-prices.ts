/** Stripe price configuration for monthly and annual plans */

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_ID ?? "",
  annual: process.env.STRIPE_PRICE_ANNUAL ?? "",
  additionalLocationMonthly: process.env.STRIPE_PRICE_ADDITIONAL_LOCATION ?? "",
  additionalLocationAnnual: process.env.STRIPE_PRICE_ADDITIONAL_LOCATION_ANNUAL ?? "",
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

export const LOCATION_PRICING: Record<PlanType, {
  monthlyRate: number;
  billingAmount: number;
  label: string;
}> = {
  monthly: {
    monthlyRate: 19700, // $197/mo
    billingAmount: 19700,
    label: "$197/mo per location",
  },
  annual: {
    monthlyRate: 15700, // $157/mo effective
    billingAmount: 188400, // $1,884/year
    label: "$157/mo per location (billed annually)",
  },
};

export function getPriceId(plan: PlanType): string {
  return STRIPE_PRICES[plan];
}

export function getLocationPriceId(plan: PlanType): string {
  return plan === "annual"
    ? STRIPE_PRICES.additionalLocationAnnual
    : STRIPE_PRICES.additionalLocationMonthly;
}

export function getMrrForPlan(plan: PlanType): number {
  return PLAN_DETAILS[plan].monthlyRate;
}

export function getLocationMrr(plan: PlanType): number {
  return LOCATION_PRICING[plan].monthlyRate;
}
