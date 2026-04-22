import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { testimonials, businesses } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { reportError } from "@/lib/error-reporting";
import { verifyTestimonialToken } from "@/lib/testimonials/signed-url";

/** Escape HTML special characters to prevent XSS in server-rendered HTML */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const submitSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  token: z.string().min(1, "Invalid token"),
  quote: z.string().min(10, "Please write at least a sentence").max(1000),
  rating: z.number().int().min(1).max(5).optional(),
});

/**
 * GET /api/testimonial/submit?businessId=xxx
 * Returns a simple HTML form for testimonial submission.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  const token = req.nextUrl.searchParams.get("token");
  if (!businessId || !token) {
    return new NextResponse("Missing businessId or token", { status: 400 });
  }

  if (!process.env.CLIENT_AUTH_SECRET) {
    reportError("Testimonial link: CLIENT_AUTH_SECRET not configured", new Error("Missing secret"));
    return new NextResponse("Server configuration error", { status: 500 });
  }

  if (!verifyTestimonialToken(businessId, token)) {
    return new NextResponse("Invalid or expired link", { status: 403 });
  }

  const [biz] = await db
    .select({ name: businesses.name, ownerName: businesses.ownerName })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return new NextResponse("Business not found", { status: 404 });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Share Your Experience — Capta</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1a1a2e; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 16px; padding: 40px 32px; max-width: 480px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .sub { color: #64748b; font-size: 15px; margin-bottom: 24px; line-height: 1.6; }
    label { display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 6px; }
    textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 15px; line-height: 1.6; resize: vertical; min-height: 120px; }
    textarea:focus { outline: none; border-color: #D4A843; box-shadow: 0 0 0 3px rgba(197,154,39,0.15); }
    .stars { display: flex; gap: 4px; margin-bottom: 20px; }
    .star { width: 32px; height: 32px; cursor: pointer; background: none; border: none; font-size: 24px; color: #d1d5db; transition: color 0.15s; }
    .star.active { color: #f59e0b; }
    button[type="submit"] { width: 100%; background: linear-gradient(135deg, #D4A843, #A17D1F); color: #fff; border: none; border-radius: 8px; padding: 14px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
    button[type="submit"]:hover { filter: brightness(1.1); }
    .success { text-align: center; padding: 40px 0; }
    .success h2 { color: #16a34a; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="card" id="form-card">
    <h1>Share Your Experience</h1>
    <p class="sub">Hey ${escapeHtml(biz.ownerName || "there")}, we'd love to hear how Capta has helped ${escapeHtml(biz.name)}. A sentence or two goes a long way!</p>
    <form id="testimonial-form">
      <input type="hidden" name="businessId" value="${escapeHtml(businessId)}" />
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <label>Rating</label>
      <div class="stars" id="stars">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star" data-value="${n}">&#9733;</button>`).join("")}
      </div>
      <label for="quote">Your testimonial</label>
      <textarea id="quote" name="quote" placeholder="Capta has been great for my business because..." required minlength="10" maxlength="1000"></textarea>
      <button type="submit">Submit Testimonial</button>
    </form>
  </div>
  <script>
    let rating = 5;
    const stars = document.querySelectorAll('.star');
    function updateStars() { stars.forEach((s, i) => s.classList.toggle('active', i < rating)); }
    stars.forEach((s) => s.addEventListener('click', () => { rating = parseInt(s.dataset.value); updateStars(); }));
    updateStars();
    document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const quote = document.getElementById('quote').value;
      const res = await fetch('/api/testimonial/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: document.querySelector('input[name="businessId"]').value,
          token: document.querySelector('input[name="token"]').value,
          quote,
          rating,
        }),
      });
      if (res.ok) {
        document.getElementById('form-card').innerHTML = '<div class="success"><h2>Thank you!</h2><p>Your testimonial has been submitted. We really appreciate it.</p></div>';
      } else {
        const data = await res.json();
        alert(data.error || 'Something went wrong');
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * POST /api/testimonial/submit
 * Public — rate limited.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`testimonial:${ip}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { businessId, token, quote, rating } = parsed.data;

  if (!process.env.CLIENT_AUTH_SECRET) {
    reportError("Testimonial submit: CLIENT_AUTH_SECRET not configured", new Error("Missing secret"));
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (!verifyTestimonialToken(businessId, token)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  // Verify business exists
  const [biz] = await db
    .select({ id: businesses.id, ownerName: businesses.ownerName, name: businesses.name, type: businesses.type, lastNpsScore: businesses.lastNpsScore })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Duplicate check: 1 testimonial per business per 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [existing] = await db
    .select({ id: testimonials.id })
    .from(testimonials)
    .where(
      and(
        eq(testimonials.businessId, businessId),
        gte(testimonials.submittedAt, thirtyDaysAgo),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "You've already submitted a testimonial recently. Thank you!" },
      { status: 409 },
    );
  }

  await db.insert(testimonials).values({
    businessId,
    ownerName: biz.ownerName,
    businessName: biz.name,
    businessType: biz.type,
    quote,
    rating,
    npsScore: biz.lastNpsScore ?? undefined,
  });

  await createNotification({
    source: "retention",
    severity: "info",
    title: "New testimonial submitted",
    message: `${biz.ownerName} from ${biz.name}: "${quote.slice(0, 80)}${quote.length > 80 ? "..." : ""}"`,
    actionUrl: "/admin/client-success",
  });

  return NextResponse.json({ success: true });
}
