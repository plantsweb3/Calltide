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

// ── Pricing justification (trade-specific factors) ──

interface PricingFactor {
  en: string;
  es: string;
}

const GENERIC_FACTORS: PricingFactor[] = [
  { en: "the scope and complexity of the work", es: "el alcance y complejidad del trabajo" },
  { en: "parts and materials needed", es: "las piezas y materiales necesarios" },
  { en: "time of service (after-hours may cost more)", es: "la hora del servicio (fuera de horario puede costar más)" },
];

const TRADE_FACTORS: Record<string, PricingFactor[]> = {
  hvac: [
    { en: "the unit type and size (tonnage)", es: "el tipo y tamaño de la unidad (tonelaje)" },
    { en: "refrigerant type needed", es: "el tipo de refrigerante necesario" },
    { en: "whether ductwork modifications are required", es: "si se necesitan modificaciones a los ductos" },
  ],
  plumbing: [
    { en: "the location and accessibility of the pipe or fixture", es: "la ubicación y accesibilidad de la tubería o accesorio" },
    { en: "whether excavation or wall access is needed", es: "si se necesita excavación o acceso a la pared" },
    { en: "pipe material (copper, PEX, PVC)", es: "el material de la tubería (cobre, PEX, PVC)" },
  ],
  electrical: [
    { en: "the amperage and panel capacity", es: "el amperaje y capacidad del panel" },
    { en: "whether permits and inspections are required", es: "si se necesitan permisos e inspecciones" },
    { en: "wiring type and age of the electrical system", es: "el tipo de cableado y antigüedad del sistema eléctrico" },
  ],
  roofing: [
    { en: "roof size and pitch (steeper roofs cost more)", es: "el tamaño y pendiente del techo (techos más inclinados cuestan más)" },
    { en: "material choice (shingles, metal, tile)", es: "el material elegido (tejas, metal, teja de barro)" },
    { en: "whether a tear-off of old roofing is needed", es: "si se necesita remover el techo viejo" },
  ],
  general_contractor: [
    { en: "project scope and square footage", es: "el alcance del proyecto y los pies cuadrados" },
    { en: "permits and code requirements", es: "permisos y requisitos de código" },
    { en: "subcontractor trades involved", es: "los subcontratistas involucrados" },
  ],
  restoration: [
    { en: "the type and extent of damage (water, fire, mold)", es: "el tipo y extensión del daño (agua, fuego, moho)" },
    { en: "whether demolition or containment is needed", es: "si se necesita demolición o contención" },
  ],
  landscaping: [
    { en: "lot size and terrain difficulty", es: "el tamaño del terreno y dificultad del terreno" },
    { en: "plant and material selections", es: "la selección de plantas y materiales" },
  ],
  pest_control: [
    { en: "type of pest and severity of infestation", es: "el tipo de plaga y severidad de la infestación" },
    { en: "property size and number of treatments needed", es: "el tamaño de la propiedad y número de tratamientos necesarios" },
  ],
  garage_door: [
    { en: "door type (single, double, custom)", es: "el tipo de puerta (sencilla, doble, personalizada)" },
    { en: "spring type (torsion vs extension)", es: "el tipo de resorte (torsión vs extensión)" },
  ],
};

/**
 * Build a brief pricing justification blurb for a given trade.
 * Injected into the system prompt after pricing ranges.
 */
export function buildPricingJustification(businessType: string, lang: "en" | "es" = "en"): string {
  const tradeFactors = TRADE_FACTORS[businessType] || [];
  const factors = [...tradeFactors, ...GENERIC_FACTORS].slice(0, 5);

  if (factors.length === 0) return "";

  const factorList = factors.map((f) => (lang === "es" ? f.es : f.en));

  if (lang === "es") {
    return `\n- Después de compartir un rango de precio, explica brevemente qué factores afectan el precio. Los factores comunes para este tipo de negocio incluyen: ${factorList.join(", ")}.`;
  }

  return `\n- After sharing a price range, briefly explain what factors affect the price. Common factors for this trade include: ${factorList.join(", ")}.`;
}
