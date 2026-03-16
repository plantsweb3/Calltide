/**
 * Builds standardized webhook payloads for all events.
 */

export type WebhookEvent =
  | "appointment.created"
  | "appointment.cancelled"
  | "appointment.rescheduled"
  | "call.completed"
  | "customer.created"
  | "estimate.created"
  | "message.taken";

interface WebhookEnvelope {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export function buildWebhookPayload(
  event: WebhookEvent,
  data: Record<string, unknown>,
): WebhookEnvelope {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
}
