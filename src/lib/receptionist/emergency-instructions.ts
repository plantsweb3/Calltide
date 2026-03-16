import type { Language } from "@/types";

interface SafetyInstruction {
  keywords: string[];
  en: string;
  es: string;
}

const SAFETY_INSTRUCTIONS: SafetyInstruction[] = [
  {
    keywords: ["gas leak", "gas", "smell of gas", "fuga de gas", "olor a gas"],
    en: "For your safety: Leave the building immediately. Do not turn on or off any lights or appliances. Do not use your phone inside the house. Call 911 from outside.",
    es: "Por su seguridad: Salga del edificio inmediatamente. No encienda ni apague luces ni electrodomésticos. No use su teléfono adentro. Llame al 911 desde afuera.",
  },
  {
    keywords: ["flood", "flooding", "burst pipe", "pipe burst", "water leak", "water gushing", "inundación", "tubería rota", "se me inundó"],
    en: "Shut off your main water valve if you can locate it safely. Move valuables away from the water. Turn off electricity to affected areas if you can do so safely.",
    es: "Cierre la válvula principal de agua si puede localizarla de forma segura. Aleje objetos de valor del agua. Apague la electricidad en las áreas afectadas si puede hacerlo de forma segura.",
  },
  {
    keywords: ["electrical", "sparking", "burning smell", "electrical fire", "chispas", "olor a quemado"],
    en: "Do not touch any exposed wiring or damaged outlets. Turn off the circuit breaker for the affected area if safe. If you see flames or heavy smoke, evacuate and call 911.",
    es: "No toque cables expuestos ni tomas dañadas. Apague el interruptor del área afectada si es seguro. Si ve llamas o humo denso, evacúe y llame al 911.",
  },
  {
    keywords: ["carbon monoxide", "co alarm", "monóxido de carbono"],
    en: "Leave the building immediately and get fresh air. Do not go back inside. Call 911. Open windows if you can do so quickly on your way out.",
    es: "Salga del edificio inmediatamente y busque aire fresco. No regrese adentro. Llame al 911. Abra ventanas si puede hacerlo rápidamente al salir.",
  },
  {
    keywords: ["fire", "smoke", "fuego", "humo"],
    en: "Evacuate immediately. Close doors behind you to slow the spread. Call 911 from outside. Do not go back in for any reason.",
    es: "Evacúe inmediatamente. Cierre las puertas detrás de usted para frenar la propagación. Llame al 911 desde afuera. No regrese por ningún motivo.",
  },
  {
    keywords: ["sewage", "sewage backup", "aguas negras", "desbordamiento"],
    en: "Avoid contact with the water — it contains harmful bacteria. Do not use sinks, toilets, or drains in the affected area. Open windows for ventilation.",
    es: "Evite el contacto con el agua — contiene bacterias dañinas. No use lavabos, inodoros ni desagües en el área afectada. Abra ventanas para ventilación.",
  },
  {
    keywords: ["no heat", "no heating", "sin calefacción"],
    en: "Use extra blankets and layers. Close off unused rooms to conserve heat. If you have a safe, portable space heater, use it in a well-ventilated area. Never use a stove or oven for heating.",
    es: "Use cobijas y capas adicionales. Cierre habitaciones sin uso para conservar calor. Si tiene un calentador portátil seguro, úselo en un área ventilada. Nunca use la estufa u horno para calentar.",
  },
  {
    keywords: ["no power", "power outage", "sin electricidad", "no hay luz"],
    en: "Check your circuit breaker panel for tripped breakers. Unplug sensitive electronics to prevent damage from power surges when power returns.",
    es: "Revise su panel de interruptores por interruptores disparados. Desconecte electrónicos sensibles para prevenir daños por picos de voltaje cuando regrese la luz.",
  },
  {
    keywords: ["roof", "leaking", "collapsed", "tree", "techo", "goteras", "colapsado", "árbol"],
    en: "Move to a safe area of the house away from the damage. Place buckets or containers to catch water. Cover furniture with plastic if available.",
    es: "Muévase a un área segura de la casa lejos del daño. Coloque cubetas o recipientes para recoger el agua. Cubra los muebles con plástico si tiene disponible.",
  },
];

export function getEmergencySafetyInstructions(message: string, lang: Language): string | null {
  const lower = message.toLowerCase();

  for (const instruction of SAFETY_INSTRUCTIONS) {
    if (instruction.keywords.some((kw) => lower.includes(kw))) {
      return lang === "es" ? instruction.es : instruction.en;
    }
  }

  // Generic fallback
  return lang === "es"
    ? "Si hay peligro inmediato, evacúe y llame al 911. No intente reparar nada usted mismo."
    : "If there's immediate danger, evacuate and call 911. Do not attempt any repairs yourself.";
}
