/**
 * @deprecated Hume client — replaced by ElevenLabs.
 * This file is kept for backward compatibility with existing code that
 * references it (e.g., the Hume webhook handler, still active during migration).
 * All new code should use getElevenLabsClient() from @/lib/elevenlabs/client.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;

export function getHumeClient(): never {
  throw new Error("Hume client is deprecated. Use getElevenLabsClient() from @/lib/elevenlabs/client instead.");
}
