/**
 * Lightweight i18n string system for the Capta dashboard.
 *
 * Usage:
 *   import { t, type Lang } from "@/lib/i18n/strings";
 *   const label = t("metric.callsToday", lang);
 *   const withName = t("setup.letsGet", lang, { name: "Maria" });
 */

export type Lang = "en" | "es";

const strings: Record<string, Record<Lang, string>> = {
  // ── Greetings ──────────────────────────────────────────────
  "greeting.morning": { en: "Good morning", es: "Buenos dias" },
  "greeting.afternoon": { en: "Good afternoon", es: "Buenas tardes" },
  "greeting.evening": { en: "Good evening", es: "Buenas noches" },
  "greeting.welcome": { en: "Welcome to Capta", es: "Bienvenido a Capta" },
  "greeting.hereIsHow": {
    en: "Here's how {name} is performing",
    es: "Asi va {name} con tu negocio",
  },
  "greeting.hey": { en: "Hey", es: "Hola" },

  // ── Metric labels ──────────────────────────────────────────
  "metric.callsToday": { en: "Calls Today", es: "Llamadas hoy" },
  "metric.appointmentsThisWeek": {
    en: "Appointments This Week",
    es: "Citas esta semana",
  },
  "metric.missedCallsSaved": {
    en: "Missed Calls Saved",
    es: "Llamadas perdidas recuperadas",
  },
  "metric.totalCalls": { en: "Total Calls", es: "Total de llamadas" },
  "metric.revenueThisMonth": {
    en: "Revenue This Month",
    es: "Ingresos este mes",
  },
  "metric.costPerLead": { en: "Cost Per Lead", es: "Costo por cliente" },
  "metric.revenueCaptured": {
    en: "Revenue Captured",
    es: "Ingresos capturados",
  },
  "metric.afterHoursCalls": {
    en: "After-Hours Calls",
    es: "Llamadas fuera de horario",
  },
  "metric.appointmentsBooked": {
    en: "Appointments Booked",
    es: "Citas agendadas",
  },
  "metric.missedSaved": { en: "Missed Saved", es: "Perdidas recuperadas" },
  "metric.thisWeek": { en: "This Week", es: "Esta semana" },
  "metric.appointments": { en: "Appointments", es: "Citas" },
  "metric.callsHandled": { en: "Calls handled", es: "Llamadas atendidas" },
  "metric.missedCallsRecovered": {
    en: "Missed calls recovered",
    es: "Llamadas perdidas recuperadas",
  },
  "metric.avgCallDuration": {
    en: "Avg call duration",
    es: "Duracion promedio",
  },
  "metric.busiestHour": { en: "Busiest hour", es: "Hora mas activa" },
  "metric.trendingService": {
    en: "Trending service",
    es: "Servicio mas solicitado",
  },
  "metric.roiReturn": {
    en: "return on your $497/mo",
    es: "retorno de tu plan de $497/mes",
  },
  "metric.recoveredFromMissed": {
    en: "recovered from missed calls",
    es: "recuperado de llamadas perdidas",
  },
  "metric.investment": { en: "$497 investment", es: "Inversion de $497" },
  "metric.earned": { en: "earned", es: "ganado" },
  "metric.earnedYou": {
    en: "This month, {name} earned you",
    es: "Este mes, {name} te genero",
  },
  "metric.activePipeline": {
    en: "Active Pipeline",
    es: "Cotizaciones activas",
  },
  "metric.repeatRate": { en: "Repeat Rate", es: "Tasa de repeticion" },
  "metric.newThisMonth": { en: "New this month", es: "Nuevos este mes" },
  "metric.totalCustomers": {
    en: "Total Customers",
    es: "Total de clientes",
  },

  // ── Setup checklist ────────────────────────────────────────
  "setup.quickSetup": { en: "Quick Setup", es: "Configuracion rapida" },
  "setup.forwardNumber": {
    en: "Forward your business number",
    es: "Redirige tu numero de negocio",
  },
  "setup.forwardNumberDesc": {
    en: "Set up call forwarding from your existing phone number to your Capta receptionist number.",
    es: "Configura el desvio de llamadas de tu numero actual al numero de tu recepcionista Capta.",
  },
  "setup.customizeReceptionist": {
    en: "Customize your receptionist",
    es: "Personaliza tu recepcionista",
  },
  "setup.customizeReceptionistDesc": {
    en: "Set her name, greeting, personality, and the services you offer.",
    es: "Ponle nombre, saludo, personalidad y los servicios que ofreces.",
  },
  "setup.setBusinessHours": {
    en: "Set your business hours",
    es: "Configura tu horario",
  },
  "setup.setBusinessHoursDesc": {
    en: "Tell her when you're available so she books appointments at the right times.",
    es: "Dile cuando estas disponible para que agende citas en los horarios correctos.",
  },
  "setup.makeTestCall": {
    en: "Make a test call",
    es: "Haz una llamada de prueba",
  },
  "setup.makeTestCallDesc": {
    en: "Call your Capta number to hear how she handles a real conversation.",
    es: "Llama a tu numero de Capta para escuchar como maneja una conversacion real.",
  },
  "setup.letsGet": {
    en: "Let's get {name} answering calls in the next 10 minutes.",
    es: "Pon a {name} a contestar llamadas en los proximos 10 minutos.",
  },

  // ── Common actions ─────────────────────────────────────────
  "action.seeBreakdown": { en: "See breakdown", es: "Ver detalle" },
  "action.hideBreakdown": { en: "Hide breakdown", es: "Ocultar detalle" },
  "action.exportCsv": { en: "Export CSV", es: "Exportar CSV" },
  "action.search": { en: "Search", es: "Buscar" },
  "action.filter": { en: "Filter", es: "Filtrar" },
  "action.save": { en: "Save", es: "Guardar" },
  "action.cancel": { en: "Cancel", es: "Cancelar" },
  "action.delete": { en: "Delete", es: "Eliminar" },
  "action.edit": { en: "Edit", es: "Editar" },
  "action.loading": { en: "Loading...", es: "Cargando..." },
  "action.retry": { en: "Retry", es: "Reintentar" },
  "action.noData": { en: "No data", es: "Sin datos" },
  "action.error": { en: "Error", es: "Error" },
  "action.confirm": { en: "Confirm", es: "Confirmar" },
  "action.close": { en: "Close", es: "Cerrar" },
  "action.back": { en: "Back", es: "Volver" },
  "action.next": { en: "Next", es: "Siguiente" },
  "action.viewAll": { en: "View all", es: "Ver todo" },
  "action.download": { en: "Download", es: "Descargar" },
  "action.copy": { en: "Copy", es: "Copiar" },
  "action.copied": { en: "Copied!", es: "Copiado!" },
  "action.submit": { en: "Submit", es: "Enviar" },
  "action.refresh": { en: "Refresh", es: "Actualizar" },
  "action.add": { en: "Add", es: "Agregar" },
  "action.remove": { en: "Remove", es: "Quitar" },
  "action.noDataToExport": {
    en: "No data to export",
    es: "No hay datos para exportar",
  },
  "action.signOut": { en: "Sign out", es: "Cerrar sesion" },
  "action.settings": { en: "Settings", es: "Configuracion" },

  // ── Time ───────────────────────────────────────────────────
  "time.today": { en: "today", es: "hoy" },
  "time.thisWeek": { en: "this week", es: "esta semana" },
  "time.thisMonth": { en: "this month", es: "este mes" },
  "time.yesterday": { en: "yesterday", es: "ayer" },
  "time.lastWeek": { en: "last week", es: "la semana pasada" },
  "time.lastMonth": { en: "last month", es: "el mes pasado" },
  "time.allTime": { en: "all time", es: "todo el tiempo" },
  "time.minutesAgo": { en: "{n} min ago", es: "hace {n} min" },
  "time.hoursAgo": { en: "{n}h ago", es: "hace {n}h" },
  "time.justNow": { en: "just now", es: "justo ahora" },

  // ── Dashboard sections ─────────────────────────────────────
  "section.activityFeed": { en: "Activity Feed", es: "Actividad reciente" },
  "section.weeklySummary": { en: "Weekly Summary", es: "Resumen semanal" },
  "section.businessInsights": {
    en: "Business Insights",
    es: "Datos de tu negocio",
  },
  "section.healthScore": { en: "Health Score", es: "Puntaje de salud" },
  "section.overview": { en: "Overview", es: "Resumen" },
  "section.estimatePipeline": {
    en: "Estimate Pipeline",
    es: "Cotizaciones en proceso",
  },
  "section.customerInsights": {
    en: "Customer Insights",
    es: "Datos de clientes",
  },
  "section.bilingualStats": {
    en: "Bilingual Stats",
    es: "Estadisticas bilingues",
  },
  "section.recentCalls": { en: "Recent Calls", es: "Llamadas recientes" },
  "section.upcomingAppointments": {
    en: "Upcoming Appointments",
    es: "Citas proximas",
  },
  "section.missedCallRecovery": {
    en: "Missed Call Recovery",
    es: "Recuperacion de llamadas",
  },
  "section.callsByHour": {
    en: "Calls by Hour of Day",
    es: "Llamadas por hora del dia",
  },
  "section.callsByDay": {
    en: "Calls by Day of Week",
    es: "Llamadas por dia de la semana",
  },

  // ── Status labels ──────────────────────────────────────────
  "status.active": { en: "Active", es: "Activo" },
  "status.inactive": { en: "Inactive", es: "Inactivo" },
  "status.pending": { en: "Pending", es: "Pendiente" },
  "status.confirmed": { en: "Confirmed", es: "Confirmado" },
  "status.cancelled": { en: "Cancelled", es: "Cancelado" },
  "status.completed": { en: "Completed", es: "Completado" },
  "status.missed": { en: "Missed", es: "Perdida" },
  "status.failed": { en: "Failed", es: "Fallido" },
  "status.inProgress": { en: "In Progress", es: "En progreso" },
  "status.scheduled": { en: "Scheduled", es: "Programado" },
  "status.sent": { en: "Sent", es: "Enviado" },
  "status.won": { en: "Won", es: "Ganado" },
  "status.lost": { en: "Lost", es: "Perdido" },
  "status.new": { en: "New", es: "Nuevo" },
  "status.followUp": { en: "Follow Up", es: "Seguimiento" },
  "status.recovered": { en: "Recovered", es: "Recuperada" },

  // ── Billing ────────────────────────────────────────────────
  "billing.paymentFailed": {
    en: "Payment failed",
    es: "Pago fallido",
  },
  "billing.updateCard": {
    en: "Update your card",
    es: "Actualiza tu tarjeta",
  },
  "billing.daysUntilPause": {
    en: "{n} days until service pauses",
    es: "{n} dias para que se pause el servicio",
  },
  "billing.currentPlan": { en: "Current Plan", es: "Plan actual" },
  "billing.nextPayment": { en: "Next payment", es: "Proximo pago" },
  "billing.manageBilling": {
    en: "Manage billing",
    es: "Administrar facturacion",
  },
  "billing.paymentOverdue": {
    en: "Payment Overdue",
    es: "Pago atrasado",
  },
  "billing.invoiceHistory": {
    en: "Invoice history",
    es: "Historial de facturas",
  },
  "billing.amount": { en: "Amount", es: "Monto" },
  "billing.date": { en: "Date", es: "Fecha" },
  "billing.status": { en: "Status", es: "Estado" },

  // ── Navigation ─────────────────────────────────────────────
  "nav.dashboard": { en: "Dashboard", es: "Panel" },
  "nav.calls": { en: "Calls", es: "Llamadas" },
  "nav.appointments": { en: "Appointments", es: "Citas" },
  "nav.customers": { en: "Customers", es: "Clientes" },
  "nav.estimates": { en: "Estimates", es: "Cotizaciones" },
  "nav.jobCards": { en: "Job Cards", es: "Ordenes de trabajo" },
  "nav.sms": { en: "SMS", es: "Mensajes" },
  "nav.billing": { en: "Billing", es: "Facturacion" },
  "nav.settings": { en: "Settings", es: "Configuracion" },
  "nav.referrals": { en: "Referrals", es: "Referidos" },
  "nav.partners": { en: "Partners", es: "Socios" },
  "nav.reporting": { en: "Reporting", es: "Reportes" },
  "nav.import": { en: "Import", es: "Importar" },
  "nav.feedback": { en: "Feedback", es: "Comentarios" },
  "nav.intelligence": { en: "Intelligence", es: "Inteligencia" },
  "nav.locations": { en: "Locations", es: "Ubicaciones" },

  // ── Intelligence page ────────────────────────────────────
  "intelligence.title": { en: "{name}'s Brain", es: "El cerebro de {name}" },
  "intelligence.subtitle": {
    en: "Everything {name} has learned about your business",
    es: "Todo lo que {name} ha aprendido sobre tu negocio",
  },
  "intelligence.callsHandled": { en: "Calls Handled", es: "Llamadas atendidas" },
  "intelligence.customersServed": { en: "Customers Served", es: "Clientes atendidos" },
  "intelligence.faqsMastered": { en: "FAQs Mastered", es: "Preguntas dominadas" },
  "intelligence.avgQaScore": { en: "Avg QA Score", es: "Puntaje QA promedio" },
  "intelligence.learningDays": {
    en: "{name} has been learning for {n} days",
    es: "{name} lleva {n} dias aprendiendo",
  },
  "intelligence.knowledgeMastery": { en: "Knowledge Mastery", es: "Dominio del conocimiento" },
  "intelligence.qualityTrends": { en: "Quality Trends", es: "Tendencias de calidad" },
  "intelligence.customerIntelligence": { en: "Customer Intelligence", es: "Inteligencia de clientes" },
  "intelligence.businessInsights": { en: "Business Insights", es: "Datos del negocio" },
  "intelligence.knowledgeGaps": { en: "Knowledge Gaps", es: "Vacios de conocimiento" },
  "intelligence.topCallers": { en: "Top Callers", es: "Principales clientes" },
  "intelligence.customerTiers": { en: "Customer Tiers", es: "Niveles de clientes" },
  "intelligence.repeatCallerRate": { en: "Repeat Caller Rate", es: "Tasa de repeticion" },
  "intelligence.topServices": { en: "Top Requested Services", es: "Servicios mas solicitados" },
  "intelligence.busiestHours": { en: "Busiest Hours", es: "Horas mas activas" },
  "intelligence.bilingualCalls": { en: "Bilingual Calls", es: "Llamadas bilingues" },
  "intelligence.monthlyVolume": { en: "Monthly Call Volume", es: "Volumen mensual" },
  "intelligence.weeklyTrend": { en: "Weekly Score Trend", es: "Tendencia semanal" },
  "intelligence.teach": { en: "Teach {name}", es: "Ensenar a {name}" },

  // ── Calls page ─────────────────────────────────────────────
  "calls.inbound": { en: "Inbound", es: "Entrante" },
  "calls.outbound": { en: "Outbound", es: "Saliente" },
  "calls.direction": { en: "Direction", es: "Direccion" },
  "calls.duration": { en: "Duration", es: "Duracion" },
  "calls.caller": { en: "Caller", es: "Quien llamo" },
  "calls.summary": { en: "Summary", es: "Resumen" },
  "calls.sentiment": { en: "Sentiment", es: "Sentimiento" },
  "calls.outcome": { en: "Outcome", es: "Resultado" },
  "calls.transcript": { en: "Transcript", es: "Transcripcion" },
  "calls.playAudio": { en: "Play audio", es: "Reproducir audio" },
  "calls.language": { en: "Language", es: "Idioma" },
  "calls.appointmentReminder": {
    en: "Appointment Reminder",
    es: "Recordatorio de cita",
  },
  "calls.estimateFollowUp": {
    en: "Estimate Follow Up",
    es: "Seguimiento de cotizacion",
  },
  "calls.noCalls": {
    en: "No calls yet",
    es: "Aun no hay llamadas",
  },

  // ── Appointments ───────────────────────────────────────────
  "appointments.upcoming": { en: "Upcoming", es: "Proximas" },
  "appointments.past": { en: "Past", es: "Pasadas" },
  "appointments.date": { en: "Date", es: "Fecha" },
  "appointments.time": { en: "Time", es: "Hora" },
  "appointments.service": { en: "Service", es: "Servicio" },
  "appointments.customer": { en: "Customer", es: "Cliente" },
  "appointments.notes": { en: "Notes", es: "Notas" },
  "appointments.noUpcoming": {
    en: "No upcoming appointments",
    es: "No hay citas proximas",
  },

  // ── Customers ──────────────────────────────────────────────
  "customers.name": { en: "Name", es: "Nombre" },
  "customers.phone": { en: "Phone", es: "Telefono" },
  "customers.email": { en: "Email", es: "Correo" },
  "customers.lastCall": { en: "Last Call", es: "Ultima llamada" },
  "customers.totalCalls": { en: "Total Calls", es: "Total de llamadas" },
  "customers.noCustomers": {
    en: "No customers yet",
    es: "Aun no hay clientes",
  },
  "customers.repeatCallers": {
    en: "Repeat Callers",
    es: "Clientes recurrentes",
  },

  // ── Estimates ──────────────────────────────────────────────
  "estimates.new": { en: "New", es: "Nueva" },
  "estimates.sent": { en: "Sent", es: "Enviada" },
  "estimates.followUp": { en: "Follow Up", es: "Seguimiento" },
  "estimates.won": { en: "Won", es: "Ganada" },
  "estimates.lost": { en: "Lost", es: "Perdida" },
  "estimates.amount": { en: "Amount", es: "Monto" },
  "estimates.noEstimates": {
    en: "No estimates yet",
    es: "Aun no hay cotizaciones",
  },
  "estimates.wonThisMonth": {
    en: "Won this month",
    es: "Ganadas este mes",
  },

  // ── Settings ───────────────────────────────────────────────
  "settings.businessInfo": {
    en: "Business Information",
    es: "Informacion del negocio",
  },
  "settings.receptionistSettings": {
    en: "Receptionist Settings",
    es: "Configuracion de recepcionista",
  },
  "settings.businessHours": {
    en: "Business Hours",
    es: "Horario de atencion",
  },
  "settings.services": { en: "Services", es: "Servicios" },
  "settings.notifications": {
    en: "Notifications",
    es: "Notificaciones",
  },
  "settings.savedSuccessfully": {
    en: "Saved successfully",
    es: "Guardado con exito",
  },
  "settings.missedCallRecovery": {
    en: "Missed Call Recovery",
    es: "Recuperacion de llamadas perdidas",
  },

  // ── Errors / empty states ──────────────────────────────────
  "error.failedToLoad": {
    en: "Failed to load dashboard data",
    es: "No se pudieron cargar los datos",
  },
  "error.somethingWentWrong": {
    en: "Something went wrong",
    es: "Algo salio mal",
  },
  "error.tryAgain": {
    en: "Please try again",
    es: "Por favor intenta de nuevo",
  },
  "error.sessionExpired": {
    en: "Session expired. Please log in again.",
    es: "Tu sesion expiro. Inicia sesion de nuevo.",
  },
  "error.unauthorized": {
    en: "You don't have access to this page",
    es: "No tienes acceso a esta pagina",
  },
  "error.notFound": {
    en: "Page not found",
    es: "Pagina no encontrada",
  },

  // ── Empty states ───────────────────────────────────────────
  "empty.noCalls": {
    en: "No calls yet. Once {name} starts answering, they'll show up here.",
    es: "Aun no hay llamadas. Cuando {name} empiece a contestar, apareceran aqui.",
  },
  "empty.noAppointments": {
    en: "No appointments yet. {name} will book them as calls come in.",
    es: "Aun no hay citas. {name} las agendara cuando lleguen las llamadas.",
  },
  "empty.noCustomers": {
    en: "No customers yet. They'll appear after the first call.",
    es: "Aun no hay clientes. Apareceran despues de la primera llamada.",
  },
  "empty.noEstimates": {
    en: "No estimates yet. {name} can generate them during calls.",
    es: "Aun no hay cotizaciones. {name} puede crearlas durante las llamadas.",
  },

  // ── First call celebration ─────────────────────────────────
  "celebration.firstCall": {
    en: "Your first call!",
    es: "Tu primera llamada!",
  },
  "celebration.firstCallDesc": {
    en: "{name} just handled her first real call for your business.",
    es: "{name} acaba de atender su primera llamada real para tu negocio.",
  },
  "celebration.dismiss": { en: "Got it!", es: "Entendido!" },

  // ── Days of the week ───────────────────────────────────────
  "day.monday": { en: "Monday", es: "Lunes" },
  "day.tuesday": { en: "Tuesday", es: "Martes" },
  "day.wednesday": { en: "Wednesday", es: "Miercoles" },
  "day.thursday": { en: "Thursday", es: "Jueves" },
  "day.friday": { en: "Friday", es: "Viernes" },
  "day.saturday": { en: "Saturday", es: "Sabado" },
  "day.sunday": { en: "Sunday", es: "Domingo" },

  // ── Misc ───────────────────────────────────────────────────
  "misc.english": { en: "English", es: "Ingles" },
  "misc.spanish": { en: "Spanish", es: "Espanol" },
  "misc.phone": { en: "Phone", es: "Telefono" },
  "misc.email": { en: "Email", es: "Correo" },
  "misc.name": { en: "Name", es: "Nombre" },
  "misc.address": { en: "Address", es: "Direccion" },
  "misc.yes": { en: "Yes", es: "Si" },
  "misc.no": { en: "No", es: "No" },
  "misc.or": { en: "or", es: "o" },
  "misc.and": { en: "and", es: "y" },
  "misc.of": { en: "of", es: "de" },
  "misc.vs": { en: "vs", es: "vs" },
  "misc.lastMonth": { en: "vs last month", es: "vs el mes pasado" },
};

/**
 * Look up a translated string.
 *
 * Supports interpolation with `{key}` placeholders:
 *   t("setup.letsGet", "en", { name: "Maria" })
 *   // => "Let's get Maria answering calls in the next 10 minutes."
 *
 * Falls back: Spanish value -> English value -> raw key.
 */
export function t(
  key: string,
  lang: Lang,
  vars?: Record<string, string | number>,
): string {
  let value = strings[key]?.[lang] || strings[key]?.en || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }
  return value;
}

/**
 * Returns the appropriate greeting for the current time of day.
 */
export function getGreeting(lang: Lang): string {
  const h = new Date().getHours();
  if (h < 12) return t("greeting.morning", lang);
  if (h < 17) return t("greeting.afternoon", lang);
  return t("greeting.evening", lang);
}

/**
 * Returns all keys matching a prefix.
 * Useful for iterating a group (e.g. all "nav.*" keys).
 */
export function keysWithPrefix(prefix: string): string[] {
  return Object.keys(strings).filter((k) => k.startsWith(prefix));
}
