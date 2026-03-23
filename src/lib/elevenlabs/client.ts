import { ElevenLabsClient } from "elevenlabs";

let _client: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!_client) {
    _client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });
  }
  return _client;
}
