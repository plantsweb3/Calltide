import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { syncAgent } from "@/lib/elevenlabs/sync-agent";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../demo-data";

/**
 * POST /api/dashboard/activate
 * Activates the business's AI receptionist (sets active: true).
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`activate:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      success: true,
      activatedAt: new Date().toISOString(),
      message: "Demo mode — changes not saved",
    });
  }

  try {
    const [biz] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        active: businesses.active,
        onboardingCompletedAt: businesses.onboardingCompletedAt,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Already active — return idempotent success
    if (biz.active) {
      return NextResponse.json({
        success: true,
        activatedAt: biz.onboardingCompletedAt || new Date().toISOString(),
        alreadyActive: true,
      });
    }

    const now = new Date().toISOString();

    await db
      .update(businesses)
      .set({
        active: true,
        onboardingCompletedAt: now,
        onboardingStatus: "completed",
        updatedAt: now,
      })
      .where(eq(businesses.id, businessId));

    await logActivity({
      type: "business_activated",
      entityType: "business",
      entityId: businessId,
      title: `${biz.name} activated their AI receptionist`,
      detail: "Business went live via the onboarding activation button.",
    });

    await createNotification({
      source: "financial",
      severity: "info",
      title: `${biz.name} is live!`,
      message: `${biz.name} activated their AI receptionist and is now live.`,
      actionUrl: "/admin/clients",
    });

    // Sync ElevenLabs agent to ensure it's ready. Report failures — a
    // silent sync failure here means the customer's first live call fails.
    syncAgent(businessId).catch((err) =>
      reportError("ElevenLabs agent resync failed on activation", err, { businessId }),
    );

    return NextResponse.json({
      success: true,
      activatedAt: now,
    });
  } catch (err) {
    reportError("[activate] Failed to activate business", err, {
      extra: { businessId },
    });
    return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
  }
}
