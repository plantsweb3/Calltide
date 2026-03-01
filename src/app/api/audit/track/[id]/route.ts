import { NextRequest } from "next/server";
import { db } from "@/db";
import { auditRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 1x1 transparent PNG pixel
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * GET /api/audit/track/[id]
 * Tracking pixel — updates reportOpenedAt, returns 1x1 transparent PNG.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateLimit(`audit-track:${getClientIp(_req)}`, { limit: 60, windowSeconds: 60 });
  if (!rl.success) return new Response(PIXEL, { headers: { "Content-Type": "image/png" } });

  const { id } = await params;

  // Fire-and-forget DB update
  db.update(auditRequests)
    .set({ reportOpenedAt: new Date().toISOString() })
    .where(eq(auditRequests.id, id))
    .catch(() => {});

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
