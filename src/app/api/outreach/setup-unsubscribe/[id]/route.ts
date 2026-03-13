import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

/**
 * GET /api/outreach/setup-unsubscribe/[id]
 *
 * Unsubscribes a setup session from retarget emails by marking it abandoned.
 * The [id] is the session token (used as unsubToken in emails).
 * Returns a simple HTML confirmation page.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: token } = await params;

  try {
    const [session] = await db
      .select({ id: setupSessions.id, businessName: setupSessions.businessName })
      .from(setupSessions)
      .where(eq(setupSessions.token, token))
      .limit(1);

    if (session) {
      await db
        .update(setupSessions)
        .set({
          status: "abandoned",
          abandonedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(setupSessions.id, session.id));

      await logActivity({
        type: "status_change",
        entityType: "prospect",
        entityId: session.id,
        title: "Setup emails unsubscribed",
        detail: session.businessName || "Unknown",
      });
    }
  } catch {
    // Silently handle — don't expose errors to the user
  }

  // Always show success page regardless of whether token was found
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
    <p>You won't receive any more emails about your receptionist setup. If you change your mind, you can resume anytime at <a href="https://captahq.com/setup" style="color:#C59A27;">captahq.com/setup</a>.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
