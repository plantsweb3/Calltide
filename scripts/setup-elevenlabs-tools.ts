/**
 * One-time script to configure ElevenLabs agent tools.
 * Run: npx tsx scripts/setup-elevenlabs-tools.ts
 *
 * This configures the 9 server tools + system tools on ElevenLabs agents.
 * Tools are configured per-agent via the agent config, not as workspace-level resources.
 */

import "dotenv/config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error("ELEVENLABS_WEBHOOK_SECRET is required");
  process.exit(1);
}

/**
 * Server tool definitions for ElevenLabs agents.
 * These match the Zod schemas in src/lib/voice/tool-handlers.ts.
 */
export const TOOL_DEFINITIONS = [
  {
    type: "webhook" as const,
    name: "check_availability",
    description: "Check available appointment slots for a given date and optional service type.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Date to check in YYYY-MM-DD format" },
        service: { type: "string", description: "Optional service type to filter by" },
      },
      required: ["date"],
    },
  },
  {
    type: "webhook" as const,
    name: "book_appointment",
    description: "Book an appointment for the caller at a specific date, time, and service.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Appointment date in YYYY-MM-DD format" },
        time: { type: "string", description: "Appointment time (e.g. '9:00 AM')" },
        service: { type: "string", description: "Service being booked" },
        caller_name: { type: "string", description: "Name of the caller" },
        caller_phone: { type: "string", description: "Phone number of the caller" },
      },
      required: ["date", "time", "service"],
    },
  },
  {
    type: "webhook" as const,
    name: "take_message",
    description: "Take a message from the caller for the business owner. Use [EMERGENCY] prefix for emergencies.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        message: { type: "string", description: "The message from the caller" },
        caller_name: { type: "string", description: "Name of the caller" },
        caller_phone: { type: "string", description: "Phone number of the caller" },
      },
      required: ["message"],
    },
  },
  {
    type: "webhook" as const,
    name: "transfer_to_human",
    description: "Transfer the call to the business owner or a human operator.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        reason: { type: "string", description: "Reason for transfer. Prefix with [EMERGENCY] for emergencies." },
      },
      required: [],
    },
  },
  {
    type: "webhook" as const,
    name: "submit_intake",
    description: "Submit job intake information collected from the caller.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        answers: { type: "object", description: "Key-value pairs of intake questions and answers" },
        scope_description: { type: "string", description: "Description of the job scope" },
        scope_level: { type: "string", enum: ["residential", "commercial"], description: "Residential or commercial" },
        urgency: { type: "string", enum: ["emergency", "urgent", "normal", "flexible"], description: "Urgency level" },
        intake_complete: { type: "boolean", description: "Whether the intake is complete" },
      },
      required: ["answers"],
    },
  },
  {
    type: "webhook" as const,
    name: "refer_partner",
    description: "Refer the caller to a partner business for a trade/service the business doesn't handle.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        requested_trade: { type: "string", description: "The trade or service type the caller needs" },
        caller_name: { type: "string", description: "Name of the caller" },
        job_description: { type: "string", description: "Description of the job" },
      },
      required: ["requested_trade"],
    },
  },
  {
    type: "webhook" as const,
    name: "lookup_appointments",
    description: "Look up upcoming appointments for the caller by their phone number.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        caller_phone: { type: "string", description: "Phone number to look up appointments for" },
      },
      required: [],
    },
  },
  {
    type: "webhook" as const,
    name: "cancel_appointment",
    description: "Cancel an existing appointment by its ID.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "string", description: "The ID of the appointment to cancel" },
        reason: { type: "string", description: "Reason for cancellation" },
      },
      required: ["appointment_id"],
    },
  },
  {
    type: "webhook" as const,
    name: "reschedule_appointment",
    description: "Reschedule an existing appointment to a new date and time.",
    api: {
      url: `${APP_URL}/api/webhooks/elevenlabs/tools`,
      method: "POST" as const,
      headers: { "x-api-key": WEBHOOK_SECRET },
    },
    parameters: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "string", description: "The ID of the appointment to reschedule" },
        new_date: { type: "string", description: "New date in YYYY-MM-DD format" },
        new_time: { type: "string", description: "New time (e.g. '2:00 PM')" },
      },
      required: ["appointment_id", "new_date", "new_time"],
    },
  },
];

console.log("ElevenLabs tool definitions ready.");
console.log(`${TOOL_DEFINITIONS.length} tools configured.`);
console.log("Tools are embedded in agent configs via buildAgentConfig().");
console.log("No separate registration needed — tools are defined per-agent.");
