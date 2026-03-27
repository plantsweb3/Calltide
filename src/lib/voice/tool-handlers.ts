import { db } from "@/db";
import { appointments, calls, leads, customers, technicians, smsOptOuts, callbacks } from "@/db/schema";
import { eq, and, ne, gte, isNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { checkAvailability, bookSlot } from "@/lib/calendar/availability";
import { getBusinessById } from "@/lib/ai/context-builder";
import { sendSMS } from "@/lib/twilio/sms";
import { getAppointmentConfirmation, getOwnerNotification } from "@/lib/sms-templates";
import { updateActiveCall } from "@/lib/monitoring/active-calls";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";
import { saveJobIntake, detectScopeLevel } from "@/lib/intake";
import { findBestPartner, logReferral, notifyPartner, sendPartnerInfoToCaller } from "@/lib/referrals/partners";
import { normalizePhone } from "@/lib/compliance/sms";
import type { ToolResult, Language } from "@/types";

/**
 * Normalize time formats from AI (e.g. "9:00 AM" → "09:00", "2:30 PM" → "14:30")
 * to match the 24-hour "HH:MM" format used by the availability system.
 */
function normalizeTime(time: string): string {
  // Already in HH:MM format
  if (/^\d{2}:\d{2}$/.test(time)) return time;

  // Match 12-hour formats: "9:00 AM", "2:30 PM", "9AM", "2:30PM", etc.
  const match = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm|a\.m\.|p\.m\.)?$/i);
  if (!match) return time; // Can't parse — return as-is

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase().replace(/\./g, "");

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// --- Zod schemas for tool parameters ---

const checkAvailabilitySchema = z.object({
  date: z.string().min(1, "date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD format"),
  service: z.string().optional(),
});

const bookAppointmentSchema = z.object({
  date: z.string().min(1, "date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD format"),
  time: z.string().min(1, "time is required"),
  service: z.string().min(1, "service is required"),
  caller_name: z.string().optional(),
  caller_phone: z.string().optional(),
});

const takeMessageSchema = z.object({
  message: z.string().min(1, "message is required"),
  caller_name: z.string().optional(),
  caller_phone: z.string().optional(),
});

const transferToHumanSchema = z.object({
  reason: z.string().optional(),
});

const submitIntakeSchema = z.object({
  answers: z.record(z.string(), z.unknown()).refine((v) => v !== null && typeof v === "object", {
    message: "answers must be a non-null object",
  }),
  scope_description: z.string().optional(),
  scope_level: z.enum(["residential", "commercial"]).optional(),
  urgency: z.enum(["emergency", "urgent", "normal", "flexible"]).optional(),
  intake_complete: z.boolean().optional(),
});

const referPartnerSchema = z.object({
  requested_trade: z.string().min(1, "requested_trade is required"),
  caller_name: z.string().optional(),
  job_description: z.string().optional(),
});

const lookupAppointmentsSchema = z.object({
  caller_phone: z.string().optional(),
});

const cancelAppointmentSchema = z.object({
  appointment_id: z.string().min(1, "appointment_id is required"),
  reason: z.string().optional(),
});

const rescheduleAppointmentSchema = z.object({
  appointment_id: z.string().min(1, "appointment_id is required"),
  new_date: z.string().min(1, "new_date is required"),
  new_time: z.string().min(1, "new_time is required"),
});

const scheduleCallbackSchema = z.object({
  callback_time: z.string().min(1, "callback_time is required"),
  caller_name: z.string().optional(),
  reason: z.string().optional(),
});

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
  lookup_appointments: "booking",
  cancel_appointment: "booking",
  reschedule_appointment: "booking",
  schedule_callback: "callback",
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
    case "lookup_appointments":
      result = await handleLookupAppointments(params, ctx);
      break;
    case "cancel_appointment":
      result = await handleCancelAppointment(params, ctx);
      break;
    case "reschedule_appointment":
      result = await handleRescheduleAppointment(params, ctx);
      break;
    case "schedule_callback":
      result = await handleScheduleCallback(params, ctx);
      break;
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }

  // Update active call intent for live monitoring (fire-and-forget, non-transfer tools only)
  const intent = TOOL_INTENT_MAP[toolName];
  if (intent && toolName !== "transfer_to_human" && ctx.callId) {
    const [cr] = await db.select({ convId: calls.elevenlabsConversationId, sid: calls.twilioCallSid })
      .from(calls).where(eq(calls.id, ctx.callId)).limit(1);
    if (cr) {
      updateActiveCall({ sessionId: cr.sid || cr.convId || undefined }, {
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
  const parsed = checkAvailabilitySchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { date, service } = parsed.data;

  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  // Prevent booking in the past
  const bizToday = new Date().toLocaleDateString("en-CA", { timeZone: biz.timezone });
  if (date < bizToday) {
    return {
      success: true,
      data: {
        available: false,
        message: ctx.language === "es"
          ? `La fecha ${date} ya pasó. ¿Le gustaría consultar disponibilidad para una fecha futura?`
          : `The date ${date} is in the past. Would you like to check availability for a future date?`,
        slots: [],
      },
    };
  }

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
  const parsed = bookAppointmentSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { date, service, caller_name: callerName } = parsed.data;
  const time = normalizeTime(parsed.data.time);

  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  // Validate service against known services for this business
  if (biz.services && Array.isArray(biz.services) && biz.services.length > 0) {
    const normalizedService = service.toLowerCase().trim();
    const matchedService = biz.services.find((s: string) => {
      const ns = s.toLowerCase().trim();
      return ns === normalizedService || normalizedService.includes(ns) || ns.includes(normalizedService);
    });
    if (!matchedService) {
      const serviceList = biz.services.slice(0, 8).join(", ");
      return {
        success: false,
        error: ctx.language === "es"
          ? `No ofrecemos "${service}". Nuestros servicios incluyen: ${serviceList}. ¿Cuál de estos necesita?`
          : `We don't offer "${service}". Our services include: ${serviceList}. Which of these do you need?`,
      };
    }
  }

  // Early availability check (the transactional conflict check below is the real double-booking guard)
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

  // Atomic conflict check + insert using transaction to prevent double-booking
  let appointment: { id: string } | undefined;
  try {
    const result = await db.transaction(async (tx) => {
      const existing = await tx
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
        return null; // Slot taken
      }

      // Look up service duration from business config
      const serviceDurations = biz.serviceDurations;
      let duration = 60;
      if (serviceDurations) {
        const normalizedSvc = service.toLowerCase().trim();
        const match = Object.entries(serviceDurations).find(
          ([key]) => key.toLowerCase().trim() === normalizedSvc ||
            normalizedSvc.includes(key.toLowerCase().trim()),
        );
        if (match) duration = match[1];
      }

      const [created] = await tx.insert(appointments).values({
        businessId: ctx.businessId,
        leadId: ctx.leadId ?? "",
        callId: ctx.callId,
        service,
        date,
        time,
        duration,
        status: "confirmed",
      }).returning();

      return created;
    });

    if (!result) {
      return { success: false, error: "That time slot was just booked. Please choose another time." };
    }
    appointment = result;
  } catch (_err) {
    return { success: false, error: "Unable to book appointment. Please try again." };
  }

  // Push to Google Calendar (fire-and-forget)
  import("@/lib/calendar/google-calendar").then(({ createCalendarEvent, storeEventId }) => {
    createCalendarEvent({
      businessId: ctx.businessId,
      summary: `${service} — ${callerName || "Customer"}`,
      description: `Booked via ${biz.receptionistName || "Maria"}. Call ID: ${ctx.callId || "N/A"}`,
      date,
      time,
      timezone: biz.timezone,
    }).then((eventId) => {
      if (eventId && appointment) {
        storeEventId(appointment.id, eventId).catch((err) =>
          reportError("Failed to store Google Calendar event ID", err, { businessId: ctx.businessId }),
        );
      }
    }).catch((err) => reportError("Failed to push appointment to Google Calendar", err, { businessId: ctx.businessId }));
  }).catch(() => {});

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

  // Fire webhook (fire-and-forget)
  import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
    dispatchWebhook(ctx.businessId, "appointment.created", {
      appointmentId: appointment.id,
      service,
      date,
      time,
      callerName,
      callerPhone: ctx.callerPhone,
      callId: ctx.callId,
    }).catch(() => {});
  }).catch(() => {});

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
  const parsed = takeMessageSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { message, caller_name: callerName } = parsed.data;

  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  // Detect emergency via explicit tag or keyword scan
  const EMERGENCY_KEYWORDS = [
    // English
    "emergency", "urgent", "gas leak", "flooding", "flood",
    "no heat", "no hot water", "pipe burst", "water leak",
    "fire", "carbon monoxide", "sewage backup", "no power", "electrical fire",
    // Spanish
    "emergencia", "urgente", "fuga de gas", "inundación", "inundado",
    "sin calefacción", "sin agua caliente", "tubería rota", "fuga de agua",
    "fuego", "incendio", "monóxido de carbono", "aguas negras", "sin electricidad",
  ];
  const messageLower = message.toLowerCase();
  const isEmergency = message.startsWith("[EMERGENCY]") ||
    EMERGENCY_KEYWORDS.some((kw) => messageLower.includes(kw));

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

  // Emergency dispatch: notify on-call technicians
  let dispatchedCount = 0;
  if (isEmergency) {
    try {
      const onCallTechs = await db
        .select({ id: technicians.id, name: technicians.name, phone: technicians.phone })
        .from(technicians)
        .where(
          and(
            eq(technicians.businessId, ctx.businessId),
            eq(technicians.isActive, true),
            eq(technicians.isOnCall, true),
          )
        );

      const callerDisplay = callerName || "Unknown caller";
      const phoneDisplay = ctx.callerPhone || "No phone provided";

      for (const tech of onCallTechs) {
        if (!tech.phone) continue;

        // Respect SMS opt-out
        const [optOut] = await db
          .select({ id: smsOptOuts.id })
          .from(smsOptOuts)
          .where(and(eq(smsOptOuts.phoneNumber, normalizePhone(tech.phone)), isNull(smsOptOuts.reoptedInAt)))
          .limit(1);
        if (optOut) continue;

        await sendSMS({
          to: tech.phone,
          from: biz.twilioNumber,
          body: [
            `EMERGENCY DISPATCH`,
            `Business: ${biz.name}`,
            `Customer: ${callerDisplay}`,
            `Phone: ${phoneDisplay}`,
            `Problem: ${message}`,
            `Please respond ASAP.`,
          ].join("\n"),
          businessId: ctx.businessId,
          callId: ctx.callId,
          templateType: "emergency_dispatch",
        });

        dispatchedCount++;
      }

      if (dispatchedCount > 0) {
        // Notify owner that technicians have been dispatched
        const techNames = onCallTechs.filter((t) => t.phone).map((t) => t.name).join(", ");
        await sendSMS({
          to: biz.ownerPhone,
          from: biz.twilioNumber,
          body: `Emergency dispatch sent to on-call technician(s): ${techNames}. Customer: ${callerDisplay} (${phoneDisplay}).`,
          businessId: ctx.businessId,
          callId: ctx.callId,
          templateType: "owner_notify",
        });

        await logActivity({
          type: "emergency_dispatch",
          entityType: "call",
          entityId: ctx.callId,
          title: `Emergency dispatch: ${callerDisplay}`,
          detail: `Dispatched to: ${techNames}. Problem: ${message}`,
          metadata: {
            businessId: ctx.businessId,
            callerPhone: ctx.callerPhone,
            technicianNames: techNames,
          },
        });
      } else {
        // No technicians could be reached — escalate directly to owner
        await sendSMS({
          to: biz.ownerPhone,
          from: biz.twilioNumber,
          body: `EMERGENCY: ${callerDisplay} (${phoneDisplay}) — ${message} — No on-call technicians could be reached via SMS. Please respond immediately.`,
          businessId: ctx.businessId,
          callId: ctx.callId,
          templateType: "owner_notify",
        });

        await logActivity({
          type: "emergency_dispatch",
          entityType: "call",
          entityId: ctx.callId,
          title: `Emergency escalation (no techs): ${callerDisplay}`,
          detail: `No on-call technicians reached. Owner notified directly. Problem: ${message}`,
          metadata: {
            businessId: ctx.businessId,
            callerPhone: ctx.callerPhone,
          },
        });
      }
    } catch (err) {
      reportError("Emergency dispatch failed", err, { businessId: ctx.businessId, extra: { callId: ctx.callId } });
    }
  }

  // Auto-create follow-up task (fire-and-forget, non-critical)
  try {
    const { followUps } = await import("@/db/schema");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // Look up customerId from the call record
    let customerId: string | null = null;
    if (ctx.callId) {
      const [callRec] = await db.select({ customerId: calls.customerId }).from(calls).where(eq(calls.id, ctx.callId)).limit(1);
      customerId = callRec?.customerId || null;
    }

    await db.insert(followUps).values({
      businessId: ctx.businessId,
      callId: ctx.callId || null,
      customerId,
      title: `Follow up: ${callerName || "Caller"} — ${message.slice(0, 100)}`,
      description: message,
      dueDate: tomorrow.toISOString(),
      priority: isEmergency ? "urgent" : "normal",
    });

    // Update call record
    if (ctx.callId) {
      await db.update(calls).set({ followUpCreated: true }).where(eq(calls.id, ctx.callId));
    }
  } catch (err) {
    // Non-critical — don't break the tool response
    console.error("[follow-up] auto-create failed:", err);
  }

  // Detect complaints and auto-create ticket (fire-and-forget, non-critical)
  // Strong keywords trigger complaint alone; weak keywords require 2+ matches
  const strongComplaintKeywords = ["sue", "lawyer", "bbb", "scam", "rip off"];
  const weakComplaintKeywords = ["complaint", "unhappy", "terrible", "awful", "worst", "angry", "furious", "unacceptable", "refund"];
  const hasStrongKeyword = strongComplaintKeywords.some(kw => messageLower.includes(kw));
  const weakMatches = weakComplaintKeywords.filter(kw => messageLower.includes(kw));
  const isComplaint = hasStrongKeyword || weakMatches.length >= 2;

  if (isComplaint) {
    try {
      const { complaintTickets } = await import("@/db/schema");

      let complaintCustomerId: string | null = null;
      if (ctx.callId) {
        const [callRec] = await db.select({ customerId: calls.customerId }).from(calls).where(eq(calls.id, ctx.callId)).limit(1);
        complaintCustomerId = callRec?.customerId || null;
      }

      await db.insert(complaintTickets).values({
        businessId: ctx.businessId,
        callId: ctx.callId || null,
        customerId: complaintCustomerId,
        customerPhone: ctx.callerPhone || null,
        severity: messageLower.includes("lawyer") || messageLower.includes("sue") ? "critical" : "high",
        category: "service_quality",
        description: message,
      });
    } catch (err) {
      console.error("[complaint] auto-create failed:", err);
    }
  }

  const ownerName = biz.ownerName || (ctx.language === "es" ? "el dueño" : "the owner");

  // Adjust response if technicians were dispatched
  if (dispatchedCount > 0) {
    return {
      success: true,
      data: {
        message: ctx.language === "es"
          ? `Hemos enviado un técnico de emergencia. ${ownerName} también ha sido notificado.`
          : `We've dispatched an emergency technician. ${ownerName} has also been notified.`,
      },
    };
  }

  // Emergency but no on-call techs actually reached — notify caller accurately
  if (isEmergency) {
    const { getEmergencySafetyInstructions } = await import("@/lib/receptionist/emergency-instructions");
    const safetyTip = getEmergencySafetyInstructions(message, ctx.language);
    const safetyLine = safetyTip ? ` ${safetyTip}` : "";

    // Fire webhook (fire-and-forget)
    import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
      dispatchWebhook(ctx.businessId, "message.taken", {
        callerName, message, isEmergency: true, callId: ctx.callId,
      }).catch(() => {});
    }).catch(() => {});

    return {
      success: true,
      data: {
        message: ctx.language === "es"
          ? `He notificado a ${ownerName} directamente sobre esta emergencia. Se comunicará con usted en breve.${safetyLine} Si hay peligro inmediato, por favor llame al 911.`
          : `I've notified ${ownerName} directly about this emergency. They will be in touch shortly.${safetyLine} If there's immediate danger, please call 911.`,
      },
    };
  }

  // Fire webhook (fire-and-forget)
  import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
    dispatchWebhook(ctx.businessId, "message.taken", {
      callerName, message, isEmergency: false, callId: ctx.callId,
    }).catch(() => {});
  }).catch(() => {});

  return {
    success: true,
    data: {
      message: ctx.language === "es"
        ? `Su mensaje ha sido enviado a ${ownerName}. Le contactará pronto.`
        : `Your message has been sent to ${ownerName}. They'll get back to you soon.`,
    },
  };
}

async function handleTransferToHuman(
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  const parsed = transferToHumanSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { reason } = parsed.data;
  const isEmergency = reason?.startsWith("[EMERGENCY]") ?? false;

  // Flag the call for transfer (and emergency if applicable)
  if (ctx.callId) {
    await db.update(calls).set({
      transferRequested: true,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, ctx.callId));

    // Update live monitoring
    const [callRecord] = await db.select({ twilioCallSid: calls.twilioCallSid })
      .from(calls).where(eq(calls.id, ctx.callId)).limit(1);
    if (callRecord?.twilioCallSid) {
      updateActiveCall(
        { twilioCallSid: callRecord.twilioCallSid },
        {
          status: "transferring",
          currentIntent: isEmergency ? "emergency" : "transfer",
          callType: isEmergency ? "emergency" : "transfer",
        },
      ).catch((err) => reportError("Failed to update active call for transfer", err));
    }
  }

  // Get business info for transfer
  const biz = await getBusinessById(ctx.businessId);
  if (!biz) {
    return {
      success: false,
      error: "Unable to look up business for transfer",
    };
  }

  // Attempt warm transfer via Twilio conference
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  let warmTransferInitiated = false;

  if (twilioSid && twilioToken && biz.ownerPhone && biz.twilioNumber && ctx.callId) {
    try {
      // Look up the original call's Twilio SID
      const [callRecord] = await db.select({ twilioCallSid: calls.twilioCallSid })
        .from(calls).where(eq(calls.id, ctx.callId)).limit(1);

      if (callRecord?.twilioCallSid) {
        const twilio = (await import("twilio")).default;
        const twilioClient = twilio(twilioSid, twilioToken);
        const confName = `transfer-${ctx.callId}`;
        const callerDisplay = ctx.callerPhone || "a caller";
        const briefing = isEmergency
          ? `Emergency transfer. ${callerDisplay} needs immediate help. ${reason ? `Reason: ${reason.replace("[EMERGENCY]", "").trim()}` : ""}`
          : `Incoming transfer from ${callerDisplay}. ${reason || "The caller requested to speak with you."}`;

        // Call the owner with a briefing, then join them to a conference
        await twilioClient.calls.create({
          to: biz.ownerPhone,
          from: biz.twilioNumber,
          twiml: `<Response><Say voice="Polly.Joanna">${briefing} Connecting you now.</Say><Dial><Conference>${confName}</Conference></Dial></Response>`,
          statusCallback: `${appUrl}/api/webhooks/twilio/status`,
          statusCallbackMethod: "POST",
        });

        // Move the original caller into the same conference
        await twilioClient.calls(callRecord.twilioCallSid).update({
          twiml: `<Response><Say voice="Polly.Joanna">${ctx.language === "es" ? "Conectándole ahora. Un momento." : "Connecting you now. One moment."}</Say><Dial><Conference>${confName}</Conference></Dial></Response>`,
        });

        warmTransferInitiated = true;
      }
    } catch (err) {
      reportError("Warm transfer failed, falling back to SMS", err, {
        extra: { businessId: ctx.businessId, callId: ctx.callId },
      });
    }
  }

  // Always send SMS notification (backup even if warm transfer works)
  const prefix = isEmergency ? "EMERGENCY - " : "";
  const suffix = warmTransferInitiated
    ? " Warm transfer initiated — they should be on the line."
    : isEmergency ? " CALL THEM BACK IMMEDIATELY." : " Please call them back.";
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

  if (warmTransferInitiated) {
    return {
      success: true,
      data: {
        message: ctx.language === "es"
          ? "Estoy conectándole con el dueño ahora mismo. Un momento por favor."
          : "I'm connecting you with the owner right now. One moment please.",
      },
    };
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
  const parsed = submitIntakeSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const {
    answers,
    scope_description: scopeDescription,
    scope_level: scopeLevel,
    urgency,
    intake_complete: intakeComplete,
  } = parsed.data;

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
  const parsed = referPartnerSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const {
    requested_trade: requestedTrade,
    caller_name: callerName,
    job_description: jobDescription,
  } = parsed.data;

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

async function handleLookupAppointments(
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const parsed = lookupAppointmentsSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const rawPhone = parsed.data.caller_phone || ctx.callerPhone;
  if (!rawPhone) {
    return {
      success: false,
      error: ctx.language === "es"
        ? "No se pudo identificar su número de teléfono para buscar citas."
        : "Could not identify your phone number to look up appointments.",
    };
  }

  const phone = normalizePhone(rawPhone);

  // Query leads directly by phone number (avoids fetching all leads and filtering in memory)
  const matchingLeads = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.businessId, ctx.businessId), eq(leads.phone, phone)))
    .limit(10);

  const leadIds = matchingLeads.map((l) => l.id);

  if (leadIds.length === 0) {
    return {
      success: true,
      data: {
        appointments: [],
        message: ctx.language === "es"
          ? "No encontré citas asociadas a su número de teléfono."
          : "I couldn't find any appointments associated with your phone number.",
      },
    };
  }

  // Find upcoming confirmed appointments for this caller's leads
  const biz = await getBusinessById(ctx.businessId);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: biz?.timezone || "America/Chicago" });
  const upcomingAppointments = await db
    .select({
      id: appointments.id,
      service: appointments.service,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, ctx.businessId),
        inArray(appointments.leadId, leadIds),
        eq(appointments.status, "confirmed"),
        gte(appointments.date, today),
      ),
    )
    .orderBy(appointments.date, appointments.time)
    .limit(5);

  if (upcomingAppointments.length === 0) {
    return {
      success: true,
      data: {
        appointments: [],
        message: ctx.language === "es"
          ? "No tiene citas próximas programadas."
          : "You don't have any upcoming appointments scheduled.",
      },
    };
  }

  return {
    success: true,
    data: {
      appointments: upcomingAppointments.map((a) => ({
        id: a.id,
        service: a.service,
        date: a.date,
        time: a.time,
      })),
      message: ctx.language === "es"
        ? `Encontré ${upcomingAppointments.length} cita(s) próxima(s).`
        : `I found ${upcomingAppointments.length} upcoming appointment(s).`,
    },
  };
}

async function handleCancelAppointment(
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const parsed = cancelAppointmentSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { appointment_id: appointmentId, reason } = parsed.data;

  // Find the appointment and verify it belongs to this business AND this caller
  const [appt] = await db
    .select({
      id: appointments.id,
      service: appointments.service,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      leadId: appointments.leadId,
      googleCalendarEventId: appointments.googleCalendarEventId,
    })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, ctx.businessId)))
    .limit(1);

  if (!appt) {
    return {
      success: false,
      error: ctx.language === "es"
        ? "No encontré esa cita."
        : "I couldn't find that appointment.",
    };
  }

  // Verify caller owns this appointment via leadId or phone match
  if (ctx.leadId && appt.leadId && appt.leadId !== ctx.leadId) {
    return {
      success: false,
      error: ctx.language === "es"
        ? "No tiene permiso para cancelar esa cita."
        : "You don't have permission to cancel that appointment.",
    };
  }
  // When leadId is missing, fall back to phone match for ownership
  if (!ctx.leadId && appt.leadId) {
    const [apptLead] = await db
      .select({ phone: leads.phone })
      .from(leads)
      .where(eq(leads.id, appt.leadId))
      .limit(1);
    if (apptLead?.phone && ctx.callerPhone && normalizePhone(apptLead.phone) !== normalizePhone(ctx.callerPhone)) {
      return {
        success: false,
        error: ctx.language === "es"
          ? "No tiene permiso para cancelar esa cita."
          : "You don't have permission to cancel that appointment.",
      };
    }
  }

  if (appt.status === "cancelled") {
    return {
      success: true,
      data: {
        message: ctx.language === "es"
          ? "Esa cita ya fue cancelada."
          : "That appointment has already been cancelled.",
      },
    };
  }

  // Cancel the appointment
  await db
    .update(appointments)
    .set({
      status: "cancelled",
      notes: reason ? `Cancelled by caller: ${reason}` : "Cancelled by caller during call",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(appointments.id, appointmentId));

  // Delete from Google Calendar (fire-and-forget)
  if (appt.googleCalendarEventId) {
    import("@/lib/calendar/google-calendar").then(({ deleteCalendarEvent }) => {
      deleteCalendarEvent(ctx.businessId, appt.googleCalendarEventId!).catch((err) =>
        reportError("Failed to delete Google Calendar event on cancel", err),
      );
    }).catch(() => {});
  }

  // Notify business owner
  const biz = await getBusinessById(ctx.businessId);
  if (biz) {
    const cancelMsg = `Appointment cancelled: ${appt.service} on ${appt.date} at ${appt.time}.${reason ? ` Reason: ${reason}` : ""}`;
    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber,
      body: getOwnerNotification({ businessName: biz.name, message: cancelMsg }, "en"),
      businessId: ctx.businessId,
      leadId: ctx.leadId,
      callId: ctx.callId,
      templateType: "owner_notify",
    });
  }

  // Fire webhook (fire-and-forget)
  import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
    dispatchWebhook(ctx.businessId, "appointment.cancelled", {
      appointmentId,
      service: appt.service,
      date: appt.date,
      time: appt.time,
      reason: reason || null,
      callId: ctx.callId,
    }).catch(() => {});
  }).catch(() => {});

  return {
    success: true,
    data: {
      message: ctx.language === "es"
        ? `Su cita de ${appt.service} para el ${appt.date} a las ${appt.time} ha sido cancelada. Se notificó al negocio.`
        : `Your ${appt.service} appointment on ${appt.date} at ${appt.time} has been cancelled. The business has been notified.`,
    },
  };
}

async function handleRescheduleAppointment(
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const parsed = rescheduleAppointmentSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { appointment_id: appointmentId, new_date: newDate } = parsed.data;
  const newTime = normalizeTime(parsed.data.new_time);

  // Find the existing appointment
  const [appt] = await db
    .select({
      id: appointments.id,
      service: appointments.service,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      leadId: appointments.leadId,
      googleCalendarEventId: appointments.googleCalendarEventId,
    })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, ctx.businessId)))
    .limit(1);

  if (!appt) {
    return {
      success: false,
      error: ctx.language === "es"
        ? "No encontré esa cita."
        : "I couldn't find that appointment.",
    };
  }

  // Verify caller owns this appointment via leadId or phone match
  if (ctx.leadId && appt.leadId && appt.leadId !== ctx.leadId) {
    return {
      success: false,
      error: ctx.language === "es"
        ? "No tiene permiso para reprogramar esa cita."
        : "You don't have permission to reschedule that appointment.",
    };
  }
  // When leadId is missing, fall back to phone match for ownership
  if (!ctx.leadId && appt.leadId) {
    const [apptLead] = await db
      .select({ phone: leads.phone })
      .from(leads)
      .where(eq(leads.id, appt.leadId))
      .limit(1);
    if (apptLead?.phone && ctx.callerPhone && normalizePhone(apptLead.phone) !== normalizePhone(ctx.callerPhone)) {
      return {
        success: false,
        error: ctx.language === "es"
          ? "No tiene permiso para reprogramar esa cita."
          : "You don't have permission to reschedule that appointment.",
      };
    }
  }

  if (appt.status !== "confirmed") {
    return {
      success: false,
      error: ctx.language === "es"
        ? "Esa cita no se puede reprogramar porque no está activa."
        : "That appointment can't be rescheduled because it's not active.",
    };
  }

  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  // Check availability OUTSIDE transaction to avoid holding DB connection during Google Calendar API call
  const slots = await checkAvailability(biz, newDate, appt.service);
  const slotAvailable = slots.some((s) => s.available && s.time === newTime);

  if (!slotAvailable) {
    return {
      success: false,
      error: ctx.language === "es"
        ? `El horario ${newTime} del ${newDate} no está disponible. ¿Le gustaría intentar otra fecha u hora?`
        : `The ${newTime} slot on ${newDate} isn't available. Would you like to try another date or time?`,
    };
  }

  // Atomic reschedule: DB conflict check + update in transaction to prevent double-booking
  const rescheduleResult = await db.transaction(async (tx) => {
    // Check for conflicts in the new slot (DB-level double-booking prevention)
    const conflicting = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, ctx.businessId),
          eq(appointments.date, newDate),
          eq(appointments.time, newTime),
          eq(appointments.status, "confirmed"),
          ne(appointments.id, appointmentId), // Exclude current appointment
        ),
      )
      .limit(1);

    if (conflicting.length > 0) {
      return { success: false as const, reason: "conflict" };
    }

    // Update the appointment to the new date/time
    await tx
      .update(appointments)
      .set({
        date: newDate,
        time: newTime,
        notes: `Rescheduled from ${appt.date} at ${appt.time}`,
        reminderSent: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(appointments.id, appointmentId));

    return { success: true as const };
  });

  if (!rescheduleResult.success) {
    return {
      success: false,
      error: ctx.language === "es"
        ? `El horario ${newTime} del ${newDate} no está disponible. ¿Le gustaría intentar otra fecha u hora?`
        : `The ${newTime} slot on ${newDate} isn't available. Would you like to try another date or time?`,
    };
  }

  // Update Google Calendar event (fire-and-forget)
  if (appt.googleCalendarEventId) {
    import("@/lib/calendar/google-calendar").then(({ updateCalendarEvent }) => {
      updateCalendarEvent(ctx.businessId, appt.googleCalendarEventId!, {
        date: newDate,
        time: newTime,
        timezone: biz.timezone,
      }).catch((err) =>
        reportError("Failed to update Google Calendar event on reschedule", err),
      );
    }).catch(() => {});
  }

  // Send confirmation SMS to caller
  if (ctx.callerPhone) {
    await sendSMS({
      to: ctx.callerPhone,
      from: biz.twilioNumber,
      body: getAppointmentConfirmation(
        { businessName: biz.name, service: appt.service, date: newDate, time: newTime },
        ctx.language,
      ),
      businessId: ctx.businessId,
      leadId: ctx.leadId,
      callId: ctx.callId,
      templateType: "appointment_confirm",
    });
  }

  // Notify business owner
  const rescheduleMsg = `Appointment rescheduled: ${appt.service} moved from ${appt.date} at ${appt.time} to ${newDate} at ${newTime}.`;
  await sendSMS({
    to: biz.ownerPhone,
    from: biz.twilioNumber,
    body: getOwnerNotification({ businessName: biz.name, message: rescheduleMsg }, "en"),
    businessId: ctx.businessId,
    leadId: ctx.leadId,
    callId: ctx.callId,
    templateType: "owner_notify",
  });

  // Fire webhook (fire-and-forget)
  import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
    dispatchWebhook(ctx.businessId, "appointment.rescheduled", {
      appointmentId,
      service: appt.service,
      previousDate: appt.date,
      previousTime: appt.time,
      newDate,
      newTime,
      callId: ctx.callId,
    }).catch(() => {});
  }).catch(() => {});

  return {
    success: true,
    data: {
      message: ctx.language === "es"
        ? `Su cita de ${appt.service} ha sido reprogramada para el ${newDate} a las ${newTime}. Se envió un texto de confirmación.`
        : `Your ${appt.service} appointment has been rescheduled to ${newDate} at ${newTime}. A confirmation text has been sent.`,
    },
  };
}

async function handleScheduleCallback(
  params: Record<string, unknown>,
  ctx: ToolCallContext,
): Promise<ToolResult> {
  const parsed = scheduleCallbackSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { callback_time: callbackTime, caller_name: callerName, reason } = parsed.data;

  const biz = await getBusinessById(ctx.businessId);
  if (!biz) return { success: false, error: "Business not found" };

  // Update lead name if provided
  if (callerName && ctx.leadId) {
    await db.update(leads).set({ name: callerName }).where(eq(leads.id, ctx.leadId));
  }

  try {
    const [cb] = await db.insert(callbacks).values({
      businessId: ctx.businessId,
      callId: ctx.callId || null,
      customerPhone: ctx.callerPhone || "unknown",
      customerName: callerName || null,
      reason: reason || null,
      requestedTime: callbackTime,
      status: "scheduled",
    }).returning();

    // Notify the business owner via SMS
    const callerDisplay = callerName || "A caller";
    const reasonLine = reason ? ` — ${reason}` : "";
    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber,
      body: `Callback requested: ${callerDisplay} at ${callbackTime}${reasonLine}. Phone: ${ctx.callerPhone || "unknown"}.`,
      businessId: ctx.businessId,
      leadId: ctx.leadId,
      callId: ctx.callId,
      templateType: "owner_notify",
    });

    // Log activity (fire-and-forget)
    logActivity({
      type: "callback_scheduled",
      entityType: "callback",
      entityId: cb.id,
      title: `Callback scheduled: ${callerDisplay}`,
      detail: `Requested for ${callbackTime}${reasonLine}`,
      metadata: {
        businessId: ctx.businessId,
        callerPhone: ctx.callerPhone,
        callbackTime,
      },
    }).catch((err) => reportError("Failed to log callback activity", err));

    return {
      success: true,
      data: {
        callbackId: cb.id,
        message: ctx.language === "es"
          ? `Perfecto, le hemos agendado una llamada de vuelta para ${callbackTime}. ${biz.ownerName || "El dueño"} le llamará a ese horario.`
          : `Got it, we've scheduled a callback for ${callbackTime}. ${biz.ownerName || "The owner"} will call you back at that time.`,
      },
    };
  } catch (err) {
    reportError("Failed to schedule callback", err, { extra: { callId: ctx.callId } });
    return { success: false, error: "Failed to schedule callback" };
  }
}
