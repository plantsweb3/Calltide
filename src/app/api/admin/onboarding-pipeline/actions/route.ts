import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { reportError } from "@/lib/error-reporting";
import { sendWelcomeSms } from "@/lib/onboarding/welcome-sms";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  action: z.enum(["recover", "resend-welcome", "magic-link"]),
  businessId: z.string().uuid(),
});

/**
 * POST /api/admin/onboarding-pipeline/actions
 * Admin action buttons for the onboarding pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, businessId } = schema.parse(body);

    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    switch (action) {
      case "recover": {
        // Attempt to recover a checkout — triggers the same logic as
        // /api/admin/recover-checkout which checks Stripe for payment,
        // links subscriptions, or creates the full business record.
        if (!biz.stripeCustomerId) {
          return NextResponse.json({ error: "No Stripe customer ID" }, { status: 400 });
        }

        await logActivity({
          type: "admin_action",
          entityType: "business",
          entityId: businessId,
          title: `Admin triggered checkout recovery for ${biz.name}`,
          detail: `Stripe customer: ${biz.stripeCustomerId}`,
        });

        // Call the recover-checkout endpoint to perform the actual recovery
        const recoverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/recover-checkout`;
        const recoverRes = await fetch(recoverUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": req.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            stripeCustomerId: biz.stripeCustomerId,
            businessName: biz.name || undefined,
            businessType: biz.type || undefined,
            ownerName: biz.ownerName || undefined,
            ownerPhone: biz.ownerPhone || undefined,
            ownerEmail: biz.ownerEmail || undefined,
          }),
        });

        const recoverData = await recoverRes.json();

        if (!recoverRes.ok) {
          // If the business already exists (409), that's actually a success case —
          // the Stripe subscription may have been linked.
          if (recoverRes.status === 409) {
            return NextResponse.json({
              success: true,
              message: `Business already exists (${recoverData.businessName || businessId}). Stripe IDs may have been linked.`,
              detail: recoverData,
            });
          }
          return NextResponse.json({
            error: recoverData.error || "Recovery failed",
            detail: recoverData.detail,
          }, { status: recoverRes.status });
        }

        return NextResponse.json({
          success: true,
          message: recoverData.recovered
            ? `Recovery complete: ${recoverData.action} — ${recoverData.businessName || businessId}`
            : "Recovery initiated",
          detail: recoverData,
        });
      }

      case "resend-welcome": {
        // Resend welcome SMS with a new password
        if (!biz.ownerPhone) {
          return NextResponse.json({ error: "No owner phone number" }, { status: 400 });
        }

        // Generate a new password
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        const newPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => chars[b % chars.length])
          .join("");

        if (biz.accountId) {
          const hash = await hashPassword(newPassword);
          await db
            .update(accounts)
            .set({ passwordHash: hash, updatedAt: new Date().toISOString() })
            .where(eq(accounts.id, biz.accountId));
        }

        await sendWelcomeSms(businessId, newPassword);

        await logActivity({
          type: "admin_action",
          entityType: "business",
          entityId: businessId,
          title: `Admin resent welcome SMS to ${biz.name}`,
          detail: `New password generated and SMS sent to owner.`,
        });

        return NextResponse.json({ success: true, message: "Welcome SMS resent with new password." });
      }

      case "magic-link": {
        // Trigger magic link email
        if (!biz.ownerEmail) {
          return NextResponse.json({ error: "No owner email" }, { status: 400 });
        }

        // Call the existing send-link endpoint internally
        const sendLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/auth/send-link`;
        const linkRes = await fetch(sendLinkUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: biz.ownerEmail }),
        });

        if (!linkRes.ok) {
          return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
        }

        await logActivity({
          type: "admin_action",
          entityType: "business",
          entityId: businessId,
          title: `Admin sent magic link to ${biz.name}`,
          detail: `Magic link sent to ${biz.ownerEmail}`,
        });

        return NextResponse.json({ success: true, message: "Magic link sent." });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    reportError("Pipeline action failed", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
