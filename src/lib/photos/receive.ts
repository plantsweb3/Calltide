import { db } from "@/db";
import {
  businesses,
  jobIntakes,
  jobCards,
  leads,
  intakeAttachments,
} from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { normalizePhone } from "@/lib/compliance/sms";
import { sendSMS } from "@/lib/twilio/sms";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Match photos to intakes within 48 hours
const MATCH_WINDOW_HOURS = 48;

interface ProcessPhotosParams {
  fromPhone: string;
  toPhone: string;
  numMedia: number;
  mediaUrls: string[];
  mediaTypes: string[];
  bodyText: string | null;
  businessId: string;
}

interface ProcessPhotosResult {
  matched: boolean;
  intakeId?: string;
  photoCount?: number;
}

/**
 * Process inbound MMS with media attachments.
 * Matches photos to recent job intakes and creates attachment records.
 */
export async function processInboundPhotos(
  params: ProcessPhotosParams,
): Promise<ProcessPhotosResult> {
  const { fromPhone, businessId, numMedia, mediaUrls, mediaTypes, bodyText } = params;

  if (numMedia === 0 || mediaUrls.length === 0) {
    return { matched: false };
  }

  // Filter to image-only types
  const imageIndices: number[] = [];
  for (let i = 0; i < numMedia; i++) {
    const contentType = mediaTypes[i] || "";
    if (ALLOWED_IMAGE_TYPES.includes(contentType.toLowerCase())) {
      imageIndices.push(i);
    } else {
      reportWarning("Skipping non-image attachment", {
        contentType,
        businessId,
      });
    }
  }

  if (imageIndices.length === 0) {
    return { matched: false };
  }

  const normalizedFrom = normalizePhone(fromPhone);

  // Find a recent intake for this caller within the match window
  const cutoff = new Date(Date.now() - MATCH_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  // Find leads matching this phone for this business
  const matchingLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.businessId, businessId),
        eq(leads.phone, normalizedFrom),
      ),
    );

  // Also check with +1 prefix
  const matchingLeadsWithPrefix = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.businessId, businessId),
        eq(leads.phone, `+1${normalizedFrom}`),
      ),
    );

  const allLeadIds = [
    ...matchingLeads.map((l) => l.id),
    ...matchingLeadsWithPrefix.map((l) => l.id),
  ];

  if (allLeadIds.length === 0) {
    return { matched: false };
  }

  // Find the most recent completed intake from any of these leads
  let matchedIntake: typeof jobIntakes.$inferSelect | null = null;
  for (const leadId of allLeadIds) {
    const [intake] = await db
      .select()
      .from(jobIntakes)
      .where(
        and(
          eq(jobIntakes.businessId, businessId),
          eq(jobIntakes.leadId, leadId),
          eq(jobIntakes.intakeComplete, true),
          gte(jobIntakes.createdAt, cutoff),
        ),
      )
      .orderBy(desc(jobIntakes.createdAt))
      .limit(1);

    if (intake) {
      if (!matchedIntake || (intake.createdAt && matchedIntake.createdAt && intake.createdAt > matchedIntake.createdAt)) {
        matchedIntake = intake;
      }
    }
  }

  if (!matchedIntake) {
    return { matched: false };
  }

  // Find the job card for this intake (if one exists)
  const [card] = await db
    .select({ id: jobCards.id, callerName: jobCards.callerName })
    .from(jobCards)
    .where(eq(jobCards.jobIntakeId, matchedIntake.id))
    .limit(1);

  // Find lead for the attachment record
  const leadId = matchedIntake.leadId || allLeadIds[0];

  // Create attachment records for each image
  let savedCount = 0;
  for (let idx = 0; idx < imageIndices.length; idx++) {
    const i = imageIndices[idx];
    try {
      await db.insert(intakeAttachments).values({
        businessId,
        jobIntakeId: matchedIntake.id,
        jobCardId: card?.id || null,
        leadId: leadId || null,
        fromPhone: normalizedFrom,
        mediaUrl: mediaUrls[i],
        mediaContentType: mediaTypes[i] || null,
        caption: idx === 0 && bodyText ? bodyText : null,
      });
      savedCount++;
    } catch (err) {
      reportError("Failed to save intake attachment", err, {
        extra: { businessId, intakeId: matchedIntake.id },
      });
    }
  }

  // Update job card photo count if one exists
  if (card && savedCount > 0) {
    // Get total photo count for this intake
    const allPhotos = await db
      .select({ id: intakeAttachments.id })
      .from(intakeAttachments)
      .where(eq(intakeAttachments.jobIntakeId, matchedIntake.id));

    await db
      .update(jobCards)
      .set({
        photoCount: allPhotos.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobCards.id, card.id));
  }

  // Notify the owner that photos were received
  await notifyOwnerOfPhotos(businessId, card?.callerName || null, savedCount, matchedIntake.scopeDescription);

  // Send confirmation to the caller
  await sendCallerConfirmation(businessId, fromPhone, leadId);

  // Log activity
  await logActivity({
    type: "photo_received",
    entityType: "job_intake",
    entityId: matchedIntake.id,
    title: `${savedCount} photo(s) received for intake`,
    detail: `Caller ${normalizedFrom.slice(-4)} sent ${savedCount} photo(s) for ${matchedIntake.scopeDescription || "job intake"}.`,
  });

  return {
    matched: true,
    intakeId: matchedIntake.id,
    photoCount: savedCount,
  };
}

/**
 * Notify the business owner that photos were received for a lead.
 */
async function notifyOwnerOfPhotos(
  businessId: string,
  callerName: string | null,
  photoCount: number,
  jobDescription: string | null,
): Promise<void> {
  const [biz] = await db
    .select({
      ownerPhone: businesses.ownerPhone,
      twilioNumber: businesses.twilioNumber,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz?.ownerPhone || !biz.twilioNumber) return;

  const name = callerName || "A caller";
  const jobDesc = jobDescription || "a recent lead";
  const body = `\u{1F4F8} ${name} sent ${photoCount} photo(s) for the ${jobDesc} lead. View in your dashboard or check your next daily digest.`;

  sendSMS({
    to: biz.ownerPhone,
    from: biz.twilioNumber,
    body,
    businessId,
    templateType: "owner_notify",
  }).catch((err) => {
    reportError("Owner photo notification failed", err, { extra: { businessId } });
  });
}

/**
 * Send confirmation to the caller that their photos were received.
 */
async function sendCallerConfirmation(
  businessId: string,
  callerPhone: string,
  leadId: string | null,
): Promise<void> {
  const [biz] = await db
    .select({
      twilioNumber: businesses.twilioNumber,
      ownerName: businesses.ownerName,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz?.twilioNumber) return;

  const ownerFirst = biz.ownerName?.split(" ")[0] || "the team";
  const body = `Got your photos \u2014 thanks! ${ownerFirst} will have those when reviewing your estimate.`;

  sendSMS({
    to: callerPhone,
    from: biz.twilioNumber,
    body,
    businessId,
    leadId: leadId || undefined,
    templateType: "photo_confirmation",
  }).catch((err) => {
    reportError("Caller photo confirmation failed", err, { extra: { businessId } });
  });
}
