import { db } from "@/db";
import { appointments, calls, leads } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkAvailability, bookSlot } from "@/lib/calendar/availability";
import { getBusinessById } from "@/lib/ai/context-builder";
import { sendSMS } from "@/lib/twilio/sms";
import { getAppointmentConfirmation, getOwnerNotification } from "@/lib/sms-templates";
import { updateActiveCall } from "@/lib/monitoring/active-calls";
import { reportError } from "@/lib/error-reporting";
import { saveJobIntake, detectScopeLevel } from "@/lib/intake";
import { findBestPartner, logReferral, notifyPartner, sendPartnerInfoToCaller } from "@/lib/referrals/partners";
import type { ToolResult, Language } from "@/types";

interface ToolCallContext {
  businessId: string;
  callId?: string;
  leadId?: string;
  callerPhone?: string;
  language: Language;
}

// Map tool names to intent labels for live monitoring
const TOOL_INTENT_MAP: Record<string, string> = {
  check_availability: "booking",
  book_appointment: "booking",
  take_message: "message",
  transfer_to_human: "transfer",
  submit_intake: "intake",
  refer_partner: "referral",
};

export async function dispatchToolCall(
  toolName: string,
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  let result: ToolResult;
  switch (toolName) {
    case "check_availability":
      result = await handleCheckAvailability(params, ctx);
      break;
    case "book_appointment":
      result = await handleBookAppointment(params, ctx);
      break;
    case "take_message":
      result = await handleTakeMessage(params, ctx);
      break;
    case "transfer_to_human":
      result = await handleTransferToHuman(params, ctx);
      break;
    case "submit_intake":
      result = await handleSubmitIntake(params, ctx);
      break;
    case "refer_partner":
      result = await handleReferPartner(params, ctx);
      break;
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }

  // Update active call intent for live monitoring (fire-and-forget, non-transfer tools only)
  const intent = TOOL_INTENT_MAP[toolName];
  if (intent && toolName !== "transfer_to_human" && ctx.callId) {
    const [cr] = await db.select({ humeChitChatId: calls.humeChitChatId })
      .from(calls).where(eq(calls.id, ctx.callId)).limit(1);
    if (cr?.humeChitChatId) {
      updateActiveCall({ humeSessionId: cr.humeChitChatId }, {
        currentIntent: intent,
        callType: intent,
      }).catch((err) => reportError("Failed to update active call intent", err));
    }
  }

  return result;
}

async function handleCheckAvailability(
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  const date = params.date as string;
  const service = params.service as string | undefined;

  if (!date) return { success: false, error: "Date is required" };

  const slots = await checkAvailability(biz, date, service);
  const available = slots.filter((s) => s.available);

  if (available.length === 0) {
    return {
      success: true,
      data: {
        available: false,
        message: ctx.language === "es"
          ? `No hay horarios disponibles para el ${date}.`
          : `No available slots for ${date}.`,
        slots: [],
      },
    };
  }

  return {
    success: true,
    data: {
      available: true,
      slots: available.map((s) => ({ date: s.date, time: s.time })),
      message: ctx.language === "es"
        ? `Hay ${available.length} horarios disponibles para el ${date}.`
        : `There are ${available.length} available slots for ${date}.`,
    },
  };
}

async function handleBookAppointment(
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  const date = params.date as string;
  const time = params.time as string;
  const service = params.service as string;
  const callerName = params.caller_name as string | undefined;

  if (!date || !time || !service) {
    return { success: false, error: "Date, time, and service are required" };
  }

  // Try to book the slot
  const bookResult = await bookSlot(biz, date, time, service);
  if (!bookResult.success) {
    return {
      success: false,
      error: bookResult.conflictReason || "Unable to book that slot",
    };
  }

  // Update lead name if provided
  if (callerName && ctx.leadId) {
    await db.update(leads).set({ name: callerName }).where(eq(leads.id, ctx.leadId));
  }

  // Double-check for conflicts right before insert to minimize race window
  const existing = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, ctx.businessId),
        eq(appointments.date, date),
        eq(appointments.time, time),
        eq(appointments.status, "confirmed")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "That time slot was just booked. Please choose another time." };
  }

  // Create appointment record
  const [appointment] = await db.insert(appointments).values({
    businessId: ctx.businessId,
    leadId: ctx.leadId || "",
    callId: ctx.callId,
    service,
    date,
    time,
    status: "confirmed",
  }).returning();

  // Send confirmation SMS to caller
  if (ctx.callerPhone) {
    await sendSMS({
      to: ctx.callerPhone,
      from: biz.twilioNumber,
      body: getAppointmentConfirmation({ businessName: biz.name, service, date, time }, ctx.language),
      businessId: ctx.businessId,
      leadId: ctx.leadId,
      callId: ctx.callId,
      templateType: "appointment_confirm",
    });
  }

  // Notify business owner
  await sendSMS({
    to: biz.ownerPhone,
    from: biz.twilioNumber,
    body: getOwnerNotification(
      {
        businessName: biz.name,
        callerName,
        message: `New appointment booked: ${service} on ${date} at ${time}`,
      },
      "en" // Owner notifications always in English
    ),
    businessId: ctx.businessId,
    leadId: ctx.leadId,
    callId: ctx.callId,
    templateType: "owner_notify",
  });

  return {
    success: true,
    data: {
      appointmentId: appointment.id,
      message: ctx.language === "es"
        ? `Cita confirmada para ${service} el ${date} a las ${time}. Se envió un mensaje de confirmación.`
        : `Appointment confirmed for ${service} on ${date} at ${time}. A confirmation text has been sent.`,
    },
  };
}

async function handleTakeMessage(
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  const message = params.message as string;
  const callerName = params.caller_name as string | undefined;
  const isEmergency = message?.startsWith("[EMERGENCY]") ?? false;

  if (!message) return { success: false, error: "Message is required" };

  // Update lead name and append notes (preserve previous messages)
  if (ctx.leadId) {
    const [existingLead] = await db
      .select({ notes: leads.notes })
      .from(leads)
      .where(eq(leads.id, ctx.leadId))
      .limit(1);

    const updatedNotes = existingLead?.notes
      ? `${existingLead.notes}\n---\n${message}`
      : message;

    await db.update(leads).set({
      name: callerName || undefined,
      notes: updatedNotes,
      updatedAt: new Date().toISOString(),
    }).where(eq(leads.id, ctx.leadId));
  }

  // Notify business owner via SMS (urgent prefix for emergencies)
  const prefix = isEmergency ? "EMERGENCY - " : "";
  await sendSMS({
    to: biz.ownerPhone,
    from: biz.twilioNumber,
    body: `${prefix}${getOwnerNotification({ businessName: biz.name, callerName, message }, "en")}`,
    businessId: ctx.businessId,
    leadId: ctx.leadId,
    callId: ctx.callId,
    templateType: "owner_notify",
  });

  return {
    success: true,
    data: {
      message: ctx.language === "es"
        ? "Su mensaje ha sido enviado al dueño del negocio. Le contactarán pronto."
        : "Your message has been sent to the business owner. They'll get back to you soon.",
    },
  };
}

async function handleTransferToHuman(
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  const reason = params.reason as string | undefined;
  const isEmergency = reason?.startsWith("[EMERGENCY]") ?? false;

  // Flag the call for transfer (and emergency if applicable)
  if (ctx.callId) {
    await db.update(calls).set({
      transferRequested: true,
      ...(isEmergency ? { status: "emergency" } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, ctx.callId));

    // Update live monitoring — look up hume session from call record
    const [callRecord] = await db.select({ humeChitChatId: calls.humeChitChatId })
      .from(calls).where(eq(calls.id, ctx.callId)).limit(1);
    if (callRecord?.humeChitChatId) {
      updateActiveCall(
        { humeSessionId: callRecord.humeChitChatId },
        {
          status: "transferring",
          currentIntent: isEmergency ? "emergency" : "transfer",
          callType: isEmergency ? "emergency" : "transfer",
        },
      ).catch((err) => reportError("Failed to update active call for transfer", err));
    }
  }

  // Notify the business owner
  const biz = await getBusinessById(ctx.businessId);
  if (biz) {
    const prefix = isEmergency ? "EMERGENCY - " : "";
    const suffix = isEmergency ? " CALL THEM BACK IMMEDIATELY." : " Please call them back.";
    const smsBody = `${prefix}Transfer requested from ${ctx.callerPhone || "unknown caller"}${reason ? `: ${reason}` : ""}.${suffix}`;
    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber,
      body: smsBody,
      businessId: ctx.businessId,
      leadId: ctx.leadId,
      callId: ctx.callId,
      templateType: "owner_notify",
    });

    // Also SMS the emergency phone if set and this is an emergency transfer
    if (isEmergency && biz.emergencyPhone) {
      await sendSMS({
        to: biz.emergencyPhone,
        from: biz.twilioNumber,
        body: smsBody,
        businessId: ctx.businessId,
        leadId: ctx.leadId,
        callId: ctx.callId,
        templateType: "owner_notify",
      });
    }
  }

  if (isEmergency) {
    return {
      success: true,
      data: {
        message: ctx.language === "es"
          ? "He notificado al dueño con carácter de emergencia. Le llamarán de inmediato. Si hay peligro inmediato, por favor llame al 911."
          : "I've notified the owner as an emergency. They'll call you back immediately. If there's immediate danger, please call 911.",
      },
    };
  }

  return {
    success: true,
    data: {
      message: ctx.language === "es"
        ? "He notificado al dueño para que le devuelva la llamada lo antes posible."
        : "I've notified the owner to call you back as soon as possible.",
    },
  };
}

async function handleSubmitIntake(
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const answers = params.answers as Record<string, unknown> | undefined;
  const scopeDescription = params.scope_description as string | undefined;
  const scopeLevel = params.scope_level as "residential" | "commercial" | undefined;
  const urgency = params.urgency as "emergency" | "urgent" | "normal" | "flexible" | undefined;
  const intakeComplete = params.intake_complete as boolean | undefined;

  if (!answers || typeof answers !== "object") {
    return { success: false, error: "answers object is required" };
  }

  // Determine trade type from business
  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  const tradeType = biz.type || "other";
  const resolvedScope = scopeLevel || detectScopeLevel("", answers);

  try {
    const { id } = await saveJobIntake({
      businessId: ctx.businessId,
      callId: ctx.callId,
      leadId: ctx.leadId,
      tradeType,
      scopeLevel: resolvedScope,
      answers,
      scopeDescription: scopeDescription || "",
      urgency: urgency || "normal",
      intakeComplete: intakeComplete ?? false,
    });

    let message = ctx.language === "es"
      ? "Información del trabajo registrada correctamente."
      : "Job intake information has been recorded.";

    // If intake is complete and business has estimate pricing, append inline estimate
    if (intakeComplete && biz.estimateMode) {
      try {
        const { generateEstimate } = await import("@/lib/estimates/generator");
        const estimate = await generateEstimate(
          ctx.businessId,
          id,
          answers,
          tradeType,
          resolvedScope,
        );
        if (estimate.matched && estimate.min != null && estimate.max != null) {
          const min = estimate.min.toLocaleString("en-US", { maximumFractionDigits: 0 });
          const max = estimate.max.toLocaleString("en-US", { maximumFractionDigits: 0 });
          const caveat = ctx.language === "es"
            ? `El rango estimado para este trabajo es de $${min} a $${max}. El dueño revisará los detalles y confirmará el precio exacto.`
            : `The estimated range for this job is $${min} to $${max}. The owner will review the details and confirm the exact price.`;
          message += " " + caveat;
        }
      } catch {
        // Estimate generation is non-critical — don't fail the intake
      }
    }

    return {
      success: true,
      data: {
        intakeId: id,
        message,
      },
    };
  } catch (err) {
    reportError("Failed to save job intake", err, { extra: { callId: ctx.callId } });
    return { success: false, error: "Failed to save intake data" };
  }
}

async function handleReferPartner(
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const requestedTrade = params.requested_trade as string;
  const callerName = params.caller_name as string | undefined;
  const jobDescription = params.job_description as string | undefined;

  if (!requestedTrade) {
    return { success: false, error: "requested_trade is required" };
  }

  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  // Find the best partner for the requested trade
  const partner = await findBestPartner(ctx.businessId, requestedTrade);

  if (!partner) {
    return {
      success: true,
      data: {
        found: false,
        message: ctx.language === "es"
          ? `No tenemos un socio de ${requestedTrade} registrado en este momento. Puedo tomar su información y ${biz.ownerName} le recomendará a alguien.`
          : `We don't have a ${requestedTrade} partner on file right now. I can take your information and ${biz.ownerName} will recommend someone.`,
      },
    };
  }

  // Log the referral
  try {
    const referralId = await logReferral({
      referringBusinessId: ctx.businessId,
      partnerId: partner.id,
      callId: ctx.callId,
      callerName: callerName || undefined,
      callerPhone: ctx.callerPhone,
      requestedTrade,
      jobDescription,
      referralMethod: "info_shared",
    });

    // Notify partner and send info to caller (fire-and-forget)
    notifyPartner({ referralId }).catch((err) =>
      reportError("Partner notification failed", err, { extra: { referralId } }),
    );

    if (ctx.callerPhone) {
      sendPartnerInfoToCaller({
        callerPhone: ctx.callerPhone,
        businessId: ctx.businessId,
        partner,
        language: ctx.language,
        leadId: ctx.leadId,
        callId: ctx.callId,
      }).catch((err) =>
        reportError("Partner info SMS to caller failed", err, { extra: { referralId } }),
      );
    }

    return {
      success: true,
      data: {
        found: true,
        partnerName: partner.partnerName,
        partnerTrade: partner.partnerTrade,
        message: ctx.language === "es"
          ? `Tenemos un excelente socio de ${partner.partnerTrade}: ${partner.partnerName}. Les voy a notificar sobre usted y le enviaré su información por texto.`
          : `We have a great ${partner.partnerTrade} partner: ${partner.partnerName}. I'll notify them about you and text you their info.`,
      },
    };
  } catch (err) {
    reportError("Failed to process partner referral", err, { extra: { callId: ctx.callId } });
    return { success: false, error: "Failed to process referral" };
  }
}
