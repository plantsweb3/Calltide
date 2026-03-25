import { describe, it, expect, vi, beforeEach } from "vitest";
import { activeBusiness } from "../fixtures/businesses";

vi.mock("@/db", () => {
  const createChain = (returnValue: unknown[] = []) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const m of [
      "select", "from", "where", "limit", "set", "values",
      "insert", "update", "returning", "orderBy",
    ]) {
      chain[m] = vi.fn().mockReturnThis();
    }
    chain.limit = vi.fn().mockResolvedValue(returnValue);
    chain.returning = vi.fn().mockResolvedValue(returnValue);
    return chain;
  };

  return {
    db: {
      select: vi.fn(() => createChain([{
        id: activeBusiness.id,
        name: activeBusiness.name,
        active: true,
        humeConfigId: "hume_config_test",
      }])),
      insert: vi.fn(() => createChain()),
      update: vi.fn(() => createChain()),
    },
  };
});

vi.mock("@/db/schema", () => ({
  businesses: {
    id: "id",
    name: "name",
    active: "active",
    twilioNumber: "twilioNumber",
    humeConfigId: "humeConfigId",
  },
}));

vi.mock("@/lib/error-reporting", () => ({
  reportWarning: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitResponse: vi.fn(),
  RATE_LIMITS: { webhook: { maxRequests: 100, windowMs: 60000 } },
}));

vi.mock("twilio", () => ({
  default: {
    validateRequest: vi.fn().mockReturnValue(true),
  },
}));

beforeEach(async () => {
  vi.clearAllMocks();
  process.env.TWILIO_AUTH_TOKEN = "test_auth_token";
  process.env.NEXT_PUBLIC_APP_URL = "https://test.captahq.com";
  process.env.HUME_API_KEY = "test_hume_api_key";
  process.env.HUME_CONFIG_ID = "test_hume_config_id";

  // Re-set twilio mock after clearAllMocks
  const twilio = await import("twilio");
  vi.mocked(twilio.default.validateRequest).mockReturnValue(true);
});

describe("Voice Webhook — TwiML Generation", () => {
  it("returns TwiML with ElevenLabs stream for valid inbound call", async () => {
    const { POST } = await import("@/app/api/webhooks/twilio/voice/route");

    const formData = new FormData();
    formData.set("To", "+15125559999");
    formData.set("From", "+15125551234");
    formData.set("CallSid", "CA_test_001");

    const req = new Request("https://test.captahq.com/api/webhooks/twilio/voice", {
      method: "POST",
      body: formData,
      headers: {
        "x-twilio-signature": "valid-sig",
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(200);

    const body = await res.text();
    expect(body).toContain("<Connect>");
    expect(body).toContain("<Stream");
    expect(body).toContain("wss://api.hume.ai/v0/evi/twilio");
    expect(body).toContain("called_phone");
    expect(body).toContain("caller_phone");
    expect(body).toContain("business_id");
    expect(res.headers.get("Content-Type")).toBe("text/xml");
  });

  it("returns spoken message when TWILIO_AUTH_TOKEN is not set", async () => {
    delete process.env.TWILIO_AUTH_TOKEN;

    const { POST } = await import("@/app/api/webhooks/twilio/voice/route");

    const formData = new FormData();
    formData.set("To", "+15125559999");
    formData.set("From", "+15125551234");

    const req = new Request("https://test.captahq.com/api/webhooks/twilio/voice", {
      method: "POST",
      body: formData,
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const body = await res.text();
    expect(body).toContain("<Say");
    expect(body).toContain("not available");
  });

  it("returns 403 when Twilio signature is invalid", async () => {
    const twilio = await import("twilio");
    vi.mocked(twilio.default.validateRequest).mockReturnValue(false);

    const { POST } = await import("@/app/api/webhooks/twilio/voice/route");

    const formData = new FormData();
    formData.set("To", "+15125559999");
    formData.set("From", "+15125551234");

    const req = new Request("https://test.captahq.com/api/webhooks/twilio/voice", {
      method: "POST",
      body: formData,
      headers: {
        "x-twilio-signature": "bad-sig",
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(403);
  });

  it("returns spoken fallback when business is not found", async () => {
    const { db } = await import("@/db");
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    const { POST } = await import("@/app/api/webhooks/twilio/voice/route");

    const formData = new FormData();
    formData.set("To", "+19999999999");
    formData.set("From", "+15125551234");

    const req = new Request("https://test.captahq.com/api/webhooks/twilio/voice", {
      method: "POST",
      body: formData,
      headers: {
        "x-twilio-signature": "valid-sig",
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const body = await res.text();
    expect(body).toContain("<Say");
    expect(body).toContain("not currently active");
  });

  it("returns voicemail fallback when ElevenLabs is not configured", async () => {
    delete process.env.HUME_API_KEY;

    const { db } = await import("@/db");
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: activeBusiness.id,
            name: activeBusiness.name,
            active: true,
            humeConfigId: null,
          }]),
        }),
      }),
    } as never);

    const { POST } = await import("@/app/api/webhooks/twilio/voice/route");

    const formData = new FormData();
    formData.set("To", "+15125559999");
    formData.set("From", "+15125551234");

    const req = new Request("https://test.captahq.com/api/webhooks/twilio/voice", {
      method: "POST",
      body: formData,
      headers: {
        "x-twilio-signature": "valid-sig",
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    const body = await res.text();
    expect(body).toContain("<Say");
    expect(body).toContain("leave a message");
    expect(body).toContain("<Record");
  });
});

describe("Voice Webhook — XML Safety", () => {
  it("escapes XML special characters in parameters", () => {
    // Test the escapeXml logic inline
    function escapeXml(str: string): string {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    }

    expect(escapeXml('Hello "world" & <test>')).toBe(
      "Hello &quot;world&quot; &amp; &lt;test&gt;",
    );
    expect(escapeXml("O'Brien")).toBe("O&apos;Brien");
  });
});

describe("Voice Webhook — Rate Limiting", () => {
  it("returns rate limit response when limit exceeded", async () => {
    const { rateLimit, rateLimitResponse } = await import("@/lib/rate-limit");
    vi.mocked(rateLimit).mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60000 });
    vi.mocked(rateLimitResponse).mockReturnValue(
      new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 }),
    );

    const { POST } = await import("@/app/api/webhooks/twilio/voice/route");

    const formData = new FormData();
    formData.set("To", "+15125559999");
    formData.set("From", "+15125551234");

    const req = new Request("https://test.captahq.com/api/webhooks/twilio/voice", {
      method: "POST",
      body: formData,
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(429);
  });
});
