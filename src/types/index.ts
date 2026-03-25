/** OpenAI-compatible chat completion types for CLM endpoint */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  metadata?: {
    chat_group_id?: string;
    config_id?: string;
    caller_phone?: string;
    called_phone?: string;
  };
}

/** Tool handler types */
export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export type Language = "en" | "es";

export interface BusinessContext {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  twilioNumber: string;
  services: string[];
  businessHours: Record<string, { open: string; close: string }>;
  language: Language;
  timezone: string;
  greeting?: string;
  greetingEs?: string;
  serviceArea?: string;
  additionalInfo?: string;
  emergencyPhone?: string;
  personalityNotes?: string;
  receptionistName?: string;
  personalityPreset?: string;
  hasPricingEnabled?: boolean;
  estimateMode?: string;
  accountId?: string;
  serviceDurations?: Record<string, number>; // service name → duration in minutes
  bufferMinutes?: number; // travel time between appointments
}
