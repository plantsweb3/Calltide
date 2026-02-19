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
  /** Hume injects session metadata here */
  metadata?: {
    chat_group_id?: string;
    config_id?: string;
    caller_phone?: string;
    called_phone?: string;
  };
}

export interface SSEDelta {
  role?: string;
  content?: string;
}

export interface SSEChoice {
  index: number;
  delta: SSEDelta;
  finish_reason: string | null;
}

export interface SSEChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: SSEChoice[];
}

/** Hume webhook event types */
export type HumeEventType =
  | "chat_started"
  | "chat_ended"
  | "tool_call"
  | "user_message"
  | "agent_message";

export interface HumeWebhookEvent {
  type: HumeEventType;
  chat_group_id: string;
  chat_id: string;
  config_id: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface HumeChatStartedData {
  caller_phone?: string;
  called_phone?: string;
}

export interface HumeChatEndedData {
  duration_seconds?: number;
  chat_group_id: string;
}

export interface HumeToolCallData {
  tool_call_id: string;
  name: string;
  parameters: string;
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
}
