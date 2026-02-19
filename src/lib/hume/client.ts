import { HumeClient } from "hume";

let _client: HumeClient | null = null;

export function getHumeClient(): HumeClient {
  if (!_client) {
    _client = new HumeClient({
      apiKey: process.env.HUME_API_KEY!,
    });
  }
  return _client;
}
