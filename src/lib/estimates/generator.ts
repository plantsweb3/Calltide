import { db } from "@/db";
import { pricingRanges, type FormulaJson } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface EstimateResult {
  matched: boolean;
  mode?: "quick" | "advanced";
  min?: number;
  max?: number;
  unit?: string;
  confidence?: "ballpark" | "estimated" | "no_match";
  calculation?: Record<string, unknown>;
  jobTypeKey?: string;
  jobTypeLabel?: string;
}

/**
 * Find the best matching pricing range for the given business/trade/scope/answers.
 */
export async function matchPricingRange(
  businessId: string,
  tradeType: string,
  scopeLevel: string,
  intakeAnswers: Record<string, unknown>,
): Promise<typeof pricingRanges.$inferSelect | null> {
  const ranges = await db
    .select()
    .from(pricingRanges)
    .where(
      and(
        eq(pricingRanges.businessId, businessId),
        eq(pricingRanges.tradeType, tradeType),
        eq(pricingRanges.active, true),
      ),
    )
    .orderBy(pricingRanges.sortOrder);

  if (ranges.length === 0) return null;

  // Try exact match on job_type_key from intake answers
  const projectType = (intakeAnswers.project_type || intakeAnswers.job_type || "") as string;
  const projectKey = projectType.toLowerCase().replace(/\s+/g, "_");

  // Filter by scope level
  const scopeMatches = ranges.filter(
    (r) => r.scopeLevel === scopeLevel || r.scopeLevel === "all",
  );
  const candidates = scopeMatches.length > 0 ? scopeMatches : ranges;

  // Exact key match
  const exactMatch = candidates.find((r) => r.jobTypeKey === projectKey);
  if (exactMatch) return exactMatch;

  // Partial key match (e.g. "interior_repaint" matches answer "interior repaint")
  const partialMatch = candidates.find((r) => {
    const rKey = r.jobTypeKey.toLowerCase();
    return projectKey.includes(rKey) || rKey.includes(projectKey);
  });
  if (partialMatch) return partialMatch;

  // If no key match, prefer advanced over quick as a general fallback
  const advanced = candidates.find((r) => r.mode === "advanced");
  if (advanced) return advanced;

  // Fall back to first quick range
  return candidates[0] || null;
}

/**
 * Calculate an advanced estimate using formula-based pricing.
 */
export function calculateAdvancedEstimate(
  formula: FormulaJson,
  answers: Record<string, unknown>,
): { min: number; max: number; calculation: Record<string, unknown> } {
  // Base calculation
  const baseUnits = Number(answers[formula.base_unit_variable]) || 1;
  const base = formula.base_rate * baseUnits;

  // Additional rates
  let additional = 0;
  const additionalBreakdown: Array<{ label: string; amount: number }> = [];
  for (const rate of formula.additional_rates) {
    const qty = Number(answers[rate.variable]) || 0;
    if (qty > 0) {
      const amount = rate.rate * qty;
      additional += amount;
      additionalBreakdown.push({ label: rate.label, amount });
    }
  }

  let subtotal = base + additional;

  // Apply multipliers where conditions match
  const appliedMultipliers: Array<{ label: string; value: number }> = [];
  for (const mult of formula.multipliers) {
    if (evaluateCondition(mult.condition, answers)) {
      subtotal *= mult.value;
      appliedMultipliers.push({ label: mult.label, value: mult.value });
    }
  }

  // Apply margin range
  const [marginLow, marginHigh] = formula.margin_range;
  const min = roundToNearest100(subtotal * marginLow);
  const max = roundToNearest100(subtotal * marginHigh);

  return {
    min,
    max,
    calculation: {
      base_rate: formula.base_rate,
      base_units: baseUnits,
      base_unit: formula.base_unit,
      base_total: base,
      additional: additionalBreakdown,
      subtotal: base + additional,
      multipliers: appliedMultipliers,
      margin_range: formula.margin_range,
    },
  };
}

/**
 * Evaluate a simple condition string against intake answers.
 * Supports: ==, !=, >=, >, <=, <, ||, &&, truthy checks.
 * NO eval() — safe string parsing only.
 */
export function evaluateCondition(
  condition: string,
  answers: Record<string, unknown>,
): boolean {
  const trimmed = condition.trim();

  // Handle OR (lowest precedence)
  if (trimmed.includes("||")) {
    const parts = trimmed.split("||");
    return parts.some((part) => evaluateCondition(part, answers));
  }

  // Handle AND
  if (trimmed.includes("&&")) {
    const parts = trimmed.split("&&");
    return parts.every((part) => evaluateCondition(part, answers));
  }

  // Handle comparison operators (order matters: >= before >, <= before <, != before ==)
  const operators = [">=", "<=", "!=", "==", ">", "<"] as const;
  for (const op of operators) {
    const idx = trimmed.indexOf(op);
    if (idx === -1) continue;

    const variable = trimmed.slice(0, idx).trim();
    const valueStr = trimmed.slice(idx + op.length).trim();
    const answerVal = answers[variable];

    // Handle "true"/"false" string comparisons
    if (valueStr === "true") {
      return op === "==" ? !!answerVal : !answerVal;
    }
    if (valueStr === "false") {
      return op === "==" ? !answerVal : !!answerVal;
    }

    // Try numeric comparison
    const numAnswer = Number(answerVal);
    const numValue = Number(valueStr);
    if (!isNaN(numAnswer) && !isNaN(numValue)) {
      switch (op) {
        case ">=": return numAnswer >= numValue;
        case "<=": return numAnswer <= numValue;
        case "!=": return numAnswer !== numValue;
        case "==": return numAnswer === numValue;
        case ">": return numAnswer > numValue;
        case "<": return numAnswer < numValue;
      }
    }

    // String comparison
    const strAnswer = String(answerVal ?? "").toLowerCase();
    const strValue = valueStr.toLowerCase().replace(/^["']|["']$/g, "");
    switch (op) {
      case "==": return strAnswer === strValue;
      case "!=": return strAnswer !== strValue;
      default: return false;
    }
  }

  // No operator found — treat as truthy check
  return !!answers[trimmed];
}

/**
 * Main entry point: generate an estimate for a completed intake.
 */
export async function generateEstimate(
  businessId: string,
  _jobIntakeId: string,
  intakeAnswers: Record<string, unknown>,
  tradeType: string,
  scopeLevel: string,
): Promise<EstimateResult> {
  const range = await matchPricingRange(businessId, tradeType, scopeLevel, intakeAnswers);

  if (!range) {
    return { matched: false, confidence: "no_match" };
  }

  if (range.mode === "advanced" && range.formulaJson) {
    const { min, max, calculation } = calculateAdvancedEstimate(
      range.formulaJson,
      intakeAnswers,
    );
    return {
      matched: true,
      mode: "advanced",
      min,
      max,
      unit: range.unit || "per_job",
      confidence: "estimated",
      calculation,
      jobTypeKey: range.jobTypeKey,
      jobTypeLabel: range.jobTypeLabel,
    };
  }

  // Quick mode — flat min/max ranges
  return {
    matched: true,
    mode: "quick",
    min: range.minPrice ?? 0,
    max: range.maxPrice ?? 0,
    unit: range.unit || "per_job",
    confidence: "ballpark",
    jobTypeKey: range.jobTypeKey,
    jobTypeLabel: range.jobTypeLabel,
  };
}

/**
 * Format an estimate result for SMS display.
 */
export function formatEstimateForSMS(estimate: EstimateResult): string {
  if (!estimate.matched || estimate.min == null || estimate.max == null) {
    return "";
  }

  const label = estimate.jobTypeLabel || "Job";
  const min = formatDollars(estimate.min);
  const max = formatDollars(estimate.max);
  const unitLabel = estimate.unit === "per_job" ? "" : ` ${estimate.unit?.replace("per_", "per ")}`;

  if (estimate.mode === "advanced") {
    return `${label}: ${min}\u2013${max}${unitLabel} (ballpark based on details provided)`;
  }

  return `${label}: ${min}\u2013${max}${unitLabel}`;
}

function roundToNearest100(n: number): number {
  return Math.round(n / 100) * 100;
}

function formatDollars(n: number): string {
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${n.toFixed(0)}`;
}
