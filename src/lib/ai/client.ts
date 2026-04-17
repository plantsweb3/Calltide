import Anthropic from "@anthropic-ai/sdk";

export const HAIKU_MODEL = "claude-haiku-4-5-20251001";
export const SONNET_MODEL = "claude-sonnet-4-5-20250929";

let client: Anthropic | null = null;

/**
 * Returns true when ANTHROPIC_API_KEY is set to a real-looking Anthropic key.
 * Call before invoking Anthropic so callers can degrade gracefully when the
 * key is missing or a placeholder (per CLAUDE.md).
 */
export function isAnthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.startsWith("sk-ant-") && key.length > 30;
}

export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
