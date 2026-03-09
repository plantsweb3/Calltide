import { db } from "@/db";
import { tradeIntakeTemplates, jobIntakes, customIntakeQuestions } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

interface IntakeQuestion {
  questionKey: string;
  questionText: string;
  questionTextEs: string;
  fieldType: string;
  options: string[] | null;
  required: boolean;
  helpText: string | null;
  source: "trade_default" | "custom";
}

/**
 * Get the intake template for a given trade + scope level.
 * Returns questions ordered by question_order.
 */
export async function getIntakeTemplate(
  tradeType: string,
  scopeLevel: "residential" | "commercial" = "residential",
): Promise<IntakeQuestion[]> {
  const rows = await db
    .select()
    .from(tradeIntakeTemplates)
    .where(
      and(
        eq(tradeIntakeTemplates.tradeType, tradeType),
        eq(tradeIntakeTemplates.scopeLevel, scopeLevel),
      ),
    )
    .orderBy(asc(tradeIntakeTemplates.questionOrder));

  return rows.map((r) => ({
    questionKey: r.questionKey,
    questionText: r.questionText,
    questionTextEs: r.questionTextEs,
    fieldType: r.fieldType,
    options: r.optionsJson || null,
    required: r.required ?? true,
    helpText: r.helpText,
    source: "trade_default" as const,
  }));
}

/**
 * Get intake questions for a specific business — merges trade defaults
 * with any custom questions the business has added.
 */
export async function getBusinessIntakeQuestions(
  businessId: string,
  tradeType: string,
  scopeLevel: "residential" | "commercial" = "residential",
): Promise<IntakeQuestion[]> {
  // Fetch trade defaults and custom questions in parallel
  const [defaults, customs] = await Promise.all([
    getIntakeTemplate(tradeType, scopeLevel),
    db
      .select()
      .from(customIntakeQuestions)
      .where(eq(customIntakeQuestions.businessId, businessId))
      .orderBy(asc(customIntakeQuestions.questionOrder)),
  ]);

  // Merge: custom questions are appended after trade defaults
  const customMapped: IntakeQuestion[] = customs.map((c) => ({
    questionKey: c.questionKey,
    questionText: c.questionText,
    questionTextEs: c.questionTextEs,
    fieldType: c.fieldType,
    options: c.optionsJson || null,
    required: c.required ?? false,
    helpText: null,
    source: "custom" as const,
  }));

  return [...defaults, ...customMapped];
}

/**
 * Save intake answers collected during a call.
 */
export async function saveJobIntake(data: {
  businessId: string;
  callId?: string;
  leadId?: string;
  tradeType: string;
  scopeLevel: "residential" | "commercial";
  answers: Record<string, unknown>;
  scopeDescription: string;
  urgency: "emergency" | "urgent" | "normal" | "flexible";
  intakeComplete: boolean;
}): Promise<{ id: string }> {
  const [intake] = await db
    .insert(jobIntakes)
    .values({
      businessId: data.businessId,
      callId: data.callId,
      leadId: data.leadId,
      tradeType: data.tradeType,
      scopeLevel: data.scopeLevel,
      answersJson: data.answers,
      scopeDescription: data.scopeDescription,
      urgency: data.urgency,
      intakeComplete: data.intakeComplete,
    })
    .returning({ id: jobIntakes.id });

  return { id: intake.id };
}

/** Keywords that indicate commercial scope */
const COMMERCIAL_KEYWORDS = [
  "apartment", "apartments", "complex", "building", "buildings",
  "units", "office", "university", "college", "campus", "hotel",
  "warehouse", "retail", "store", "commercial", "property manager",
  "general contractor", "gc", "specs", "plans", "tenant",
  "multi-unit", "multi unit", "stories", "floors",
  // Spanish equivalents
  "apartamento", "apartamentos", "complejo", "edificio", "edificios",
  "unidades", "oficina", "universidad", "bodega", "comercial",
  "contratista general", "planos", "especificaciones", "pisos",
];

/**
 * Detect whether a call is residential or commercial scope
 * based on transcript content and collected answers.
 */
export function detectScopeLevel(
  transcript: string,
  answers: Record<string, unknown> = {},
): "residential" | "commercial" {
  const lower = transcript.toLowerCase();

  // Check for commercial keywords in transcript
  const keywordHits = COMMERCIAL_KEYWORDS.filter((kw) => lower.includes(kw));
  if (keywordHits.length >= 2) return "commercial";

  // Check answer values for commercial indicators
  const numUnits = Number(answers.num_units) || 0;
  const sqft = Number(answers.sqft_estimate) || Number(answers.home_sqft) || 0;
  const numFloors = Number(answers.num_floors) || Number(answers.num_stories) || 0;
  const roomCount = Number(answers.room_count) || 0;

  if (numUnits > 5) return "commercial";
  if (sqft > 3000) return "commercial";
  if (numFloors > 3) return "commercial";
  if (roomCount > 10) return "commercial";

  // Check project_type answer
  const projectType = String(answers.project_type || "").toLowerCase();
  const commercialProjectTypes = [
    "apartment_complex", "office_building", "office", "retail",
    "university", "hotel", "warehouse", "restaurant", "hospital",
    "industrial", "multi_unit", "school",
  ];
  if (commercialProjectTypes.includes(projectType)) return "commercial";

  return "residential";
}

/**
 * Format intake questions into a prompt block for the AI system prompt.
 * Returns the questions formatted for Maria to use conversationally.
 */
export function formatIntakeForPrompt(
  questions: IntakeQuestion[],
  lang: "en" | "es" = "en",
): string {
  const required = questions.filter((q) => q.required);
  const optional = questions.filter((q) => !q.required);

  const lines: string[] = [];

  if (required.length > 0) {
    lines.push(lang === "en" ? "Required qualifying questions:" : "Preguntas calificadoras requeridas:");
    for (const q of required) {
      const text = lang === "en" ? q.questionText : q.questionTextEs;
      const opts = q.options ? ` [${q.options.join(", ")}]` : "";
      lines.push(`- ${q.questionKey}: "${text}"${opts}`);
    }
  }

  if (optional.length > 0) {
    lines.push("");
    lines.push(lang === "en" ? "Optional (ask if relevant):" : "Opcionales (preguntar si es relevante):");
    for (const q of optional) {
      const text = lang === "en" ? q.questionText : q.questionTextEs;
      const opts = q.options ? ` [${q.options.join(", ")}]` : "";
      lines.push(`- ${q.questionKey}: "${text}"${opts}`);
    }
  }

  return lines.join("\n");
}
