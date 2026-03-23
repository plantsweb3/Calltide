import { buildSystemPrompt } from "@/lib/ai/system-prompts";
import { PERSONALITY_PRESETS, type PersonalityPreset } from "@/lib/receptionist/personalities";
import type { BusinessContext } from "@/types";

/**
 * Curated voice IDs mapped to personality presets.
 * These are high-quality ElevenLabs voices selected for receptionist use.
 */
export const VOICE_MAP: Record<string, string> = {
  // Default personality voices
  professional: "EXAVITQu4vr4xnSDxMaL", // Sarah — polished, confident
  friendly: "jBpfAFnaylXS5xpurlZD",     // Lily — warm, approachable
  warm: "onwK4e9ZLuTAKqWW03F9",          // Daniel — gentle, caring
};

/**
 * Curated voice options for the voice selection UI.
 */
export const VOICE_OPTIONS = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Professional & polished", gender: "female" },
  { id: "jBpfAFnaylXS5xpurlZD", name: "Lily", description: "Friendly & approachable", gender: "female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Warm & caring", gender: "male" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Rachel", description: "Clear & confident", gender: "female" },
] as const;

interface BuildAgentConfigParams {
  biz: BusinessContext;
  voiceId?: string | null;
}

/**
 * Build server tool definitions for ElevenLabs agent.
 * These are webhook-based tools that call our dispatcher endpoint.
 */
function buildToolDefinitions(appUrl: string, webhookSecret: string) {
  const url = `${appUrl}/api/webhooks/elevenlabs/tools`;
  const method = "POST" as const;
  const request_headers = { "x-api-key": webhookSecret };

  function webhook(
    name: string,
    description: string,
    properties: Record<string, { type: "string" | "boolean" | "integer"; description: string }>,
    required: string[] = [],
  ) {
    return {
      type: "webhook" as const,
      name,
      description,
      api_schema: {
        url,
        method,
        request_headers,
        request_body_schema: {
          type: "object" as const,
          properties,
          required,
        },
      },
    };
  }

  return [
    webhook("check_availability", "Check available appointment slots for a given date and optional service type.", {
      date: { type: "string", description: "Date to check in YYYY-MM-DD format" },
      service: { type: "string", description: "Optional service type to filter by" },
    }, ["date"]),

    webhook("book_appointment", "Book an appointment for the caller at a specific date, time, and service.", {
      date: { type: "string", description: "Appointment date in YYYY-MM-DD format" },
      time: { type: "string", description: "Appointment time (e.g. '9:00 AM')" },
      service: { type: "string", description: "Service being booked" },
      caller_name: { type: "string", description: "Name of the caller" },
    }, ["date", "time", "service"]),

    webhook("take_message", "Take a message from the caller for the business owner. Use [EMERGENCY] prefix for emergencies.", {
      message: { type: "string", description: "The message from the caller" },
      caller_name: { type: "string", description: "Name of the caller" },
    }, ["message"]),

    webhook("transfer_to_human", "Transfer the call to the business owner or a human operator.", {
      reason: { type: "string", description: "Reason for transfer. Prefix with [EMERGENCY] for emergencies." },
    }),

    {
      type: "webhook" as const,
      name: "submit_intake",
      description: "Submit job intake information collected from the caller.",
      api_schema: {
        url,
        method,
        request_headers,
        request_body_schema: {
          type: "object" as const,
          properties: {
            answers: { type: "object" as const, description: "Key-value pairs of intake questions and answers" },
            scope_description: { type: "string" as const, description: "Description of the job scope" },
            scope_level: { type: "string" as const, description: "residential or commercial" },
            urgency: { type: "string" as const, description: "emergency, urgent, normal, or flexible" },
            intake_complete: { type: "boolean" as const, description: "Whether the intake is complete" },
          },
          required: ["answers"],
        },
      },
    },

    webhook("refer_partner", "Refer the caller to a partner business for a trade/service the business doesn't handle.", {
      requested_trade: { type: "string", description: "The trade or service type the caller needs" },
      caller_name: { type: "string", description: "Name of the caller" },
      job_description: { type: "string", description: "Description of the job" },
    }, ["requested_trade"]),

    webhook("lookup_appointments", "Look up upcoming appointments for the caller by their phone number.", {
      caller_phone: { type: "string", description: "Phone number to look up appointments for" },
    }),

    webhook("cancel_appointment", "Cancel an existing appointment by its ID.", {
      appointment_id: { type: "string", description: "The ID of the appointment to cancel" },
      reason: { type: "string", description: "Reason for cancellation" },
    }, ["appointment_id"]),

    webhook("reschedule_appointment", "Reschedule an existing appointment to a new date and time.", {
      appointment_id: { type: "string", description: "The ID of the appointment to reschedule" },
      new_date: { type: "string", description: "New date in YYYY-MM-DD format" },
      new_time: { type: "string", description: "New time (e.g. '2:00 PM')" },
    }, ["appointment_id", "new_date", "new_time"]),
  ];
}

/**
 * Builds the ElevenLabs agent configuration from a business record.
 * Returns the body for create/update agent API calls.
 */
export function buildAgentConfig({ biz, voiceId }: BuildAgentConfigParams) {
  const presetKey = (biz.personalityPreset || "friendly") as PersonalityPreset;
  const preset = PERSONALITY_PRESETS[presetKey] || PERSONALITY_PRESETS.friendly;
  const receptionistName = biz.receptionistName || "Maria";
  const resolvedVoiceId = voiceId || VOICE_MAP[presetKey] || VOICE_MAP.friendly;

  // Build system prompt using existing prompt builder
  const systemPrompt = buildSystemPrompt(biz, "en");

  // Build greetings
  const greetingEn = preset.greetingTemplate.en(receptionistName, biz.name);
  const greetingEs = preset.greetingTemplate.es(receptionistName, biz.name);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET || "";

  const tools = buildToolDefinitions(appUrl, webhookSecret);

  return {
    name: `${biz.name} — ${receptionistName}`,
    conversation_config: {
      tts: {
        voice_id: resolvedVoiceId,
        model_id: "eleven_flash_v2_5" as const,
      },
      conversation: {
        max_duration_seconds: 600,
      },
      turn: {
        turn_timeout: 7,
      },
      agent: {
        prompt: {
          prompt: systemPrompt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          llm: "claude-sonnet-4" as any,
          temperature: 0,
          tools,
        },
        first_message: greetingEn,
        language: "en",
        dynamic_variables: {
          dynamic_variable_placeholders: {
            business_id: biz.id,
          },
        },
      },
      language_presets: {
        es: {
          overrides: {
            agent: {
              prompt: {
                prompt: buildSystemPrompt(biz, "es"),
              },
              first_message: greetingEs,
              language: "es",
            },
          },
        },
      },
    },
    platform_settings: {
      overrides: {
        conversation_config_override: {
          agent: {
            prompt: { prompt: true },
            first_message: true,
            language: true,
          },
        },
      },
    },
  };
}
