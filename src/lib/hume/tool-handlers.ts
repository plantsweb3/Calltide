import { db } from "@/db";
import { appointments, calls, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAvailability, bookSlot } from "@/lib/calendar/availability";
import { getBusinessById } from "@/lib/ai/context-builder";
import { sendSMS } from "@/lib/twilio/sms";
import { getAppointmentConfirmation, getOwnerNotification } from "@/lib/sms-templates";
import type { ToolResult, Language } from "@/types";

interface ToolCallContext {
  businessId: string;
  callId?: string;
  leadId?: string;
  callerPhone?: string;
  language: Language;
}

export async function dispatchToolCall(
  toolName: string,
  params: Record<string, unknown>,
  ctx: ToolCallContext
): Promise<ToolResult> {
  switch (toolName) {
    case "check_availability":
      return handleCheckAvailability(params, ctx);
    case "book_appointment":
      return handleBookAppointment(params, ctx);
    case "take_message":
      return handleTakeMessage(params, ctx);
    case "transfer_to_human":
      return handleTransferToHuman(params, ctx);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
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

  if (!message) return { success: false, error: "Message is required" };

  // Update lead name and notes
  if (ctx.leadId) {
    await db.update(leads).set({
      name: callerName || undefined,
      notes: message,
      updatedAt: new Date().toISOString(),
    }).where(eq(leads.id, ctx.leadId));
  }

  // Notify business owner via SMS
  await sendSMS({
    to: biz.ownerPhone,
    from: biz.twilioNumber,
    body: getOwnerNotification({ businessName: biz.name, callerName, message }, "en"),
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

  // Flag the call for transfer
  if (ctx.callId) {
    await db.update(calls).set({
      transferRequested: true,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, ctx.callId));
  }

  // Notify the business owner
  const biz = await getBusinessById(ctx.businessId);
  if (biz) {
    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber,
      body: `Transfer requested from ${ctx.callerPhone || "unknown caller"}${reason ? `: ${reason}` : ""}. Please call them back.`,
      businessId: ctx.businessId,
      leadId: ctx.leadId,
      callId: ctx.callId,
      templateType: "owner_notify",
    });
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
