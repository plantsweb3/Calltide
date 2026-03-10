import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

/**
 * GET /api/outreach/paywall-unsubscribe/[id]
 *
 * Unsubscribes a business from paywall retarget emails.
 * Returns a simple HTML confirmation page.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const [biz] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.id, id))
      .limit(1);

    if (biz) {
      await db
        .update(businesses)
        .set({ paywallUnsubscribed: true, updatedAt: new Date().toISOString() })
        .where(eq(businesses.id, id));

      await logActivity({
        type: "status_change",
        entityType: "business",
        entityId: id,
        title: "Paywall emails unsubscribed",
        detail: biz.name,
      });
    }
  } catch {
    // Silently handle — don't expose errors to the user
  }

  // Always show success page regardless of whether ID was found
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed — Capta</title>
  <style>
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#fff; border-radius:12px; padding:40px; max-width:400px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    h1 { color:#0f172a; font-size:20px; margin:0 0 12px; }
    p { color:#64748b; font-size:15px; line-height:1.6; margin:0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>You won't receive any more emails about your onboarding setup. If you change your mind, you can always resume at <a href="https://capta.app/dashboard/onboarding" style="color:#C59A27;">capta.app</a>.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
