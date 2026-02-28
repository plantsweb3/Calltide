import { db } from "@/db";
import { servicePricing } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const UNIT_LABELS: Record<string, string> = {
  per_job: "per job",
  per_hour: "per hour",
  per_sqft: "per sq ft",
  per_unit: "per unit",
};

const UNIT_LABELS_ES: Record<string, string> = {
  per_job: "por trabajo",
  per_hour: "por hora",
  per_sqft: "por pie²",
  per_unit: "por unidad",
};

export async function buildPricingContext(businessId: string): Promise<string | null> {
  const prices = await db
    .select()
    .from(servicePricing)
    .where(
      and(
        eq(servicePricing.businessId, businessId),
        eq(servicePricing.isActive, true),
      ),
    );

  if (prices.length === 0) return null;

  const lines = prices.map((p) => {
    const unit = UNIT_LABELS[p.unit || "per_job"] || "per job";
    if (p.priceMin && p.priceMax) {
      return `- ${p.serviceName}: $${p.priceMin}–$${p.priceMax} ${unit}`;
    }
    if (p.priceMin) {
      return `- ${p.serviceName}: starting at $${p.priceMin} ${unit}`;
    }
    if (p.priceMax) {
      return `- ${p.serviceName}: up to $${p.priceMax} ${unit}`;
    }
    return `- ${p.serviceName}: contact for pricing`;
  });

  return lines.join("\n");
}

export function getUnitLabels(lang: "en" | "es" = "en") {
  return lang === "es" ? UNIT_LABELS_ES : UNIT_LABELS;
}
