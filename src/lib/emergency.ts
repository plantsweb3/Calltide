/**
 * Bilingual emergency keyword detection for voice calls.
 * Returns true if the caller's message indicates an emergency situation.
 */

const EMERGENCY_PHRASES_EN = [
  "gas leak",
  "smell gas",
  "smells like gas",
  "flooding",
  "burst pipe",
  "pipe burst",
  "water everywhere",
  "water gushing",
  "water pouring",
  "no heat",
  "no heating",
  "heater broke",
  "furnace out",
  "freezing",
  "sparking",
  "electrical fire",
  "burning smell",
  "smells like burning",
  "carbon monoxide",
  "co detector",
  "co alarm",
  "fire",
  "smoke",
  "sewage backup",
  "sewage coming up",
  "raw sewage",
  "sewer overflow",
  "emergency",
  "urgent",
  "help now",
  "need help immediately",
  "dangerous",
  "someone could get hurt",
];

const EMERGENCY_PHRASES_ES = [
  "fuga de gas",
  "huele a gas",
  "olor a gas",
  "inundación",
  "inundacion",
  "tubería rota",
  "tuberia rota",
  "tubo roto",
  "agua por todos lados",
  "agua saliendo",
  "sin calefacción",
  "sin calefaccion",
  "sin calentón",
  "sin calenton",
  "no tenemos calefacción",
  "se apagó la calefacción",
  "chispas",
  "olor a quemado",
  "huele a quemado",
  "monóxido de carbono",
  "monoxido de carbono",
  "detector de co",
  "alarma de co",
  "fuego",
  "incendio",
  "humo",
  "aguas negras",
  "drenaje desbordado",
  "emergencia",
  "urgente",
  "ayuda ahora",
  "necesito ayuda ya",
  "peligroso",
  "peligro",
];

export interface EmergencyDetection {
  isEmergency: boolean;
  matchedPhrase?: string;
}

/**
 * Scans a message for emergency keywords in both English and Spanish.
 * Uses case-insensitive matching against known emergency phrases.
 */
export function detectEmergency(text: string): EmergencyDetection {
  const lower = text.toLowerCase();

  for (const phrase of EMERGENCY_PHRASES_EN) {
    if (lower.includes(phrase)) {
      return { isEmergency: true, matchedPhrase: phrase };
    }
  }

  for (const phrase of EMERGENCY_PHRASES_ES) {
    if (lower.includes(phrase)) {
      return { isEmergency: true, matchedPhrase: phrase };
    }
  }

  return { isEmergency: false };
}
