import type { Language } from "@/types";

interface AppointmentInfo {
  businessName: string;
  service: string;
  date: string;
  time: string;
}

interface MessageInfo {
  businessName: string;
  callerName?: string;
  message: string;
}

interface MissedCallInfo {
  businessName: string;
  callerPhone: string;
}

const templates = {
  appointment_confirm: {
    en: (info: AppointmentInfo) =>
      `Your appointment with ${info.businessName} is confirmed!\n\nService: ${info.service}\nDate: ${info.date}\nTime: ${info.time}\n\nReply CANCEL to cancel. We'll send a reminder 24hrs before.`,
    es: (info: AppointmentInfo) =>
      `¡Su cita con ${info.businessName} está confirmada!\n\nServicio: ${info.service}\nFecha: ${info.date}\nHora: ${info.time}\n\nResponda CANCELAR para cancelar. Le enviaremos un recordatorio 24hrs antes.`,
  },

  owner_notify: {
    en: (info: MessageInfo) =>
      `New message from ${info.callerName || "a caller"} for ${info.businessName}:\n\n"${info.message}"`,
    es: (info: MessageInfo) =>
      `Nuevo mensaje de ${info.callerName || "un llamante"} para ${info.businessName}:\n\n"${info.message}"`,
  },

  missed_call: {
    en: (info: MissedCallInfo) =>
      `Missed call for ${info.businessName} from ${info.callerPhone}. The AI assistant was unable to complete the call.`,
    es: (info: MissedCallInfo) =>
      `Llamada perdida para ${info.businessName} de ${info.callerPhone}. El asistente virtual no pudo completar la llamada.`,
  },

  reminder: {
    en: (info: AppointmentInfo) =>
      `Reminder: You have an appointment with ${info.businessName} tomorrow.\n\nService: ${info.service}\nTime: ${info.time}\n\nReply CANCEL to cancel.`,
    es: (info: AppointmentInfo) =>
      `Recordatorio: Tiene una cita con ${info.businessName} mañana.\n\nServicio: ${info.service}\nHora: ${info.time}\n\nResponda CANCELAR para cancelar.`,
  },
} as const;

export function getAppointmentConfirmation(info: AppointmentInfo, lang: Language): string {
  return templates.appointment_confirm[lang](info);
}

export function getOwnerNotification(info: MessageInfo, lang: Language): string {
  return templates.owner_notify[lang](info);
}

export function getMissedCallNotification(info: MissedCallInfo, lang: Language): string {
  return templates.missed_call[lang](info);
}

export function getReminderMessage(info: AppointmentInfo, lang: Language): string {
  return templates.reminder[lang](info);
}
