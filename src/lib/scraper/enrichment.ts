import type { PlaceResult } from "./google-places";

const SPANISH_INDICATORS = [
  "restaurante",
  "taqueria",
  "carniceria",
  "panaderia",
  "tienda",
  "mercado",
  "iglesia",
  "latino",
  "latina",
  "mexicano",
  "mexicana",
  "hispano",
  "hispana",
  "el ",
  "la ",
  "los ",
  "las ",
];

export function detectSpanish(name: string): boolean {
  const lower = name.toLowerCase();
  return SPANISH_INDICATORS.filter((w) => lower.includes(w)).length >= 1;
}

export type BusinessSize = "small" | "medium" | "large";

export function estimateSize(reviewCount?: number): BusinessSize {
  if (!reviewCount || reviewCount < 50) return "small";
  if (reviewCount < 200) return "medium";
  return "large";
}

/**
 * Lead scoring — max 65 points
 *
 * - Has phone: 15 pts
 * - Has website: 10 pts
 * - Rating < 4.0 (needs help): 10 pts
 * - Review count 10-100 (active but small): 15 pts
 * - Small business: 15 pts
 */
export function scoreProspect(place: PlaceResult): number {
  let score = 0;

  if (place.phone) score += 15;
  if (place.website) score += 10;
  if (place.rating !== undefined && place.rating < 4.0) score += 10;
  if (
    place.reviewCount !== undefined &&
    place.reviewCount >= 10 &&
    place.reviewCount <= 100
  )
    score += 15;

  const size = estimateSize(place.reviewCount);
  if (size === "small") score += 15;

  return score;
}

export function enrichProspect(place: PlaceResult) {
  return {
    language: detectSpanish(place.businessName) ? "es" : "en",
    size: estimateSize(place.reviewCount),
    leadScore: scoreProspect(place),
  };
}
