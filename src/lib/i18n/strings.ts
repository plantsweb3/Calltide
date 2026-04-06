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

  // ── Overview ─────────────────────────────────────────────
  "overview.quickSetup": { en: "Quick Setup", es: "Configuracion rapida" },
  "overview.forwardNumber": {
    en: "Forward your number",
    es: "Redirige tu numero",
  },
  "overview.forwardNumberSub": {
    en: "Set up call forwarding to your Capta number",
    es: "Configura el desvio de llamadas a tu numero Capta",
  },
  "overview.customizeReceptionist": {
    en: "Customize your receptionist",
    es: "Personaliza tu recepcionista",
  },
  "overview.setBusinessHours": {
    en: "Set business hours",
    es: "Configura tu horario",
  },
  "overview.makeTestCall": {
    en: "Make a test call",
    es: "Haz una llamada de prueba",
  },
  "overview.mariaIsStandingBy": {
    en: "{name} is standing by",
    es: "{name} esta lista",
  },
  "overview.callsToday": { en: "Calls Today", es: "Llamadas hoy" },
  "overview.thisWeek": { en: "This Week", es: "Esta semana" },
  "overview.totalCalls": { en: "Total Calls", es: "Total de llamadas" },
  "overview.revenueThisMonth": {
    en: "Revenue This Month",
    es: "Ingresos este mes",
  },
  "overview.noCalls": { en: "No calls yet", es: "Aun no hay llamadas" },
  "overview.noCallsSub": {
    en: "Once {name} starts answering calls, your dashboard will come alive.",
    es: "Cuando {name} empiece a contestar, tu panel cobrara vida.",
  },
  "overview.activeCallsNow": {
    en: "active call right now",
    es: "llamada activa ahora",
  },
  "overview.activeCallsNowPlural": {
    en: "active calls right now",
    es: "llamadas activas ahora",
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
  "action.prev": { en: "Prev", es: "Anterior" },
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
  "nav.schedule": { en: "Schedule", es: "Agenda" },
  "nav.money": { en: "Money", es: "Dinero" },
  "nav.messages": { en: "Messages", es: "Mensajes" },
  "nav.toDo": { en: "To-Do", es: "Pendientes" },
  "nav.myTeam": { en: "My Team", es: "Mi Equipo" },
  "nav.reports": { en: "Reports", es: "Reportes" },

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
  "settings.tab.general": { en: "General", es: "General" },
  "settings.tab.receptionist": { en: "Receptionist", es: "Recepcionista" },
  "settings.tab.responses": { en: "Responses", es: "Respuestas" },
  "settings.tab.notifications": { en: "Notifications", es: "Notificaciones" },
  "settings.tab.pricing": { en: "Pricing", es: "Precios" },
  "settings.tab.automations": { en: "Automations", es: "Automatizaciones" },
  "settings.tab.integrations": { en: "Integrations", es: "Integraciones" },
  "settings.tab.export": { en: "Data Export", es: "Exportar datos" },
  "settings.export.title": { en: "Data Export", es: "Exportar datos" },
  "settings.export.description": {
    en: "Download your data as CSV files",
    es: "Descarga tus datos como archivos CSV",
  },
  "settings.export.calls": { en: "Calls", es: "Llamadas" },
  "settings.export.customers": { en: "Customers", es: "Clientes" },
  "settings.export.appointments": { en: "Appointments", es: "Citas" },
  "settings.export.invoices": { en: "Invoices", es: "Facturas" },
  "settings.export.all": { en: "Export All", es: "Exportar todo" },
  "settings.export.downloading": { en: "Downloading...", es: "Descargando..." },
  "settings.export.downloadFailed": {
    en: "Download failed. Please try again.",
    es: "La descarga fallo. Intentalo de nuevo.",
  },
  "settings.export.rateLimit": {
    en: "Too many exports. Please wait before trying again.",
    es: "Demasiadas exportaciones. Espera antes de intentar de nuevo.",
  },
  "settings.ownerContact": {
    en: "Owner Contact",
    es: "Contacto del dueno",
  },
  "settings.yourReceptionist": {
    en: "Your Receptionist",
    es: "Tu Recepcionista",
  },
  "settings.personality": { en: "Personality", es: "Personalidad" },
  "settings.voice": { en: "Voice", es: "Voz" },
  "settings.quietHours": { en: "Quiet Hours", es: "Horario silencioso" },
  "settings.weeklyDigest": { en: "Weekly Digest", es: "Resumen semanal" },
  "settings.dailySummary": { en: "Daily Summary", es: "Resumen diario" },
  "settings.reviewRequests": {
    en: "Review Requests",
    es: "Solicitudes de resena",
  },
  "settings.save": { en: "Save Changes", es: "Guardar cambios" },
  "settings.saving": { en: "Saving...", es: "Guardando..." },
  "settings.saved": { en: "Changes saved", es: "Cambios guardados" },
  "settings.businessName": { en: "Business Name", es: "Nombre del negocio" },
  "settings.trade": { en: "Trade/Industry", es: "Industria" },
  "settings.phone": { en: "Business Phone", es: "Telefono del negocio" },
  "settings.email": { en: "Business Email", es: "Correo del negocio" },
  "settings.address": { en: "Address", es: "Direccion" },
  "settings.serviceArea": { en: "Service Area", es: "Area de servicio" },
  "settings.ownerName": { en: "Owner Name", es: "Nombre del dueno" },
  "settings.ownerPhone": { en: "Owner Phone", es: "Telefono del dueno" },
  "settings.ownerEmail": { en: "Owner Email", es: "Correo del dueno" },
  "settings.receptionistName": {
    en: "Receptionist Name",
    es: "Nombre de la recepcionista",
  },
  "settings.greeting": { en: "Greeting", es: "Saludo" },
  "settings.greetingEs": {
    en: "Greeting (Spanish)",
    es: "Saludo (Espanol)",
  },
  "settings.additionalInfo": {
    en: "Additional Information",
    es: "Informacion adicional",
  },
  "settings.mondayFriday": { en: "Monday - Friday", es: "Lunes - Viernes" },
  "settings.saturday": { en: "Saturday", es: "Sabado" },
  "settings.sunday": { en: "Sunday", es: "Domingo" },
  "settings.closed": { en: "Closed", es: "Cerrado" },
  "settings.security": { en: "Security", es: "Seguridad" },
  "settings.changePassword": {
    en: "Change Password",
    es: "Cambiar contrasena",
  },
  "settings.currentPassword": {
    en: "Current Password",
    es: "Contrasena actual",
  },
  "settings.dangerZone": { en: "Danger Zone", es: "Zona de peligro" },
  "settings.deleteAccount": { en: "Delete Account", es: "Eliminar cuenta" },

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

  // ── Auth ──────────────────────────────────────────────────
  "auth.clientPortal": { en: "Client Portal", es: "Portal de Cliente" },
  "auth.signIn": { en: "Sign in to your account", es: "Inicia sesion" },
  "auth.signInSub": {
    en: "See how your AI receptionist is performing",
    es: "Mira como va tu recepcionista AI",
  },
  "auth.email": { en: "Email address", es: "Correo electronico" },
  "auth.password": { en: "Password", es: "Contrasena" },
  "auth.rememberMe": { en: "Remember me", es: "Recordarme" },
  "auth.forgotPassword": {
    en: "Forgot password?",
    es: "Olvidaste tu contrasena?",
  },
  "auth.signingIn": { en: "Signing in...", es: "Iniciando sesion..." },
  "auth.or": { en: "or", es: "o" },
  "auth.sendMagicLink": { en: "Send magic link", es: "Enviar enlace magico" },
  "auth.sending": { en: "Sending...", es: "Enviando..." },
  "auth.needHelp": { en: "Need help?", es: "Necesitas ayuda?" },
  "auth.visitHelpCenter": {
    en: "Visit our help center",
    es: "Visita nuestro centro de ayuda",
  },
  "auth.magicLinkSent": {
    en: "Check your email for the magic link",
    es: "Revisa tu correo para el enlace magico",
  },
  "auth.resetPassword": { en: "Reset Password", es: "Restablecer Contrasena" },
  "auth.resetPasswordSub": {
    en: "Enter your email and we'll send you a reset link",
    es: "Ingresa tu correo y te enviaremos un enlace",
  },
  "auth.sendResetLink": { en: "Send reset link", es: "Enviar enlace" },
  "auth.backToSignIn": {
    en: "Back to sign in",
    es: "Volver a iniciar sesion",
  },
  "auth.setNewPassword": { en: "Set New Password", es: "Nueva Contrasena" },
  "auth.newPassword": { en: "New password", es: "Nueva contrasena" },
  "auth.confirmPassword": {
    en: "Confirm password",
    es: "Confirmar contrasena",
  },
  "auth.passwordsDontMatch": {
    en: "Passwords don't match",
    es: "Las contrasenas no coinciden",
  },
  "auth.updatePassword": {
    en: "Update password",
    es: "Actualizar contrasena",
  },
  "auth.noAccount": { en: "Don't have an account?", es: "No tienes cuenta?" },
  "auth.getStarted": { en: "Get started", es: "Comenzar" },
  "auth.startTrialCta": {
    en: "Start your 14-day free trial",
    es: "Comienza tu prueba gratuita de 14 dias",
  },
  "auth.error.invalid": {
    en: "Invalid email or password",
    es: "Correo o contrasena invalidos",
  },
  "auth.error.rateLimited": {
    en: "Too many attempts. Try again later.",
    es: "Demasiados intentos. Intenta mas tarde.",
  },
  "auth.error.enterEmailFirst": {
    en: "Enter your email first",
    es: "Ingresa tu correo primero",
  },
  "auth.error.linkExpired": {
    en: "Login link expired or invalid. Please try again.",
    es: "Enlace de acceso expirado o invalido. Intenta de nuevo.",
  },
  "auth.error.linkUsed": {
    en: "This login link has already been used. Please request a new one.",
    es: "Este enlace ya fue usado. Solicita uno nuevo.",
  },
  "auth.error.invalidLink": {
    en: "Invalid reset link. Please request a new one.",
    es: "Enlace invalido. Solicita uno nuevo.",
  },
  "auth.passwordUpdated": {
    en: "Password updated successfully. Sign in with your new password.",
    es: "Contrasena actualizada. Inicia sesion con tu nueva contrasena.",
  },
  "auth.checkEmailForReset": {
    en: "Check your email for a reset link",
    es: "Revisa tu correo para el enlace de restablecimiento",
  },
  "auth.resetLinkSentConfirm": {
    en: "If an account exists for {email}, you'll receive a reset link. It expires in 1 hour.",
    es: "Si existe una cuenta para {email}, recibiras un enlace. Expira en 1 hora.",
  },
  "auth.chooseStrongPassword": {
    en: "Choose a strong password for your account",
    es: "Elige una contrasena segura para tu cuenta",
  },
  "auth.enterPassword": {
    en: "Enter your password",
    es: "Ingresa tu contrasena",
  },
  "auth.minChars": { en: "Min 8 characters", es: "Minimo 8 caracteres" },
  "auth.confirmYourPassword": {
    en: "Re-enter your password",
    es: "Confirma tu contrasena",
  },
  "auth.requirement.chars": { en: "8+ chars", es: "8+ car." },
  "auth.requirement.letter": { en: "Letter", es: "Letra" },
  "auth.requirement.number": { en: "Number", es: "Numero" },
  "auth.hidePassword": { en: "Hide password", es: "Ocultar contrasena" },
  "auth.showPassword": { en: "Show password", es: "Mostrar contrasena" },
  "auth.strength.weak": { en: "Weak", es: "Debil" },
  "auth.strength.fair": { en: "Fair", es: "Regular" },
  "auth.strength.strong": { en: "Strong", es: "Fuerte" },

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
  "misc.minRead": { en: "min read", es: "min de lectura" },
  "misc.caller": { en: "Caller", es: "Llamante" },

  // ── Component keys ───────────────────────────────────────
  "component.cancel": { en: "Cancel", es: "Cancelar" },
  "component.pleaseWait": { en: "Please wait...", es: "Por favor espera..." },
  "component.confirm": { en: "Confirm", es: "Confirmar" },
  "component.noData": { en: "No data", es: "Sin datos" },
  "component.prev": { en: "Previous", es: "Anterior" },
  "component.next": { en: "Next", es: "Siguiente" },
  "component.selected": { en: "selected", es: "seleccionados" },
  "component.total": { en: "total", es: "total" },
  "component.errorTitle": {
    en: "Something went wrong",
    es: "Algo salio mal",
  },
  "component.errorSubtitle": {
    en: "Please try again or reload the page",
    es: "Intenta de nuevo o recarga la pagina",
  },
  "component.reload": { en: "Reload Page", es: "Recargar pagina" },
  "component.tryAgain": { en: "Try Again", es: "Intentar de nuevo" },

  // ── Calls page extras ────────────────────────────────────
  "calls.title": { en: "Call Log", es: "Registro de llamadas" },
  "calls.search": {
    en: "Search by phone or name...",
    es: "Buscar por telefono o nombre...",
  },
  "calls.allStatuses": { en: "All Statuses", es: "Todos los estados" },
  "calls.allDirections": { en: "All Directions", es: "Todas las direcciones" },
  "calls.allTypes": { en: "All Types", es: "Todos los tipos" },
  "calls.phone": { en: "Phone", es: "Telefono" },
  "calls.result": { en: "Result", es: "Resultado" },
  "calls.recoveryTimeline": {
    en: "Recovery Timeline",
    es: "Cronologia de recuperacion",
  },
  "calls.missedCallRecovery": {
    en: "Missed Call Recovery",
    es: "Recuperacion de llamadas perdidas",
  },
  "calls.datePresets.today": { en: "Today", es: "Hoy" },
  "calls.datePresets.7d": { en: "Last 7 days", es: "Ultimos 7 dias" },
  "calls.datePresets.30d": { en: "Last 30 days", es: "Ultimos 30 dias" },
  "calls.filters": { en: "Filters", es: "Filtros" },

  // ── Appointments page extras ─────────────────────────────
  "appointments.title": { en: "Appointments", es: "Citas" },
  "appointments.calendar": { en: "Calendar", es: "Calendario" },
  "appointments.list": { en: "List", es: "Lista" },
  "appointments.new": { en: "New Appointment", es: "Nueva cita" },
  "appointments.confirm": { en: "Confirm", es: "Confirmar" },
  "appointments.complete": { en: "Complete", es: "Completar" },
  "appointments.noShow": { en: "No-Show", es: "No se presento" },
  "appointments.status": { en: "Status", es: "Estado" },

  // ── Customers page extras ────────────────────────────────
  "customers.title": { en: "Customers", es: "Clientes" },
  "customers.allTiers": { en: "All Tiers", es: "Todos los niveles" },
  "customers.hot": { en: "Hot", es: "Caliente" },
  "customers.warm": { en: "Warm", es: "Tibio" },
  "customers.cold": { en: "Cold", es: "Frio" },
  "customers.dormant": { en: "Dormant", es: "Inactivo" },
  "customers.search": {
    en: "Search by name or phone...",
    es: "Buscar por nombre o telefono...",
  },
  "customers.addCustomer": { en: "Add Customer", es: "Agregar cliente" },
  "customers.mergeCustomers": {
    en: "Merge Customers",
    es: "Combinar clientes",
  },
  "customers.leadScore": { en: "Lead Score", es: "Puntaje de cliente" },

  // ── Customer detail page ─────────────────────────────────
  "customerDetail.scheduleAppointment": {
    en: "Schedule Appointment",
    es: "Agendar cita",
  },
  "customerDetail.createEstimate": {
    en: "Create Estimate",
    es: "Crear cotizacion",
  },
  "customerDetail.addNote": { en: "Add Note", es: "Agregar nota" },
  "customerDetail.sendSms": { en: "Send SMS", es: "Enviar SMS" },
  "customerDetail.activity": { en: "Activity", es: "Actividad" },
  "customerDetail.notes": { en: "Notes", es: "Notas" },
  "customerDetail.invoices": { en: "Invoices", es: "Facturas" },

  // ── Billing page extras ──────────────────────────────────
  "billing.title": { en: "Billing", es: "Facturacion" },
  "billing.yourPlan": { en: "Your Plan", es: "Tu plan" },
  "billing.captaCore": { en: "Capta Core", es: "Capta Core" },
  "billing.paymentMethod": { en: "Payment Method", es: "Metodo de pago" },
  "billing.nextBillingDate": {
    en: "Next Billing Date",
    es: "Proxima fecha de cobro",
  },
  "billing.updatePaymentMethod": {
    en: "Update Payment Method",
    es: "Actualizar metodo de pago",
  },
  "billing.cancelSubscription": {
    en: "Cancel Subscription",
    es: "Cancelar suscripcion",
  },
  "billing.paymentPastDue": { en: "Payment Past Due", es: "Pago vencido" },

  // ── SMS page ─────────────────────────────────────────────
  "sms.title": { en: "SMS Log", es: "Registro de SMS" },
  "sms.search": {
    en: "Search by phone number...",
    es: "Buscar por numero de telefono...",
  },
  "sms.fullMessage": { en: "Full Message", es: "Mensaje completo" },
  "sms.from": { en: "From", es: "De" },
  "sms.to": { en: "To", es: "Para" },
  "sms.in": { en: "IN", es: "ENT" },
  "sms.out": { en: "OUT", es: "SAL" },
  "sms.noMessages": { en: "No messages yet", es: "Aun no hay mensajes" },
  "sms.viewSettings": {
    en: "View SMS Settings",
    es: "Ver configuracion de SMS",
  },

  // ── Estimates page extras ────────────────────────────────
  "estimates.title": { en: "Estimates", es: "Cotizaciones" },
  "estimates.newEstimate": { en: "New Estimate", es: "Nueva cotizacion" },
  "estimates.pipeline": { en: "Pipeline", es: "Pipeline" },
  "estimates.lostReasons.tooExpensive": {
    en: "Too expensive",
    es: "Muy caro",
  },
  "estimates.lostReasons.competitor": {
    en: "Went with competitor",
    es: "Se fue con la competencia",
  },
  "estimates.lostReasons.delayed": {
    en: "Delayed project",
    es: "Proyecto retrasado",
  },
  "estimates.lostReasons.noResponse": {
    en: "No response",
    es: "Sin respuesta",
  },
  "estimates.recordLostReason": {
    en: "Record Lost Reason",
    es: "Registrar razon de perdida",
  },

  // ── Invoices page ────────────────────────────────────────
  "invoices.title": { en: "Invoices", es: "Facturas" },
  "invoices.all": { en: "All", es: "Todas" },
  "invoices.draft": { en: "Draft", es: "Borrador" },
  "invoices.overdue": { en: "Overdue", es: "Vencida" },
  "invoices.paid": { en: "Paid", es: "Pagada" },
  "invoices.newInvoice": { en: "New Invoice", es: "Nueva factura" },
  "invoices.addLineItem": { en: "Add Line Item", es: "Agregar linea" },
  "invoices.sendInvoice": { en: "Send Invoice", es: "Enviar factura" },
  "invoices.markPaid": { en: "Mark Paid", es: "Marcar pagada" },
  "invoices.recordPayment": { en: "Record Payment", es: "Registrar pago" },
  "invoices.editInvoice": { en: "Edit Invoice", es: "Editar factura" },
  "invoices.paymentMethods.cash": { en: "Cash", es: "Efectivo" },
  "invoices.paymentMethods.check": { en: "Check", es: "Cheque" },
  "invoices.paymentMethods.card": {
    en: "Credit Card",
    es: "Tarjeta de credito",
  },
  "invoices.paymentMethods.transfer": {
    en: "Bank Transfer",
    es: "Transferencia bancaria",
  },

  // ── Follow-ups page ──────────────────────────────────────
  "followUps.title": { en: "Follow-Ups", es: "Seguimientos" },
  "followUps.all": { en: "All", es: "Todos" },
  "followUps.done": { en: "Done", es: "Hecho" },
  "followUps.skipped": { en: "Skipped", es: "Omitido" },
  "followUps.sortBy.dueDate": { en: "Due Date", es: "Fecha limite" },
  "followUps.sortBy.priority": { en: "Priority", es: "Prioridad" },
  "followUps.sortBy.created": { en: "Created", es: "Creado" },
  "followUps.overdue": { en: "Overdue", es: "Vencido" },
  "followUps.thisWeek": { en: "This Week", es: "Esta semana" },
  "followUps.dueToday": { en: "Due Today", es: "Vence hoy" },
  "followUps.markDone": { en: "Mark Done", es: "Marcar hecho" },
  "followUps.skip": { en: "Skip", es: "Omitir" },
  "followUps.callBack": { en: "Call Back", es: "Devolver llamada" },
  "followUps.start": { en: "Start", es: "Iniciar" },
  "followUps.today": { en: "Today", es: "Hoy" },
  "followUps.pendingCount": {
    en: "{n} pending",
    es: "{n} pendientes",
  },
  "followUps.urgentCount": {
    en: "({n} urgent)",
    es: "({n} urgentes)",
  },
  "followUps.allCaughtUp": { en: "All caught up", es: "Todo al dia" },
  "followUps.showPrefix": { en: "Show:", es: "Mostrar:" },
  "followUps.sortPrefix": { en: "Sort:", es: "Ordenar:" },
  "followUps.ascending": { en: "Ascending", es: "Ascendente" },
  "followUps.descending": { en: "Descending", es: "Descendente" },
  "followUps.col.priority": { en: "Priority", es: "Prioridad" },
  "followUps.col.followUp": { en: "Follow-up", es: "Seguimiento" },
  "followUps.col.customer": { en: "Customer", es: "Cliente" },
  "followUps.col.due": { en: "Due", es: "Vence" },
  "followUps.col.status": { en: "Status", es: "Estado" },
  "followUps.emptyPending": {
    en: "No pending follow-ups",
    es: "No hay seguimientos pendientes",
  },
  "followUps.emptyGeneric": {
    en: "No follow-ups found",
    es: "No se encontraron seguimientos",
  },
  "followUps.emptyDescription": {
    en: "Follow-ups are automatically created when Maria takes a message during a call. You can also create them manually.",
    es: "Los seguimientos se crean automaticamente cuando Maria toma un mensaje durante una llamada. Tambien puedes crearlos manualmente.",
  },
  "followUps.editTitle": { en: "Edit Follow-up", es: "Editar seguimiento" },
  "followUps.customerLabel": { en: "Customer:", es: "Cliente:" },
  "followUps.form.title": { en: "Title", es: "Titulo" },
  "followUps.form.titleRequired": {
    en: "Title is required.",
    es: "El titulo es obligatorio.",
  },
  "followUps.form.description": { en: "Description", es: "Descripcion" },
  "followUps.form.dueDate": { en: "Due Date", es: "Fecha limite" },
  "followUps.form.priority": { en: "Priority", es: "Prioridad" },
  "followUps.form.assignedTo": { en: "Assigned To", es: "Asignado a" },
  "followUps.form.assignedPlaceholder": {
    en: "Technician name...",
    es: "Nombre del tecnico...",
  },
  "followUps.form.status": { en: "Status", es: "Estado" },
  "followUps.priority.low": { en: "Low", es: "Baja" },
  "followUps.priority.normal": { en: "Normal", es: "Normal" },
  "followUps.priority.high": { en: "High", es: "Alta" },
  "followUps.priority.urgent": { en: "Urgent", es: "Urgente" },
  "followUps.status.pending": { en: "Pending", es: "Pendiente" },
  "followUps.status.inProgress": { en: "In Progress", es: "En progreso" },
  "followUps.status.completed": { en: "Completed", es: "Completado" },
  "followUps.status.dismissed": { en: "Dismissed", es: "Descartado" },
  "followUps.saving": { en: "Saving...", es: "Guardando..." },
  "followUps.updateFailed": {
    en: "Failed to update follow-up",
    es: "No se pudo actualizar el seguimiento",
  },
  "followUps.updated": { en: "Follow-up updated", es: "Seguimiento actualizado" },

  // ── Team page ────────────────────────────────────────────
  "team.title": { en: "Team", es: "Equipo" },
  "team.addTechnician": { en: "Add Technician", es: "Agregar tecnico" },
  "team.role": { en: "Role", es: "Rol" },
  "team.skills": { en: "Skills", es: "Habilidades" },
  "team.available": { en: "Available", es: "Disponible" },
  "team.onJob": { en: "On a Job", es: "En trabajo" },
  "team.offDuty": { en: "Off Duty", es: "Fuera de servicio" },
  "team.color": { en: "Color", es: "Color" },

  // ── Dispatch page ────────────────────────────────────────
  "dispatch.title": { en: "Dispatch Board", es: "Tablero de despacho" },
  "dispatch.unassigned": { en: "Unassigned", es: "Sin asignar" },
  "dispatch.dragToAssign": {
    en: "Drag to assign",
    es: "Arrastra para asignar",
  },
  "dispatch.assign": { en: "Assign", es: "Asignar" },
  "dispatch.reschedule": { en: "Reschedule", es: "Reprogramar" },

  // ── Referrals page ───────────────────────────────────────
  "referrals.title": { en: "Referral Program", es: "Programa de referidos" },
  "referrals.yourCode": {
    en: "Your Referral Code",
    es: "Tu codigo de referido",
  },
  "referrals.copyLink": { en: "Copy Link", es: "Copiar enlace" },
  "referrals.earned": { en: "Earned", es: "Ganado" },
  "referrals.reward": { en: "Reward", es: "Recompensa" },

  // ── Partners page ────────────────────────────────────────
  "partners.title": { en: "Referral Partners", es: "Socios de referidos" },
  "partners.addPartner": { en: "Add Partner", es: "Agregar socio" },
  "partners.sendReferral": { en: "Send Referral", es: "Enviar referido" },
  "partners.received": { en: "Received", es: "Recibido" },
  "partners.preferred": { en: "Preferred", es: "Preferido" },
  "partners.relationship": { en: "Relationship", es: "Relacion" },

  // ── Reporting page ───────────────────────────────────────
  "reporting.title": { en: "Reporting", es: "Reportes" },
  "reporting.callVolume": { en: "Call Volume", es: "Volumen de llamadas" },
  "reporting.revenuePipeline": {
    en: "Revenue Pipeline",
    es: "Pipeline de ingresos",
  },
  "reporting.closeRate": { en: "Close Rate", es: "Tasa de cierre" },
  "reporting.topServices": { en: "Top Services", es: "Mejores servicios" },
  "reporting.callerStats": {
    en: "Caller Stats",
    es: "Estadisticas de llamantes",
  },

  // ── Job Cards page ───────────────────────────────────────
  "jobCards.title": { en: "AI Job Cards", es: "Ordenes de trabajo AI" },
  "jobCards.autoDetect": { en: "Auto-Detect", es: "Auto-deteccion" },
  "jobCards.serviceType": { en: "Service Type", es: "Tipo de servicio" },
  "jobCards.confidence": { en: "Confidence", es: "Confianza" },
  "jobCards.sourceCall": { en: "Source Call", es: "Llamada de origen" },
  "jobCards.searchPlaceholder": { en: "Search jobs...", es: "Buscar trabajos..." },
  "jobCards.responseRate": { en: "Response rate:", es: "Tasa de respuesta:" },
  "jobCards.avgResponse": { en: "Avg response:", es: "Respuesta promedio:" },
  "jobCards.status.all": { en: "All", es: "Todos" },
  "jobCards.status.pending": { en: "Pending", es: "Pendiente" },
  "jobCards.status.confirmed": { en: "Confirmed", es: "Confirmado" },
  "jobCards.status.adjusted": { en: "Adjusted", es: "Ajustado" },
  "jobCards.status.siteVisit": { en: "Site Visit", es: "Visita en sitio" },
  "jobCards.status.expired": { en: "Expired", es: "Expirado" },
  "jobCards.status.awaitingAdj": { en: "Awaiting Adj.", es: "Esperando ajuste" },
  "jobCards.unknownCaller": { en: "Unknown caller", es: "Llamante desconocido" },
  "jobCards.serviceRequested": { en: "Service requested", es: "Servicio solicitado" },
  "jobCards.noEstimate": { en: "No estimate", es: "Sin cotizacion" },
  "jobCards.noMatch": { en: "no match", es: "sin coincidencia" },
  "jobCards.scope": { en: "Scope", es: "Alcance" },
  "jobCards.estimateMode": { en: "Estimate Mode", es: "Modo de cotizacion" },
  "jobCards.unit": { en: "Unit", es: "Unidad" },
  "jobCards.description": { en: "Description", es: "Descripcion" },
  "jobCards.photos": { en: "Photos", es: "Fotos" },
  "jobCards.loadingPhotos": { en: "Loading photos...", es: "Cargando fotos..." },
  "jobCards.received": { en: "Received:", es: "Recibido:" },
  "jobCards.photoAlt": { en: "Job site photo", es: "Foto del sitio de trabajo" },
  "jobCards.calcBreakdown": {
    en: "Calculation Breakdown",
    es: "Desglose del calculo",
  },
  "jobCards.noBreakdown": {
    en: "No breakdown available",
    es: "Sin desglose disponible",
  },
  "jobCards.ownerResponse": { en: "Owner Response", es: "Respuesta del propietario" },
  "jobCards.estimateConfirmed": { en: "Estimate confirmed", es: "Cotizacion confirmada" },
  "jobCards.adjustedTo": { en: "Adjusted to", es: "Ajustado a" },
  "jobCards.siteVisitRequested": {
    en: "Site visit requested",
    es: "Visita en sitio solicitada",
  },
  "jobCards.customerNotified": { en: "Customer Notified", es: "Cliente notificado" },
  "jobCards.responseTimeline": { en: "Response Timeline", es: "Historial de respuestas" },
  "jobCards.directionOwner": { en: "Owner", es: "Propietario" },
  "jobCards.directionSystem": { en: "System", es: "Sistema" },
  "jobCards.emptyTitle": { en: "No job cards yet", es: "Aun no hay ordenes de trabajo" },
  "jobCards.emptyDescription": {
    en: "Job cards are created automatically when {name} completes an intake during a call.",
    es: "Las ordenes de trabajo se crean automaticamente cuando {name} completa un registro durante una llamada.",
  },
  "jobCards.loadError": {
    en: "Failed to load job cards. Please try again.",
    es: "No se pudieron cargar las ordenes de trabajo. Intenta de nuevo.",
  },
  "jobCards.previous": { en: "Previous", es: "Anterior" },
  "jobCards.next": { en: "Next", es: "Siguiente" },
  "jobCards.pageOf": { en: "Page {page} of {total}", es: "Pagina {page} de {total}" },

  // ── Cancel page ──────────────────────────────────────────
  "cancel.title": { en: "Cancel Subscription", es: "Cancelar suscripcion" },
  "cancel.sorryToSeeYouGo": {
    en: "We're sorry to see you go",
    es: "Lamentamos verte partir",
  },
  "cancel.tellUsWhy": { en: "Please tell us why", es: "Dinos por que" },
  "cancel.otherReason": { en: "Other reason", es: "Otra razon" },
  "cancel.confirmCancel": {
    en: "Confirm Cancellation",
    es: "Confirmar cancelacion",
  },
  "cancel.keepSubscription": {
    en: "Keep My Subscription",
    es: "Mantener mi suscripcion",
  },
  "cancel.additionalFeedback": {
    en: "Any additional feedback?",
    es: "Algun comentario adicional?",
  },

  // ── Feedback page ────────────────────────────────────────
  "feedback.title": { en: "Feedback & Reviews", es: "Comentarios y resenas" },
  "feedback.bugReport": { en: "Bug Report", es: "Reporte de error" },
  "feedback.featureRequest": {
    en: "Feature Request",
    es: "Solicitud de funcion",
  },
  "feedback.generalFeedback": {
    en: "General Feedback",
    es: "Comentario general",
  },
  "feedback.submitFeedback": {
    en: "Submit Feedback",
    es: "Enviar comentario",
  },
  "feedback.approve": { en: "Approve", es: "Aprobar" },
  "feedback.dismiss": { en: "Dismiss", es: "Descartar" },

  // ── Auth extras ──────────────────────────────────────────
  "auth.placeholder.email": { en: "you@business.com", es: "tu@negocio.com" },
  "auth.placeholder.password": {
    en: "Enter your password",
    es: "Ingresa tu contrasena",
  },
  "auth.placeholder.minChars": {
    en: "Min 8 characters",
    es: "Minimo 8 caracteres",
  },
  "auth.placeholder.confirmPassword": {
    en: "Re-enter your password",
    es: "Confirma tu contrasena",
  },
  "auth.strength.chars": { en: "8+ chars", es: "8+ car." },
  "auth.strength.letter": { en: "Letter", es: "Letra" },
  "auth.strength.number": { en: "Number", es: "Numero" },

  // ── Overview page extras ─────────────────────────────────
  "overview.whatsHappening": {
    en: "What's Happening",
    es: "Lo que esta pasando",
  },
  "overview.quickActions": { en: "Quick Actions", es: "Acciones rapidas" },
  "overview.viewAllCalls": { en: "View All Calls", es: "Ver todas las llamadas" },
  "overview.viewAppointments": {
    en: "View Appointments",
    es: "Ver citas",
  },
  "overview.viewCustomers": { en: "View Customers", es: "Ver clientes" },
  "overview.liveNow": { en: "Live Now", es: "En vivo" },
  "overview.callInProgress": {
    en: "call in progress",
    es: "llamada en progreso",
  },
  "overview.revenueEstimate": {
    en: "Revenue Estimate",
    es: "Estimacion de ingresos",
  },
  "overview.newCustomers": { en: "New Customers", es: "Nuevos clientes" },
  "overview.appointmentsToday": {
    en: "Appointments Today",
    es: "Citas hoy",
  },

  // ── Settings page extras ─────────────────────────────────
  "settings.aiPhoneNumber": {
    en: "AI Phone Number",
    es: "Numero de telefono AI",
  },
  "settings.businessDescription": {
    en: "Business Description",
    es: "Descripcion del negocio",
  },
  "settings.specialInstructions": {
    en: "Special Instructions",
    es: "Instrucciones especiales",
  },
  "settings.englishGreeting": {
    en: "English Greeting",
    es: "Saludo en ingles",
  },
  "settings.spanishGreeting": {
    en: "Spanish Greeting",
    es: "Saludo en espanol",
  },
  "settings.languagePreference": {
    en: "Language Preference",
    es: "Preferencia de idioma",
  },
  "settings.emergencyContact": {
    en: "Emergency Contact",
    es: "Contacto de emergencia",
  },
  "settings.callNotifications": {
    en: "Call Notifications",
    es: "Notificaciones de llamadas",
  },
  "settings.googleReviewRequests": {
    en: "Google Review Requests",
    es: "Solicitudes de resena en Google",
  },
  "settings.servicePricing": {
    en: "Service Pricing",
    es: "Precios de servicios",
  },
  "settings.importData": { en: "Import Your Data", es: "Importa tus datos" },
  "settings.estimateMode": { en: "Estimate Mode", es: "Modo de cotizacion" },
  "settings.pricingRanges": { en: "Pricing Ranges", es: "Rangos de precios" },
  "settings.advancedFormulas": {
    en: "Advanced Formulas",
    es: "Formulas avanzadas",
  },
  "settings.trainReceptionist": {
    en: "Train {name}",
    es: "Entrenar a {name}",
  },
  "settings.professional": { en: "Professional", es: "Profesional" },
  "settings.professionalDesc": {
    en: "Polished and efficient. Gets straight to business.",
    es: "Pulida y eficiente. Va directo al grano.",
  },
  "settings.friendly": { en: "Friendly", es: "Amigable" },
  "settings.friendlyDesc": {
    en: "Warm and approachable. Makes every caller feel welcome.",
    es: "Calida y accesible. Hace que cada llamante se sienta bienvenido.",
  },
  "settings.warmCaring": { en: "Warm & Caring", es: "Calida y atenta" },
  "settings.warmCaringDesc": {
    en: "Extra empathetic. Perfect for sensitive clients.",
    es: "Extra empatica. Perfecta para clientes sensibles.",
  },
  "settings.open": { en: "Open", es: "Abierto" },
  "settings.webhookEndpoints": {
    en: "Webhook Endpoints",
    es: "Endpoints de webhook",
  },
  "settings.automatedFeatures": {
    en: "Automated Features",
    es: "Funciones automatizadas",
  },
  "settings.perJob": { en: "per job", es: "por trabajo" },
  "settings.perHour": { en: "per hour", es: "por hora" },
  "settings.perSqft": { en: "per sqft", es: "por pie cuadrado" },
  "settings.perUnit": { en: "per unit", es: "por unidad" },
  "settings.title": { en: "Settings", es: "Configuracion" },
  "settings.subtitle": {
    en: "Customize {name} and your business information",
    es: "Personaliza a {name} y la informacion de tu negocio",
  },
  "settings.activeStatus": { en: "Active", es: "Activa" },
  "settings.inactiveStatus": { en: "Inactive", es: "Inactiva" },
  "settings.answering247": {
    en: "{name} is answering calls 24/7",
    es: "{name} esta contestando llamadas 24/7",
  },
  "settings.contactSupport": {
    en: "Contact support to reactivate",
    es: "Contacta soporte para reactivar",
  },
  "settings.savedSuccess": {
    en: "Settings saved successfully",
    es: "Configuracion guardada con exito",
  },
  "settings.savedToast": {
    en: "Settings saved — changes take effect on the next call",
    es: "Guardado — los cambios aplican en la siguiente llamada",
  },
  "settings.failedLoad": {
    en: "Failed to load settings",
    es: "No se pudo cargar la configuracion",
  },
  "settings.failedSave": {
    en: "Failed to save settings",
    es: "No se pudo guardar la configuracion",
  },
  "settings.loadingSettings": {
    en: "Loading settings...",
    es: "Cargando configuracion...",
  },
  "settings.industry": { en: "Industry", es: "Industria" },
  "settings.readOnly": { en: "(read-only)", es: "(solo lectura)" },
  "settings.managedByCapta": {
    en: "(managed by Capta)",
    es: "(administrado por Capta)",
  },
  "settings.descriptionPlaceholder": {
    en: "Extra context for your AI receptionist (e.g. specialties, policies)",
    es: "Contexto adicional para tu recepcionista AI (ej. especialidades, politicas)",
  },
  "settings.receptionistNameField": { en: "Name", es: "Nombre" },
  "settings.voiceTitle": {
    en: "{name}'s Voice",
    es: "Voz de {name}",
  },
  "settings.voiceDesc": {
    en: "Choose how {name} sounds on calls. Click the play button to preview.",
    es: "Elige como suena {name} en llamadas. Haz clic en el boton de reproduccion para escuchar.",
  },
  "settings.voiceChanges": {
    en: "Voice changes take effect on the next call.",
    es: "Los cambios de voz aplican en la siguiente llamada.",
  },
  "settings.specialInstructionsTitle": {
    en: "{name}'s Special Instructions",
    es: "Instrucciones especiales de {name}",
  },
  "settings.specialInstructionsDesc": {
    en: "Customize how {name} sounds on calls. These instructions shape her tone and behavior.",
    es: "Personaliza como suena {name} en llamadas. Estas instrucciones definen su tono y comportamiento.",
  },
  "settings.specialInstructionsPlaceholder": {
    en: "Examples:\n\u2022 Be extra friendly and casual\n\u2022 Always mention we offer military discounts\n\u2022 If someone asks about pricing, say we offer free estimates\n\u2022 Mention our satisfaction guarantee",
    es: "Ejemplos:\n\u2022 Se extra amigable y casual\n\u2022 Siempre menciona que ofrecemos descuentos militares\n\u2022 Si preguntan por precios, di que ofrecemos estimados gratis\n\u2022 Menciona nuestra garantia de satisfaccion",
  },
  "settings.greetingTitle": {
    en: "{name}'s Greeting",
    es: "Saludo de {name}",
  },
  "settings.previewGreeting": {
    en: "Preview Greeting",
    es: "Vista previa del saludo",
  },
  "settings.hidePreview": { en: "Hide Preview", es: "Ocultar vista previa" },
  "settings.whenSomeoneCalls": {
    en: "When someone calls, {name} will say:",
    es: "Cuando alguien llame, {name} dira:",
  },
  "settings.forSpanishCallers": {
    en: "For Spanish callers:",
    es: "Para llamadas en espanol:",
  },
  "settings.bilingualNote": {
    en: "{name} is bilingual and will switch languages automatically. This sets the default.",
    es: "{name} es bilingue y cambiara de idioma automaticamente. Esto establece el predeterminado.",
  },
  "settings.emergencyPhoneLabel": {
    en: "Emergency Phone Number",
    es: "Numero de emergencia",
  },
  "settings.emergencyNote": {
    en: "If set, {name} will SMS this number in addition to the owner during emergency transfers. Leave blank to only notify the owner phone.",
    es: "Si se configura, {name} enviara SMS a este numero ademas del dueno durante transferencias de emergencia. Dejalo en blanco para solo notificar al telefono del dueno.",
  },
  "settings.weeklyDigestEnable": {
    en: "Enable Weekly Digest",
    es: "Activar resumen semanal",
  },
  "settings.weeklyDigestDesc": {
    en: "Performance report delivered every Monday",
    es: "Reporte de rendimiento entregado cada lunes",
  },
  "settings.weeklyDigestLong": {
    en: "Get a weekly performance report every Monday — calls answered, appointments booked, revenue estimates, and more.",
    es: "Recibe un reporte de rendimiento cada lunes — llamadas contestadas, citas agendadas, estimaciones de ingresos y mas.",
  },
  "settings.deliveryMethod": {
    en: "Delivery Method",
    es: "Metodo de envio",
  },
  "settings.emailPlusSms": { en: "Email + SMS", es: "Correo + SMS" },
  "settings.emailOnly": { en: "Email Only", es: "Solo correo" },
  "settings.smsOnly": { en: "SMS Only", es: "Solo SMS" },
  "settings.dailyReport": { en: "Daily Report", es: "Reporte diario" },
  "settings.dailySummaryDesc": {
    en: "{name} sends you a daily end-of-day briefing with new leads, estimates, tomorrow's appointments, and action items.",
    es: "{name} te envia un resumen diario con nuevos prospectos, estimados, citas de manana y pendientes.",
  },
  "settings.enableDailySummary": {
    en: "Enable Daily Summary",
    es: "Activar resumen diario",
  },
  "settings.dailySummarySubDesc": {
    en: "End-of-day briefing with key stats and action items",
    es: "Resumen al final del dia con estadisticas clave y pendientes",
  },
  "settings.howReceiveDaily": {
    en: "How do you want to receive your daily report?",
    es: "Como quieres recibir tu reporte diario?",
  },
  "settings.textMessage": { en: "Text Message", es: "Mensaje de texto" },
  "settings.both": { en: "Both", es: "Ambos" },
  "settings.deliveryTime": { en: "Delivery Time", es: "Hora de envio" },
  "settings.automatedFeaturesDesc": {
    en: "Toggle automated SMS features that run in the background to help you grow.",
    es: "Activa funciones automatizadas de SMS que operan en segundo plano para ayudarte a crecer.",
  },
  "settings.googleReviewRequestsLabel": {
    en: "Google Review Requests",
    es: "Solicitudes de resena en Google",
  },
  "settings.googleReviewRequestsDesc": {
    en: "Auto-text customers after appointments asking for a Google review",
    es: "Envio automatico a clientes despues de citas pidiendo una resena en Google",
  },
  "settings.missedCallRecoveryLabel": {
    en: "Missed Call Recovery",
    es: "Recuperacion de llamadas perdidas",
  },
  "settings.missedCallRecoveryDesc": {
    en: "Auto-text callers who hang up within 15 seconds to recover the lead",
    es: "Envio automatico a quienes cuelgan en 15 segundos para recuperar el cliente",
  },
  "settings.customerRecall": { en: "Customer Recall", es: "Recordatorio a clientes" },
  "settings.customerRecallDesc": {
    en: "Remind past customers when seasonal maintenance is due",
    es: "Recuerda a clientes pasados cuando toca mantenimiento de temporada",
  },
  "settings.callNotificationsDesc": {
    en: "Control when and how you receive notifications about calls.",
    es: "Controla cuando y como recibes notificaciones de llamadas.",
  },
  "settings.everyCall": { en: "Every call", es: "Cada llamada" },
  "settings.everyCallDesc": {
    en: "Get an SMS after every answered call",
    es: "Recibe un SMS despues de cada llamada contestada",
  },
  "settings.missedCallsOnly": { en: "Missed calls only", es: "Solo llamadas perdidas" },
  "settings.missedCallsOnlyDesc": {
    en: "Only get notified when a call is missed or abandoned",
    es: "Solo recibe notificacion cuando se pierde o abandona una llamada",
  },
  "settings.quietHoursDesc": {
    en: "No owner notifications will be sent during these hours (except emergencies). Skipped notifications are included in your daily digest instead.",
    es: "No se enviaran notificaciones al dueno durante estas horas (excepto emergencias). Las notificaciones omitidas se incluyen en tu resumen diario.",
  },
  "settings.quietHoursStart": { en: "Start", es: "Inicio" },
  "settings.quietHoursEnd": { en: "End", es: "Fin" },
  "settings.currentWindow": {
    en: "Current window:",
    es: "Ventana actual:",
  },
  "settings.quietHoursNote": {
    en: "{name} still answers calls 24/7 — only your personal notifications are paused.",
    es: "{name} sigue contestando llamadas 24/7 — solo tus notificaciones personales se pausan.",
  },
  "settings.googleReviewAutoDesc": {
    en: "Automatically text customers 24 hours after their appointment asking for a Google review. Bilingual EN/ES, max once per customer every 90 days.",
    es: "Envio automatico de texto a clientes 24 horas despues de su cita pidiendo una resena en Google. Bilingue EN/ES, maximo una vez cada 90 dias.",
  },
  "settings.enableReviewRequests": {
    en: "Enable Review Requests",
    es: "Activar solicitudes de resena",
  },
  "settings.googleReviewUrl": {
    en: "Google Review URL",
    es: "URL de resena de Google",
  },
  "settings.googleReviewUrlHint": {
    en: "Find your link in Google Business Profile \u2192 Share review form",
    es: "Encuentra tu enlace en Google Business Profile \u2192 Compartir formulario de resena",
  },
  "settings.missedCallRecoveryAutoDesc": {
    en: "If a caller hangs up within 15 seconds, automatically text them to recover the lead. They can reply YES to request a callback.",
    es: "Si un llamante cuelga en 15 segundos, se le envia un texto automatico para recuperar el prospecto. Pueden responder SI para solicitar devolucion de llamada.",
  },
  "settings.enableMissedCallRecovery": {
    en: "Enable Missed Call Recovery",
    es: "Activar recuperacion de llamadas perdidas",
  },
  "settings.hoursScheduleNote": {
    en: "{name} answers calls 24/7, but appointments are only scheduled during business hours.",
    es: "{name} contesta llamadas 24/7, pero las citas solo se agendan durante horario de atencion.",
  },
  "settings.servicesCanBook": {
    en: "Services Your AI Can Book",
    es: "Servicios que tu AI puede agendar",
  },
  "settings.addServicePlaceholder": {
    en: "Add a service...",
    es: "Agregar un servicio...",
  },
  "settings.servicesCount": {
    en: "{n}/20 services",
    es: "{n}/20 servicios",
  },
  "settings.removeService": { en: "Remove service", es: "Quitar servicio" },
  "settings.enablePricingDiscuss": {
    en: "Enable {name} to discuss pricing",
    es: "Permitir a {name} hablar de precios",
  },
  "settings.enablePricingDiscussDesc": {
    en: "When enabled, {name} will quote ballpark prices with a \"final price may vary\" disclaimer",
    es: "Cuando esta activo, {name} dara precios aproximados con un aviso de que el precio final puede variar",
  },
  "settings.loadingPricing": {
    en: "Loading pricing...",
    es: "Cargando precios...",
  },
  "settings.addServicePricing": {
    en: "+ Add Service Pricing",
    es: "+ Agregar precio de servicio",
  },
  "settings.serviceName": { en: "Service name", es: "Nombre del servicio" },
  "settings.deletePricing": { en: "Delete Pricing?", es: "Eliminar precio?" },
  "settings.deletePricingDesc": {
    en: "This will remove the pricing entry. This action cannot be undone.",
    es: "Esto eliminara la entrada de precio. Esta accion no se puede deshacer.",
  },
  "settings.importDataDesc": {
    en: "Switching from another system? Import your customers, appointments, and estimates from a CSV file.",
    es: "Cambiando de otro sistema? Importa tus clientes, citas y estimados desde un archivo CSV.",
  },
  "settings.importDataSupports": {
    en: "Supports exports from Jobber, ServiceTitan, Housecall Pro, and more.",
    es: "Compatible con exportaciones de Jobber, ServiceTitan, Housecall Pro y mas.",
  },
  "settings.importDataButton": { en: "Import Data", es: "Importar datos" },
  "settings.estimateModeDesc": {
    en: "Choose how {name} quotes prices to callers. Quick mode uses flat min/max ranges. Advanced mode uses formula-based calculations with multipliers.",
    es: "Elige como {name} cotiza precios a quienes llaman. Modo rapido usa rangos planos min/max. Modo avanzado usa calculos con formulas y multiplicadores.",
  },
  "settings.quickSetup": { en: "Quick Setup", es: "Configuracion rapida" },
  "settings.advanced": { en: "Advanced", es: "Avanzado" },
  "settings.pricingRangesDesc": {
    en: "Set min/max price ranges for common job types. {name} will share these as ballpark estimates with callers.",
    es: "Establece rangos de precio min/max para tipos de trabajo comunes. {name} compartira estos como estimados aproximados.",
  },
  "settings.addJobType": { en: "+ Add Job Type", es: "+ Agregar tipo de trabajo" },
  "settings.advancedFormulasDesc": {
    en: "Formula-based pricing for complex or commercial jobs. Creates calculated estimates using intake data.",
    es: "Precios basados en formulas para trabajos complejos o comerciales. Crea estimados calculados usando datos de ingreso.",
  },
  "settings.saveFormula": { en: "Save Formula", es: "Guardar formula" },
  "settings.addAdvancedFormula": {
    en: "+ Add Advanced Formula",
    es: "+ Agregar formula avanzada",
  },
  "settings.baseRate": { en: "Base Rate ($)", es: "Tarifa base ($)" },
  "settings.per": { en: "Per", es: "Por" },
  "settings.variableKey": { en: "Variable Key", es: "Clave de variable" },
  "settings.additionalRates": { en: "Additional Rates", es: "Tarifas adicionales" },
  "settings.addRate": { en: "+ Add rate", es: "+ Agregar tarifa" },
  "settings.marginLow": { en: "Margin Low (%)", es: "Margen bajo (%)" },
  "settings.marginHigh": { en: "Margin High (%)", es: "Margen alto (%)" },
  "settings.faqResponses": { en: "FAQ Responses", es: "Respuestas frecuentes" },
  "settings.faqResponsesDesc": {
    en: "Custom answers to common questions",
    es: "Respuestas personalizadas a preguntas comunes",
  },
  "settings.offLimitsTopics": { en: "Off-Limits Topics", es: "Temas prohibidos" },
  "settings.offLimitsTopicsDesc": {
    en: "Topics to avoid, with optional redirect",
    es: "Temas a evitar, con redireccion opcional",
  },
  "settings.preferredPhrases": { en: "Preferred Phrases", es: "Frases preferidas" },
  "settings.preferredPhrasesDesc": {
    en: "Phrases to naturally weave in",
    es: "Frases para usar de forma natural",
  },
  "settings.emergencyKeywords": { en: "Emergency Keywords", es: "Palabras clave de emergencia" },
  "settings.emergencyKeywordsDesc": {
    en: "Additional emergency triggers",
    es: "Activadores de emergencia adicionales",
  },
  "settings.trainDesc": {
    en: "Teach {name} custom responses for common questions, off-limits topics, preferred phrases, and additional emergency triggers.",
    es: "Ensena a {name} respuestas personalizadas para preguntas comunes, temas prohibidos, frases preferidas y activadores de emergencia.",
  },
  "settings.preview": { en: "Preview", es: "Vista previa" },
  "settings.stop": { en: "Stop", es: "Detener" },
  "settings.password": { en: "Password", es: "Contrasena" },
  "settings.passwordSet": { en: "Password is set", es: "La contrasena esta configurada" },
  "settings.noPasswordSet": {
    en: "No password set — using magic link only",
    es: "Sin contrasena — solo enlace magico",
  },
  "settings.lastChanged": {
    en: "Last changed {date}",
    es: "Ultimo cambio {date}",
  },
  "settings.setPassword": { en: "Set Password", es: "Establecer contrasena" },
  "settings.change": { en: "Change", es: "Cambiar" },
  "settings.newPassword": { en: "New Password", es: "Nueva contrasena" },
  "settings.confirmNewPassword": {
    en: "Confirm New Password",
    es: "Confirmar nueva contrasena",
  },
  "settings.updatePassword": { en: "Update Password", es: "Actualizar contrasena" },
  "settings.passwordsDontMatch": {
    en: "Passwords don't match",
    es: "Las contrasenas no coinciden",
  },
  "settings.passwordUpdated": {
    en: "Password updated",
    es: "Contrasena actualizada",
  },
  "settings.passwordSetSuccess": {
    en: "Password set successfully",
    es: "Contrasena establecida con exito",
  },
  "settings.passwordSetLabel": { en: "Password set", es: "Contrasena establecida" },
  "settings.outboundCalling": { en: "Outbound Calling", es: "Llamadas salientes" },
  "settings.enableOutbound": {
    en: "Enable Outbound Calls",
    es: "Activar llamadas salientes",
  },
  "settings.letMariaCalls": {
    en: "Let {name} make calls on your behalf",
    es: "Permite a {name} hacer llamadas en tu nombre",
  },
  "settings.appointmentReminders": {
    en: "Appointment Reminders",
    es: "Recordatorios de citas",
  },
  "settings.estimateFollowups": {
    en: "Estimate Follow-ups",
    es: "Seguimientos de estimados",
  },
  "settings.seasonalReminders": {
    en: "Seasonal Reminders",
    es: "Recordatorios de temporada",
  },
  "settings.callWindowStart": {
    en: "Call Window Start",
    es: "Inicio de ventana de llamadas",
  },
  "settings.callWindowEnd": {
    en: "Call Window End",
    es: "Fin de ventana de llamadas",
  },
  "settings.maxCallsPerDay": {
    en: "Max Calls Per Day",
    es: "Max llamadas por dia",
  },
  "settings.hideSeasonalServices": {
    en: "Hide Seasonal Services",
    es: "Ocultar servicios de temporada",
  },
  "settings.manageSeasonalServices": {
    en: "Manage Seasonal Services",
    es: "Administrar servicios de temporada",
  },
  "settings.addService": { en: "Add Service", es: "Agregar servicio" },
  "settings.adding": { en: "Adding...", es: "Agregando..." },
  "settings.googleCalendar": { en: "Google Calendar", es: "Google Calendar" },
  "settings.connected": { en: "Connected", es: "Conectado" },
  "settings.active": { en: "Active", es: "Activo" },
  "settings.lastSync": { en: "Last sync:", es: "Ultima sincronizacion:" },
  "settings.gcalConnectedDesc": {
    en: "New appointments booked by your receptionist will appear on your Google Calendar. Busy times on your Google Calendar will be respected when checking availability.",
    es: "Las nuevas citas agendadas por tu recepcionista apareceran en tu Google Calendar. Los horarios ocupados en tu Google Calendar se respetaran al verificar disponibilidad.",
  },
  "settings.disconnect": { en: "Disconnect", es: "Desconectar" },
  "settings.disconnecting": { en: "Disconnecting...", es: "Desconectando..." },
  "settings.gcalDesc": {
    en: "Sync appointments with your calendar and prevent double-bookings.",
    es: "Sincroniza citas con tu calendario y evita reservas dobles.",
  },
  "settings.gcalFeatures": {
    en: "When connected, your receptionist will:",
    es: "Cuando este conectado, tu recepcionista:",
  },
  "settings.gcalFeature1": {
    en: "Add new appointments to your Google Calendar",
    es: "Agregara nuevas citas a tu Google Calendar",
  },
  "settings.gcalFeature2": {
    en: "Check your calendar for conflicts before booking",
    es: "Revisara tu calendario por conflictos antes de agendar",
  },
  "settings.gcalFeature3": {
    en: "Remove cancelled appointments from your calendar",
    es: "Eliminara citas canceladas de tu calendario",
  },
  "settings.connectGoogleCalendar": {
    en: "Connect Google Calendar",
    es: "Conectar Google Calendar",
  },
  "settings.connecting": { en: "Connecting...", es: "Conectando..." },
  "settings.integrations": { en: "Integrations", es: "Integraciones" },
  "settings.to": { en: "to", es: "a" },
  "settings.english": { en: "English", es: "Ingles" },
  "settings.spanish": { en: "Spanish", es: "Espanol" },
  "settings.confirm": { en: "Confirm?", es: "Confirmar?" },
  "settings.removeResponse": { en: "Remove this response?", es: "Eliminar esta respuesta?" },
  "settings.perRoom": { en: "per room", es: "por cuarto" },

  // ── Settings: Validation messages ──
  "settings.validation.required": { en: "This field is required", es: "Este campo es obligatorio" },
  "settings.validation.max100": { en: "Max 100 characters", es: "Maximo 100 caracteres" },
  "settings.validation.emailRequired": { en: "Email is required", es: "El correo es obligatorio" },
  "settings.validation.invalidEmail": { en: "Invalid email address", es: "Correo electronico invalido" },
  "settings.validation.phoneRequired": { en: "Phone is required", es: "El telefono es obligatorio" },
  "settings.validation.invalidPhone": { en: "Invalid US phone number", es: "Numero de telefono invalido" },
  "settings.validation.max200": { en: "Max 200 characters", es: "Maximo 200 caracteres" },
  "settings.validation.max1000": { en: "Max 1000 characters", es: "Maximo 1000 caracteres" },
  "settings.validation.max500": { en: "Max 500 characters", es: "Maximo 500 caracteres" },
  "settings.validation.min8chars": { en: "Min 8 characters", es: "Minimo 8 caracteres" },

  // ── Settings: Voice descriptions ──
  "settings.voiceProfessional": { en: "Professional", es: "Profesional" },
  "settings.voiceFriendly": { en: "Friendly", es: "Amigable" },
  "settings.voiceWarm": { en: "Warm", es: "Calida" },
  "settings.voiceClear": { en: "Clear", es: "Clara" },

  // ── Settings: Toast messages ──
  "settings.toast.pricingEnabled": { en: "Pricing quotes enabled", es: "Cotizaciones de precios activadas" },
  "settings.toast.pricingDisabled": { en: "Pricing quotes disabled", es: "Cotizaciones de precios desactivadas" },
  "settings.toast.failedTogglePricing": { en: "Failed to toggle pricing", es: "Error al cambiar precios" },
  "settings.toast.pricingUpdated": { en: "Pricing updated", es: "Precios actualizados" },
  "settings.toast.failedSave": { en: "Failed to save", es: "Error al guardar" },
  "settings.toast.pricingAdded": { en: "Pricing added", es: "Precio agregado" },
  "settings.toast.failedAddPricing": { en: "Failed to add pricing", es: "Error al agregar precio" },
  "settings.toast.removed": { en: "Removed", es: "Eliminado" },
  "settings.toast.added": { en: "Added", es: "Agregado" },
  "settings.toast.failedAdd": { en: "Failed to add", es: "Error al agregar" },
  "settings.toast.estimateModeSet": { en: "Estimate mode set to {mode}", es: "Modo de cotizacion cambiado a {mode}" },
  "settings.toast.failedUpdateEstimateMode": { en: "Failed to update estimate mode", es: "Error al actualizar modo de cotizacion" },
  "settings.toast.pricingRangeRemoved": { en: "Pricing range removed", es: "Rango de precio eliminado" },
  "settings.toast.failedDelete": { en: "Failed to delete", es: "Error al eliminar" },
  "settings.toast.pricingRangeAdded": { en: "Pricing range added", es: "Rango de precio agregado" },
  "settings.toast.failedCreatePricingRange": { en: "Failed to create pricing range", es: "Error al crear rango de precio" },
  "settings.toast.formulaRemoved": { en: "Formula removed", es: "Formula eliminada" },
  "settings.toast.formulaAdded": { en: "Formula added", es: "Formula agregada" },
  "settings.toast.failedCreateFormula": { en: "Failed to create formula", es: "Error al crear formula" },
  "settings.toast.pricingRemoved": { en: "Pricing removed", es: "Precio eliminado" },
  "settings.toast.settingUpdated": { en: "Setting updated", es: "Configuracion actualizada" },
  "settings.toast.serviceAdded": { en: "Service added", es: "Servicio agregado" },
  "settings.toast.failedAddService": { en: "Failed to add", es: "Error al agregar" },
  "settings.toast.serviceRemoved": { en: "Service removed", es: "Servicio eliminado" },
  "settings.toast.failedRemove": { en: "Failed to remove", es: "Error al eliminar" },
  "settings.toast.gcalConnected": { en: "Google Calendar connected", es: "Google Calendar conectado" },
  "settings.toast.gcalFailedConnect": { en: "Failed to connect Google Calendar", es: "Error al conectar Google Calendar" },
  "settings.toast.gcalFailedStart": { en: "Failed to start connection", es: "Error al iniciar conexion" },
  "settings.toast.failedConnect": { en: "Failed to connect", es: "Error al conectar" },
  "settings.toast.gcalDisconnected": { en: "Google Calendar disconnected", es: "Google Calendar desconectado" },
  "settings.toast.failedDisconnect": { en: "Failed to disconnect", es: "Error al desconectar" },

  // ── Settings: Placeholder text ──
  "settings.placeholder.serviceName": { en: "Service name", es: "Nombre del servicio" },
  "settings.placeholder.faqTrigger": { en: "Question or topic...", es: "Pregunta o tema..." },
  "settings.placeholder.offLimitsTrigger": { en: "Topic to avoid...", es: "Tema a evitar..." },
  "settings.placeholder.phraseTrigger": { en: "Phrase to use...", es: "Frase a utilizar..." },
  "settings.placeholder.emergencyTrigger": { en: "Emergency keyword...", es: "Palabra clave de emergencia..." },
  "settings.placeholder.faqResponse": { en: "Answer...", es: "Respuesta..." },
  "settings.placeholder.offLimitsResponse": { en: "Redirect message (optional)...", es: "Mensaje de redireccion (opcional)..." },
  "settings.placeholder.jobType": { en: "Job type (e.g. Drain Cleaning)", es: "Tipo de trabajo (ej. Limpieza de drenaje)" },
  "settings.placeholder.formulaJobType": { en: "Job Type Label (e.g. Apartment Complex Repaint)", es: "Tipo de trabajo (ej. Repintar complejo de apartamentos)" },
  "settings.placeholder.seasonalServiceName": { en: "Service name (e.g., AC Tune-Up)", es: "Nombre del servicio (ej., Mantenimiento de AC)" },
  "settings.placeholder.customMessage": { en: "Custom message (optional)", es: "Mensaje personalizado (opcional)" },

  // ── Settings: Outbound stats & labels ──
  "settings.outbound.total": { en: "Total:", es: "Total:" },
  "settings.outbound.answered": { en: "Answered:", es: "Respondidas:" },
  "settings.outbound.noAnswer": { en: "No Answer:", es: "Sin respuesta:" },
  "settings.outbound.scheduled": { en: "Scheduled:", es: "Programadas:" },
  "settings.outbound.aptReminder": { en: "Apt Reminder", es: "Recordatorio de cita" },
  "settings.outbound.estimateFollowup": { en: "Estimate F/U", es: "Seg. cotizacion" },
  "settings.outbound.seasonal": { en: "Seasonal", es: "Temporal" },
  "settings.outbound.everyNMonths": { en: "Every {n} months", es: "Cada {n} meses" },
  "settings.outbound.seasonStart": { en: "Season start", es: "Inicio de temporada" },
  "settings.outbound.seasonEnd": { en: "Season end", es: "Fin de temporada" },

  // ── Settings: Price display ──
  "settings.price.from": { en: "from {amount}", es: "desde {amount}" },
  "settings.price.upTo": { en: "up to {amount}", es: "hasta {amount}" },

  // ── Settings: Misc labels ──
  "settings.advancedBadge": { en: "Advanced", es: "Avanzado" },
  "settings.placeholder.serviceArea": { en: "e.g. San Antonio and surrounding areas", es: "ej. San Antonio y areas cercanas" },

  // ── Team page toasts & strings ─────────────────────────────
  "toast.nameRequired": { en: "Name is required", es: "El nombre es obligatorio" },
  "toast.teamMemberUpdated": { en: "Team member updated", es: "Miembro del equipo actualizado" },
  "toast.teamMemberAdded": { en: "Team member added", es: "Miembro del equipo agregado" },
  "toast.failedToRemoveTeamMember": {
    en: "Failed to remove team member",
    es: "No se pudo eliminar al miembro del equipo",
  },
  "toast.failedToUpdateOnCall": {
    en: "Failed to update on-call status",
    es: "No se pudo actualizar el estado de guardia",
  },
  "toast.markedUnavailable": {
    en: "{name} marked as unavailable",
    es: "{name} marcado como no disponible",
  },
  "toast.failedToUpdateAvailability": {
    en: "Failed to update availability",
    es: "No se pudo actualizar la disponibilidad",
  },
  "toast.nowAvailable": {
    en: "{name} is now available",
    es: "{name} ahora esta disponible",
  },
  "toast.nowOnCall": {
    en: "{name} is now on call",
    es: "{name} ahora esta de guardia",
  },
  "toast.noLongerOnCall": {
    en: "{name} is no longer on call",
    es: "{name} ya no esta de guardia",
  },
  "toast.nameRemoved": {
    en: "{name} removed",
    es: "{name} eliminado",
  },
  "team.editTechnician": { en: "Edit Technician", es: "Editar tecnico" },
  "team.status": { en: "Status", es: "Estado" },
  "team.active": { en: "Active", es: "Activo" },
  "team.inactive": { en: "Inactive", es: "Inactivo" },
  "team.onCall": { en: "On Call", es: "De guardia" },
  "team.unavailable": { en: "Unavailable", es: "No disponible" },
  "team.today": { en: "Today", es: "Hoy" },
  "team.job": { en: "job", es: "trabajo" },
  "team.jobs": { en: "jobs", es: "trabajos" },
  "team.markAvailable": { en: "Mark Available", es: "Marcar disponible" },
  "team.markUnavailable": { en: "Mark Unavailable", es: "Marcar no disponible" },
  "team.removeFromOnCall": { en: "Remove from on-call", es: "Quitar de guardia" },
  "team.setOnCall": { en: "Set on-call", es: "Poner de guardia" },
  "team.hideInactive": { en: "Hide Inactive", es: "Ocultar inactivos" },
  "team.showInactive": { en: "Show Inactive", es: "Mostrar inactivos" },
  "team.saving": { en: "Saving...", es: "Guardando..." },
  "team.noTeamMembers": { en: "No team members yet", es: "Aun no hay miembros del equipo" },
  "team.noTeamMembersDesc": {
    en: "Add your technicians to start dispatching jobs and sending schedules.",
    es: "Agrega a tus tecnicos para empezar a despachar trabajos y enviar horarios.",
  },
  "team.markNameUnavailable": {
    en: "Mark {name} Unavailable",
    es: "Marcar a {name} como no disponible",
  },
  "team.reason": { en: "Reason", es: "Razon" },
  "team.reasonPlaceholder": {
    en: "e.g., Sick, Vacation, Personal",
    es: "ej., Enfermo, Vacaciones, Personal",
  },
  "team.until": { en: "Until", es: "Hasta" },
  "team.skillPlaceholder": {
    en: "Type a skill and press Enter",
    es: "Escribe una habilidad y presiona Enter",
  },
  "team.removeConfirmTitle": { en: "Remove {name}?", es: "Eliminar a {name}?" },
  "team.removeConfirmDesc": {
    en: "This will deactivate the technician. They can be reactivated later. Their existing job assignments will remain.",
    es: "Esto desactivara al tecnico. Se puede reactivar despues. Sus asignaciones de trabajo existentes permaneceran.",
  },
  "team.technicians": { en: "technician", es: "tecnico" },
  "team.techniciansPlural": { en: "technicians", es: "tecnicos" },
  "team.onCallCount": { en: "on call", es: "de guardia" },
  "team.unavailableCount": { en: "unavailable", es: "no disponible" },

  // ── Invoices page toasts & strings ─────────────────────────
  "toast.failedToLoadInvoices": {
    en: "Failed to load invoices",
    es: "No se pudieron cargar las facturas",
  },
  "toast.invoiceTotalRequired": {
    en: "Invoice total must be greater than $0",
    es: "El total de la factura debe ser mayor a $0",
  },
  "toast.lineItemRequired": {
    en: "Add at least one line item with a description",
    es: "Agrega al menos una linea con una descripcion",
  },
  "toast.invoiceCreated": { en: "Invoice created", es: "Factura creada" },
  "toast.failedToCreateInvoice": {
    en: "Failed to create invoice",
    es: "No se pudo crear la factura",
  },
  "toast.invoiceSent": {
    en: "Invoice sent to customer via SMS",
    es: "Factura enviada al cliente por SMS",
  },
  "toast.failedToSendInvoice": {
    en: "Failed to send invoice",
    es: "No se pudo enviar la factura",
  },
  "toast.invoiceMarkedPaid": { en: "Invoice marked as paid", es: "Factura marcada como pagada" },
  "toast.failedToMarkPaid": {
    en: "Failed to mark as paid",
    es: "No se pudo marcar como pagada",
  },
  "toast.invoiceCancelled": { en: "Invoice cancelled", es: "Factura cancelada" },
  "toast.failedToCancelInvoice": {
    en: "Failed to cancel invoice",
    es: "No se pudo cancelar la factura",
  },
  "toast.invoiceUpdated": { en: "Invoice updated", es: "Factura actualizada" },
  "toast.failedToUpdateInvoice": {
    en: "Failed to update invoice",
    es: "No se pudo actualizar la factura",
  },
  "invoices.description": {
    en: "Create, send, and track payments from your customers.",
    es: "Crea, envia y rastrea pagos de tus clientes.",
  },
  "invoices.invoiceNumber": { en: "Invoice #", es: "Factura #" },
  "invoices.customer": { en: "Customer", es: "Cliente" },
  "invoices.noCustomer": { en: "No customer", es: "Sin cliente" },
  "invoices.amount": { en: "Amount", es: "Monto" },
  "invoices.status": { en: "Status", es: "Estado" },
  "invoices.dueDate": { en: "Due Date", es: "Fecha de vencimiento" },
  "invoices.outstanding": { en: "Outstanding", es: "Pendiente" },
  "invoices.paidThisMonth": { en: "Paid This Month", es: "Pagado este mes" },
  "invoices.avgDaysToPay": { en: "Avg. Days to Pay", es: "Dias promedio de pago" },
  "invoices.noInvoices": { en: "No invoices yet", es: "Aun no hay facturas" },
  "invoices.noInvoicesDesc": {
    en: "Create your first invoice to start tracking payments and collecting money from customers.",
    es: "Crea tu primera factura para empezar a rastrear pagos y cobrar a tus clientes.",
  },
  "invoices.createInvoice": { en: "Create Invoice", es: "Crear factura" },
  "invoices.noCustomerSelected": { en: "No customer selected", es: "Sin cliente seleccionado" },
  "invoices.lineItems": { en: "Line Items", es: "Lineas de detalle" },
  "invoices.notes": { en: "Notes", es: "Notas" },
  "invoices.notesPlaceholder": {
    en: "Payment terms, special instructions...",
    es: "Terminos de pago, instrucciones especiales...",
  },
  "invoices.creating": { en: "Creating...", es: "Creando..." },
  "invoices.sending": { en: "Sending...", es: "Enviando..." },
  "invoices.paymentMethod": { en: "Payment Method", es: "Metodo de pago" },
  "invoices.cancelInvoice": { en: "Cancel Invoice", es: "Cancelar factura" },
  "invoices.cancelInvoiceDesc": {
    en: "This will cancel the invoice. This action cannot be undone. The customer will no longer be able to pay via the payment link.",
    es: "Esto cancelara la factura. Esta accion no se puede deshacer. El cliente ya no podra pagar a traves del enlace de pago.",
  },
  "invoices.smsSent": { en: "SMS sent", es: "SMS enviado" },
  "invoices.reminders": { en: "Reminders", es: "Recordatorios" },
  "invoices.paidVia": { en: "Paid: {date} via {method}", es: "Pagado: {date} via {method}" },
  "invoices.convertedFromEstimate": { en: "Converted from estimate", es: "Convertida desde cotizacion" },
  "invoices.paymentLink": { en: "Payment link", es: "Enlace de pago" },
  "invoices.searchPlaceholder": { en: "Search invoices...", es: "Buscar facturas..." },
  "invoices.clear": { en: "Clear", es: "Limpiar" },
  "invoices.other": { en: "Other", es: "Otro" },

  // ── Billing page toasts & strings ──────────────────────────
  "toast.failedToLoadBilling": {
    en: "Failed to load billing data",
    es: "No se pudieron cargar los datos de facturacion",
  },
  "toast.couldNotOpenPortal": {
    en: "Could not open billing portal",
    es: "No se pudo abrir el portal de facturacion",
  },
  "toast.switchedToAnnual": {
    en: "Switched to annual plan! You're saving $1,200/year.",
    es: "Cambiado a plan anual! Estas ahorrando $1,200/ano.",
  },
  "toast.failedToSwitchPlan": {
    en: "Failed to switch plan",
    es: "No se pudo cambiar el plan",
  },
  "billing.loadingBilling": { en: "Loading billing...", es: "Cargando facturacion..." },
  "billing.openingPortal": { en: "Opening Portal...", es: "Abriendo portal..." },
  "billing.description": {
    en: "Manage your subscription and payment method",
    es: "Administra tu suscripcion y metodo de pago",
  },
  "billing.paymentDeclined": {
    en: "Your recent payment was declined. Please update your payment method to avoid service interruption.",
    es: "Tu pago reciente fue rechazado. Actualiza tu metodo de pago para evitar interrupciones del servicio.",
  },
  "billing.saveAnnual": {
    en: "Save $1,200/year with Annual Billing",
    es: "Ahorra $1,200/ano con facturacion anual",
  },
  "billing.save20": { en: "SAVE 20%", es: "AHORRA 20%" },
  "billing.switchDesc": {
    en: "Switch from $497/mo to $397/mo billed annually at $4,764/year. Same features, same service — just $100/mo less.",
    es: "Cambia de $497/mes a $397/mes facturado anualmente a $4,764/ano. Mismas funciones, mismo servicio — solo $100/mes menos.",
  },
  "billing.switchToAnnual": { en: "Switch to Annual", es: "Cambiar a anual" },
  "billing.switching": { en: "Switching...", es: "Cambiando..." },
  "billing.annual": { en: "Annual", es: "Anual" },
  "billing.perMonth": { en: "/month", es: "/mes" },
  "billing.billedAnnually": { en: "(billed annually)", es: "(facturado anualmente)" },
  "billing.locations": { en: "Locations", es: "Ubicaciones" },
  "billing.basePlan": { en: "Base plan (1 location)", es: "Plan base (1 ubicacion)" },
  "billing.additionalLocations": {
    en: "Additional locations",
    es: "Ubicaciones adicionales",
  },
  "billing.total": { en: "Total", es: "Total" },
  "billing.update": { en: "Update", es: "Actualizar" },
  "billing.cardExpires": { en: "Expires", es: "Vence" },
  "billing.noPaymentMethod": {
    en: "No payment method on file",
    es: "Sin metodo de pago registrado",
  },
  "billing.switchToAnnualConfirm": {
    en: "Switch to Annual Billing?",
    es: "Cambiar a facturacion anual?",
  },
  "billing.switchConfirmDesc": {
    en: "Your plan will change from $497/mo to $397/mo billed annually at $4,764/year.",
    es: "Tu plan cambiara de $497/mes a $397/mes facturado anualmente a $4,764/ano.",
  },
  "billing.savesYou": {
    en: "This saves you $1,200/year.",
    es: "Esto te ahorra $1,200/ano.",
  },
  "billing.confirmSwitch": { en: "Confirm Switch", es: "Confirmar cambio" },
  "billing.retry": { en: "Retry", es: "Reintentar" },
  "billing.freeTrial": { en: "Free Trial", es: "Prueba Gratuita" },
  "billing.trialEndsIn": {
    en: "Your free trial ends in {days} day{plural} ({date}). Your card will be charged when the trial ends.",
    es: "Tu prueba gratuita termina en {days} dia{plural} ({date}). Tu tarjeta sera cobrada cuando termine la prueba.",
  },
  "billing.trialEndsInOneDay": {
    en: "Your free trial ends in 1 day ({date}). Your card will be charged when the trial ends.",
    es: "Tu prueba gratuita termina en 1 dia ({date}). Tu tarjeta sera cobrada cuando termine la prueba.",
  },
  "billing.additionalLocationsDetail": {
    en: "Additional locations ({count} \u00d7 {price}/mo)",
    es: "Ubicaciones adicionales ({count} \u00d7 {price}/mes)",
  },
  "billing.perMo": { en: "/mo", es: "/mes" },
  "billing.perYr": { en: "/yr", es: "/ano" },
  "billing.annualComparison": {
    en: "$497/mo → $397/mo | $5,964/yr → $4,764/yr",
    es: "$497/mes → $397/mes | $5,964/ano → $4,764/ano",
  },

  // ── Trial ───────────────────────────────────────────────────
  "trial.startFree": {
    en: "Start Free Trial",
    es: "Comenzar Prueba Gratuita",
  },
  "trial.freeFor14Days": {
    en: "Free for 14 days, then $497/mo",
    es: "Gratis por 14 dias, luego $497/mes",
  },
  "trial.daysRemaining": {
    en: "Your free trial ends in {days} days",
    es: "Tu prueba gratuita termina en {days} dias",
  },
  "trial.trialEndsToday": {
    en: "Your free trial ends today",
    es: "Tu prueba gratuita termina hoy",
  },
  "trial.noCharge": {
    en: "No charge until day 15",
    es: "Sin cargo hasta el dia 15",
  },
  "trial.cancelAnytime": {
    en: "Cancel anytime · No contracts",
    es: "Cancela cuando quieras · Sin contratos",
  },

  // ── Dispatch page toasts & strings ─────────────────────────
  "toast.failedToLoadDispatch": {
    en: "Failed to load dispatch data",
    es: "No se pudieron cargar los datos de despacho",
  },
  "toast.technicianAssigned": {
    en: "Technician assigned",
    es: "Tecnico asignado",
  },
  "toast.technicianUnassigned": {
    en: "Technician unassigned",
    es: "Tecnico desasignado",
  },
  "toast.failedToAssign": {
    en: "Failed to assign technician",
    es: "No se pudo asignar al tecnico",
  },
  "toast.scheduleSent": {
    en: "Schedule sent ({count} jobs)",
    es: "Horario enviado ({count} trabajos)",
  },
  "toast.failedToSendSchedule": {
    en: "Failed to send schedule",
    es: "No se pudo enviar el horario",
  },
  "toast.noTechsToNotify": {
    en: "No technicians with jobs and phone numbers to notify",
    es: "No hay tecnicos con trabajos y telefonos para notificar",
  },
  "toast.schedulesSent": {
    en: "Schedules sent to {sent} of {total} technicians",
    es: "Horarios enviados a {sent} de {total} tecnicos",
  },
  "dispatch.sendAllSchedules": { en: "Send All Schedules", es: "Enviar todos los horarios" },
  "dispatch.sendSchedule": { en: "Send schedule", es: "Enviar horario" },
  "dispatch.sending": { en: "Sending...", es: "Enviando..." },
  "dispatch.prev": { en: "Prev", es: "Ant" },
  "dispatch.next": { en: "Next", es: "Sig" },
  "dispatch.today": { en: "Today", es: "Hoy" },
  "dispatch.noJobsScheduled": { en: "No jobs scheduled", es: "Sin trabajos programados" },
  "dispatch.noTechniciansYet": { en: "No technicians yet", es: "Aun no hay tecnicos" },
  "dispatch.noTechniciansDesc": {
    en: "Add your team members to start dispatching jobs.",
    es: "Agrega a tu equipo para empezar a despachar trabajos.",
  },
  "dispatch.addTeam": { en: "Add Team", es: "Agregar equipo" },
  "dispatch.noOtherTechs": { en: "No other techs available", es: "No hay otros tecnicos disponibles" },
  "dispatch.recommended": { en: "Recommended", es: "Recomendado" },
  "dispatch.jobsToday": { en: "jobs today", es: "trabajos hoy" },
  "dispatch.detailStatus": { en: "Status", es: "Estado" },
  "dispatch.detailCustomer": { en: "Customer", es: "Cliente" },
  "dispatch.detailAddress": { en: "Address", es: "Direccion" },
  "dispatch.detailNotes": { en: "Notes", es: "Notas" },
  "dispatch.detailAssigned": { en: "Assigned", es: "Asignado" },
  "dispatch.unknown": { en: "Unknown", es: "Desconocido" },
  "dispatch.untilDate": { en: "until {date}", es: "hasta {date}" },

  // ── Estimates page toasts & strings ────────────────────────
  "toast.failedToLoadEstimates": {
    en: "Failed to load estimates",
    es: "No se pudieron cargar las cotizaciones",
  },
  "toast.estimateMarkedWon": { en: "Estimate marked as won", es: "Cotizacion marcada como ganada" },
  "toast.estimateMarkedLost": { en: "Estimate marked as lost", es: "Cotizacion marcada como perdida" },
  "toast.estimateUpdated": { en: "Estimate updated", es: "Cotizacion actualizada" },
  "toast.failedToUpdateEstimate": {
    en: "Failed to update estimate",
    es: "No se pudo actualizar la cotizacion",
  },
  "toast.followUpSmsSent": { en: "Follow-up SMS sent", es: "SMS de seguimiento enviado" },
  "toast.failedToSendFollowUp": {
    en: "Failed to send follow-up",
    es: "No se pudo enviar el seguimiento",
  },
  "toast.estimateConvertedToInvoice": {
    en: "Estimate converted to invoice",
    es: "Cotizacion convertida a factura",
  },
  "toast.failedToConvertEstimate": {
    en: "Failed to convert estimate",
    es: "No se pudo convertir la cotizacion",
  },
  "estimates.searchPlaceholder": { en: "Search by customer...", es: "Buscar por cliente..." },
  "estimates.autoCreated": {
    en: "Estimates are auto-created when callers request quotes through {name}.",
    es: "Las cotizaciones se crean automaticamente cuando los clientes solicitan presupuestos a traves de {name}.",
  },
  "estimates.customer": { en: "Customer", es: "Cliente" },
  "estimates.service": { en: "Service", es: "Servicio" },
  "estimates.status": { en: "Status", es: "Estado" },
  "estimates.created": { en: "Created", es: "Creada" },
  "estimates.nextFollowUp": { en: "Next Follow-Up", es: "Proximo seguimiento" },
  "estimates.followUpsSent": { en: "Follow-ups sent", es: "Seguimientos enviados" },
  "estimates.last": { en: "Last", es: "Ultimo" },
  "estimates.sendFollowUp": { en: "Send Follow-Up", es: "Enviar seguimiento" },
  "estimates.convertToInvoice": { en: "Convert to Invoice", es: "Convertir a factura" },
  "estimates.converting": { en: "Converting...", es: "Convirtiendo..." },
  "estimates.markWon": { en: "Mark Won", es: "Marcar ganada" },
  "estimates.markLost": { en: "Mark Lost", es: "Marcar perdida" },
  "estimates.wonOn": { en: "Won on {date}", es: "Ganada el {date}" },
  "estimates.lostNoReason": { en: "no reason", es: "sin razon" },
  "estimates.sendFollowUpSms": { en: "Send Follow-Up SMS?", es: "Enviar SMS de seguimiento?" },
  "estimates.sendFollowUpDesc": {
    en: "This will send a follow-up text message to the customer.",
    es: "Esto enviara un mensaje de seguimiento al cliente.",
  },
  "estimates.sendSms": { en: "Send SMS", es: "Enviar SMS" },
  "estimates.markAsWon": { en: "Mark as Won", es: "Marcar como ganada" },
  "estimates.finalAmount": { en: "Final Amount ($)", es: "Monto final ($)" },
  "estimates.confirmWon": { en: "Confirm Won", es: "Confirmar ganada" },
  "estimates.markAsLost": { en: "Mark as Lost", es: "Marcar como perdida" },
  "estimates.reason": { en: "Reason", es: "Razon" },
  "estimates.confirmLost": { en: "Confirm Lost", es: "Confirmar perdida" },
  "estimates.lostReasons.noLongerNeeded": { en: "No longer needed", es: "Ya no se necesita" },
  "estimates.lostReasons.other": { en: "Other", es: "Otra" },
  "estimates.notes": { en: "Notes", es: "Notas" },

  // ── Appointments page toasts & strings ─────────────────────
  "toast.failedToLoadAppointments": {
    en: "Failed to load appointments",
    es: "No se pudieron cargar las citas",
  },
  "toast.appointmentUpdated": {
    en: "Appointment {status}",
    es: "Cita {status}",
  },
  "toast.failedToUpdateAppointment": {
    en: "Failed to update appointment status",
    es: "No se pudo actualizar el estado de la cita",
  },
  "toast.failedToUpdateAppointments": {
    en: "Failed to update appointments",
    es: "No se pudieron actualizar las citas",
  },
  "toast.appointmentsBulkUpdated": {
    en: "{count} appointment(s) {status}",
    es: "{count} cita(s) {status}",
  },

  // ── Cancel page strings ────────────────────────────────────
  "toast.selectCancelReason": {
    en: "Please select a reason for canceling",
    es: "Por favor selecciona una razon para cancelar",
  },
  "toast.selectReasonFirst": {
    en: "Please select a reason first",
    es: "Por favor selecciona una razon primero",
  },
  "toast.retentionOfferSubmitted": {
    en: "Your retention offer has been submitted. Our team will apply the discount within 24 hours.",
    es: "Tu oferta de retencion ha sido enviada. Nuestro equipo aplicara el descuento en 24 horas.",
  },
  "toast.subscriptionCanceled": {
    en: "Your subscription has been canceled. You'll retain access until the end of your billing period.",
    es: "Tu suscripcion ha sido cancelada. Conservaras el acceso hasta el final de tu periodo de facturacion.",
  },
  "cancel.reasons.tooExpensive": { en: "Too Expensive", es: "Muy caro" },
  "cancel.reasons.notEnoughValue": { en: "Not Enough Value", es: "Valor insuficiente" },
  "cancel.reasons.switchingCompetitor": {
    en: "Switching to a Competitor",
    es: "Cambiando a un competidor",
  },
  "cancel.reasons.goingManual": { en: "Going Back to Manual", es: "Volviendo a lo manual" },
  "cancel.reasons.seasonalBusiness": { en: "Seasonal Business", es: "Negocio de temporada" },
  "cancel.rateExperience": {
    en: "How would you rate your experience?",
    es: "Como calificarias tu experiencia?",
  },
  "cancel.ratingLow": {
    en: "We're sorry we didn't meet your expectations.",
    es: "Lamentamos no haber cumplido tus expectativas.",
  },
  "cancel.ratingMid": {
    en: "Thank you for the honest feedback.",
    es: "Gracias por tu comentario honesto.",
  },
  "cancel.ratingHigh": {
    en: "We're glad you had a positive experience!",
    es: "Nos alegra que hayas tenido una buena experiencia!",
  },
  "cancel.starRating": {
    en: "{count} star",
    es: "{count} estrella",
  },
  "cancel.starRatingPlural": {
    en: "{count} stars",
    es: "{count} estrellas",
  },
  "cancel.anythingElse": {
    en: "Anything else you'd like to share?",
    es: "Algo mas que quieras compartir?",
  },
  "cancel.feedbackPlaceholder": {
    en: "Your feedback helps us improve Capta for everyone...",
    es: "Tu opinion nos ayuda a mejorar Capta para todos...",
  },
  "cancel.beforeYouGo": { en: "Before you go...", es: "Antes de irte..." },
  "cancel.recoveryOffer": {
    en: "We'd hate to lose you. How about 2 months free on us? Keep your AI receptionist running, and our team will apply the discount to your account within 24 hours.",
    es: "No queremos perderte. Que tal 2 meses gratis? Mantiene tu recepcionista AI activa, y nuestro equipo aplicara el descuento a tu cuenta en 24 horas.",
  },
  "cancel.processing": { en: "Processing...", es: "Procesando..." },
  "cancel.acceptOffer": {
    en: "Yes, I'll Stay — Give Me 2 Months Free",
    es: "Si, me quedo — Dame 2 meses gratis",
  },
  "cancel.cancelMySubscription": {
    en: "Cancel My Subscription",
    es: "Cancelar mi suscripcion",
  },
  "cancel.canceling": { en: "Canceling...", es: "Cancelando..." },
  "cancel.accessUntilEnd": {
    en: "Your access will continue until the end of your current billing period.",
    es: "Tu acceso continuara hasta el final de tu periodo de facturacion actual.",
  },

  // ── Add Location page strings ──────────────────────────────
  "toast.locationNameRequired": {
    en: "Location name is required",
    es: "El nombre de la ubicacion es obligatorio",
  },
  "toast.locationCreated": {
    en: "Location \"{name}\" created!",
    es: "Ubicacion \"{name}\" creada!",
  },
  "toast.failedToAddLocation": {
    en: "Failed to add location",
    es: "No se pudo agregar la ubicacion",
  },
  "location.addNewLocation": { en: "Add New Location", es: "Agregar nueva ubicacion" },
  "location.stepOf": { en: "Step {step} of 5", es: "Paso {step} de 5" },
  "location.stepInfo": { en: "Location Info", es: "Informacion de la ubicacion" },
  "location.stepServices": { en: "Services", es: "Servicios" },
  "location.stepHours": { en: "Business Hours", es: "Horario de atencion" },
  "location.stepGreeting": { en: "Greeting", es: "Saludo" },
  "location.stepReview": { en: "Review", es: "Revision" },
  "location.locationName": { en: "Location Name", es: "Nombre de la ubicacion" },
  "location.locationNamePlaceholder": {
    en: "e.g., San Antonio, Downtown Office",
    es: "ej., San Antonio, Oficina centro",
  },
  "location.industry": { en: "Industry", es: "Industria" },
  "location.selectIndustry": { en: "Select industry", es: "Seleccionar industria" },
  "location.serviceArea": { en: "Service Area", es: "Area de servicio" },
  "location.serviceAreaPlaceholder": {
    en: "e.g., Austin and surrounding areas",
    es: "ej., Austin y areas cercanas",
  },
  "location.copiedFromPrimary": {
    en: "These were copied from your primary location. Add, remove, or keep as-is.",
    es: "Estos fueron copiados de tu ubicacion principal. Agrega, elimina o deja como estan.",
  },
  "location.addServicePlaceholder": { en: "Add a service...", es: "Agregar un servicio..." },
  "location.noServicesYet": { en: "No services added yet.", es: "Aun no se han agregado servicios." },
  "location.copiedHours": {
    en: "Copied from your primary location. Adjust as needed.",
    es: "Copiado de tu ubicacion principal. Ajusta segun sea necesario.",
  },
  "location.setClosed": { en: "Set Closed", es: "Cerrar" },
  "location.closed": { en: "Closed", es: "Cerrado" },
  "location.greetingDesc": {
    en: "Customize how {name} greets callers at this location. Leave blank to use the default.",
    es: "Personaliza como {name} saluda a los llamantes en esta ubicacion. Deja en blanco para usar el predeterminado.",
  },
  "location.location": { en: "Location", es: "Ubicacion" },
  "location.services": { en: "Services", es: "Servicios" },
  "location.servicesCount": { en: "{n} services", es: "{n} servicios" },
  "location.additionalCost": { en: "Additional Cost", es: "Costo adicional" },
  "location.continue": { en: "Continue", es: "Continuar" },
  "location.creating": { en: "Creating...", es: "Creando..." },
  "location.createLocation": { en: "Create Location", es: "Crear ubicacion" },

  // ── Partners page toasts & strings ─────────────────────────
  "toast.failedToLoadPartners": {
    en: "Failed to load partner data",
    es: "No se pudieron cargar los datos de socios",
  },
  "toast.namePhoneRequired": {
    en: "Name and phone are required",
    es: "El nombre y telefono son obligatorios",
  },
  "toast.partnerUpdated": { en: "Partner updated", es: "Socio actualizado" },
  "toast.partnerAdded": { en: "Partner added", es: "Socio agregado" },
  "toast.failedToSavePartner": {
    en: "Failed to save partner",
    es: "No se pudo guardar el socio",
  },
  "toast.partnerRemoved": { en: "Partner removed", es: "Socio eliminado" },
  "toast.failedToRemovePartner": {
    en: "Failed to remove partner",
    es: "No se pudo eliminar al socio",
  },
  "partners.description": {
    en: "Add trusted partners so your receptionist can refer callers who need services you don't offer",
    es: "Agrega socios de confianza para que tu recepcionista pueda referir a quienes necesitan servicios que no ofreces",
  },
  "partners.partners": { en: "Partners", es: "Socios" },
  "partners.referralLog": { en: "Referral Log", es: "Registro de referidos" },
  "partners.editPartner": { en: "Edit Partner", es: "Editar socio" },
  "partners.addNewPartner": { en: "Add New Partner", es: "Agregar nuevo socio" },
  "partners.businessName": { en: "Business Name", es: "Nombre del negocio" },
  "partners.trade": { en: "Trade", es: "Oficio" },
  "partners.phone": { en: "Phone", es: "Telefono" },
  "partners.contactName": { en: "Contact Name", es: "Nombre de contacto" },
  "partners.email": { en: "Email", es: "Correo" },
  "partners.language": { en: "Language", es: "Idioma" },
  "partners.notes": { en: "Notes", es: "Notas" },
  "partners.trusted": { en: "Trusted", es: "De confianza" },
  "partners.occasional": { en: "Occasional", es: "Ocasional" },
  "partners.loadingPartners": { en: "Loading partners...", es: "Cargando socios..." },
  "partners.noPartnersYet": {
    en: "No partners yet. Add your first referral partner so Maria can connect callers to your network.",
    es: "Aun no hay socios. Agrega tu primer socio de referidos para que Maria conecte a los llamantes con tu red.",
  },
  "partners.noReferralsYet": { en: "No referrals yet", es: "Aun no hay referidos" },
  "partners.noReferralsDesc": {
    en: "When your receptionist refers a caller to one of your partners, it'll show up here.",
    es: "Cuando tu recepcionista refiera a un llamante a uno de tus socios, aparecera aqui.",
  },
  "partners.date": { en: "Date", es: "Fecha" },
  "partners.caller": { en: "Caller", es: "Llamante" },
  "partners.partner": { en: "Partner", es: "Socio" },
  "partners.status": { en: "Status", es: "Estado" },
  "partners.removePartner": { en: "Remove Partner?", es: "Eliminar socio?" },
  "partners.removePartnerDesc": {
    en: "This will remove the partner from your referral network. Existing referral history will be preserved.",
    es: "Esto eliminara al socio de tu red de referidos. El historial de referidos existente se conservara.",
  },
  "partners.removePartnerConfirm": { en: "Remove Partner", es: "Eliminar socio" },

  // ── Customers page toasts & strings ────────────────────────
  "toast.customerAdded": { en: "Customer added successfully", es: "Cliente agregado exitosamente" },
  "toast.failedToCreateCustomer": {
    en: "Failed to create customer",
    es: "No se pudo crear el cliente",
  },
  "toast.customersMerged": {
    en: "Customers merged successfully",
    es: "Clientes combinados exitosamente",
  },
  "toast.failedToMergeCustomers": {
    en: "Failed to merge customers",
    es: "No se pudieron combinar los clientes",
  },
  "customers.addCustomerTitle": { en: "Add Customer", es: "Agregar cliente" },
  "customers.nameLabel": { en: "Name *", es: "Nombre *" },
  "customers.phoneLabel": { en: "Phone *", es: "Telefono *" },
  "customers.emailOptional": { en: "Email (optional)", es: "Correo (opcional)" },

  // ── Referrals page toasts & strings ────────────────────────
  "toast.failedToLoadReferrals": {
    en: "Failed to load referral data",
    es: "No se pudieron cargar los datos de referidos",
  },
  "toast.referralCodeCopied": {
    en: "Referral code copied!",
    es: "Codigo de referido copiado!",
  },
  "toast.shareLinkCopied": {
    en: "Share link copied!",
    es: "Enlace copiado!",
  },
  "referrals.description": {
    en: "Refer a business \u2192 they get 50% off first month \u2192 you get 1 month free ($497 credit)",
    es: "Refiere un negocio \u2192 obtienen 50% de descuento el primer mes \u2192 tu obtienes 1 mes gratis (credito de $497)",
  },
  "referrals.shareThisLink": { en: "Share This Link", es: "Comparte este enlace" },
  "referrals.noCodeYet": {
    en: "No referral code assigned yet. Contact support.",
    es: "Aun no se ha asignado un codigo de referido. Contacta soporte.",
  },
  "referrals.yourReferrals": { en: "Your Referrals", es: "Tus referidos" },
  "referrals.date": { en: "Date", es: "Fecha" },
  "referrals.status": { en: "Status", es: "Estado" },
  "referrals.credit": { en: "Credit", es: "Credito" },
  "referrals.applied": { en: "{amount} applied", es: "{amount} aplicado" },
  "referrals.pending": { en: "{amount} pending", es: "{amount} pendiente" },
  "referrals.loadingReferrals": { en: "Loading referrals...", es: "Cargando referidos..." },

  // ── Follow-ups page toasts & strings ───────────────────────
  "toast.followUpUpdated": { en: "Follow-up updated", es: "Seguimiento actualizado" },
  "toast.failedToUpdateFollowUp": {
    en: "Failed to update follow-up",
    es: "No se pudo actualizar el seguimiento",
  },

  // ── Job Cards page strings ─────────────────────────────────
  "toast.failedToLoadJobCards": {
    en: "Failed to load job cards",
    es: "No se pudieron cargar las ordenes de trabajo",
  },

  // ── Calls page strings ────────────────────────────────────
  "calls.seasonalReminder": {
    en: "Seasonal Reminder",
    es: "Recordatorio de temporada",
  },

  // ── Overview / Dashboard page strings ──────────────────────
  "overview.returning": { en: "returning", es: "recurrente" },
  "overview.hereIsHowPerforming": {
    en: "Here's how {name} is performing",
    es: "Asi va {name} con tu negocio",
  },
  "overview.forwardNumberDesc": {
    en: "Dial *72 then your Capta number (Verizon/landline), or *21* then number and # (AT&T/T-Mobile). Check your carrier's instructions for conditional forwarding.",
    es: "Marca *72 y luego tu numero Capta (Verizon/linea fija), o *21* y luego el numero y # (AT&T/T-Mobile). Consulta las instrucciones de tu operador para desvio condicional.",
  },
  "overview.customizeReceptionistDesc": {
    en: "Set her name, greeting, personality, and the services you offer.",
    es: "Ponle nombre, saludo, personalidad y los servicios que ofreces.",
  },
  "overview.setBusinessHoursDesc": {
    en: "Tell her when you're available so she books appointments at the right times.",
    es: "Dile cuando estas disponible para que agende citas en los horarios correctos.",
  },
  "overview.makeTestCallDesc": {
    en: "Call your Capta number to hear how she handles a real conversation.",
    es: "Llama a tu numero de Capta para escuchar como maneja una conversacion real.",
  },

  // ── Intelligence page strings ──────────────────────────────
  "toast.failedToLoadIntelligence": {
    en: "Failed to load intelligence data",
    es: "No se pudieron cargar los datos de inteligencia",
  },

  // ── Reporting page strings ─────────────────────────────────
  "toast.failedToLoadReporting": {
    en: "Failed to load reporting data",
    es: "No se pudieron cargar los datos de reportes",
  },

  // ── SMS page strings ───────────────────────────────────────
  "toast.failedToLoadSms": {
    en: "Failed to load SMS messages",
    es: "No se pudieron cargar los mensajes SMS",
  },
  "sms.noMatchingMessages": {
    en: "No messages matching \"{query}\"",
    es: "No hay mensajes que coincidan con \"{query}\"",
  },
  "sms.smsDescription": {
    en: "SMS confirmations and reminders will show up here as {name} handles calls.",
    es: "Las confirmaciones y recordatorios SMS apareceran aqui a medida que {name} atienda llamadas.",
  },

  // ── Feedback page strings ──────────────────────────────────
  "feedback.description": {
    en: "Manage customer reviews and share ideas with our team.",
    es: "Administra resenas de clientes y comparte ideas con nuestro equipo.",
  },
  "feedback.newFeedback": { en: "New Feedback", es: "Nuevo comentario" },
  "feedback.feedbackTab": { en: "Feedback", es: "Comentarios" },
  "feedback.reviewsTab": { en: "Reviews", es: "Resenas" },
  "feedback.thankYou": {
    en: "Thank you! Your feedback has been submitted.",
    es: "Gracias! Tu comentario ha sido enviado.",
  },
  "feedback.type": { en: "Type", es: "Tipo" },
  "feedback.category": { en: "Category", es: "Categoria" },
  "feedback.titleLabel": { en: "Title", es: "Titulo" },
  "feedback.titlePlaceholder": {
    en: "Brief summary of your feedback...",
    es: "Breve resumen de tu comentario...",
  },
  "feedback.descriptionLabel": { en: "Description", es: "Descripcion" },
  "feedback.descriptionPlaceholder": {
    en: "Please describe in detail...",
    es: "Por favor describe en detalle...",
  },
  "feedback.submitting": { en: "Submitting...", es: "Enviando..." },
  "feedback.networkError": {
    en: "Network error. Please try again.",
    es: "Error de red. Por favor intenta de nuevo.",
  },
  "feedback.noFeedbackYet": { en: "No feedback yet", es: "Aun no hay comentarios" },
  "feedback.noFeedbackDesc": {
    en: "Share your first idea or feature request with our team.",
    es: "Comparte tu primera idea o solicitud de funcion con nuestro equipo.",
  },
  "feedback.teamResponse": { en: "Team Response", es: "Respuesta del equipo" },
  "feedback.noReviewsYet": { en: "No reviews yet", es: "Aun no hay resenas" },
  "feedback.noReviewsDesc": {
    en: "Reviews will appear here when imported or synced.",
    es: "Las resenas apareceran aqui cuando se importen o sincronicen.",
  },
  "feedback.anonymous": { en: "Anonymous", es: "Anonimo" },
  "feedback.generateReply": { en: "Generate Reply", es: "Generar respuesta" },
  "feedback.generating": { en: "Generating...", es: "Generando..." },
  "feedback.aiDraft": { en: "AI Draft", es: "Borrador AI" },
  "feedback.approved": { en: "(Approved)", es: "(Aprobado)" },
  "feedback.regenerate": { en: "Regenerate", es: "Regenerar" },
  "feedback.regenerating": { en: "Regenerating...", es: "Regenerando..." },
  "feedback.featureRequestLabel": { en: "Feature Request", es: "Solicitud de funcion" },
  "feedback.bugReportLabel": { en: "Bug Report", es: "Reporte de error" },
  "feedback.feedbackLabel": { en: "Feedback", es: "Comentario" },
  "feedback.general": { en: "General", es: "General" },
  "feedback.calls": { en: "Calls", es: "Llamadas" },
  "feedback.billing": { en: "Billing", es: "Facturacion" },
  "feedback.appointments": { en: "Appointments", es: "Citas" },
  "feedback.sms": { en: "SMS", es: "SMS" },
  "feedback.other": { en: "Other", es: "Otro" },

  // ── Shared / Generic strings ───────────────────────────────
  "action.saving": { en: "Saving...", es: "Guardando..." },
  "misc.unknown": { en: "Unknown", es: "Desconocido" },

  // ── Dashboard overview i18n ────────────────────────────────
  "dashboard.topCallers": { en: "Top Callers", es: "Llamadores Frecuentes" },
  "dashboard.calls": { en: "calls", es: "llamadas" },
  "dashboard.actionRequired": { en: "Action Required", es: "Accion Requerida" },
  "dashboard.overdueInvoices": { en: "Overdue invoice(s)", es: "Factura(s) vencida(s)" },
  "dashboard.unassignedToday": { en: "Unassigned appointment(s) today", es: "Cita(s) sin asignar hoy" },
  "dashboard.urgentFollowUps": { en: "Urgent follow-up(s)", es: "Seguimiento(s) urgente(s)" },
  "dashboard.expiredEstimates": { en: "Expired estimate(s)", es: "Presupuesto(s) vencido(s)" },
  "dashboard.healthExcellent": { en: "Excellent", es: "Excelente" },
  "dashboard.healthGood": { en: "Good", es: "Bueno" },
  "dashboard.healthNeedsAttention": { en: "Needs Attention", es: "Necesita Atencion" },
  "dashboard.savedYou": { en: "Saved You", es: "Te Ahorro" },
  "dashboard.noDataYet": { en: "No data yet", es: "Sin datos aun" },

  // ── Calls page i18n ────────────────────────────────────────
  "calls.allOutcomes": { en: "All Outcomes", es: "Todos los Resultados" },
  "calls.bookedAppointment": { en: "Booked Appointment", es: "Cita Agendada" },
  "calls.estimateRequested": { en: "Estimate Requested", es: "Presupuesto Solicitado" },
  "calls.messageTaken": { en: "Message Taken", es: "Mensaje Tomado" },
  "calls.transferred": { en: "Transferred", es: "Transferida" },
  "calls.noAction": { en: "No Action", es: "Sin Accion" },
  "calls.voicemail": { en: "Voicemail", es: "Correo de Voz" },
  "calls.noMatching": { en: "No calls matching your filters", es: "No hay llamadas que coincidan con tus filtros" },
  "calls.jobIntake": { en: "Job Intake", es: "Recepcion de Trabajo" },

  // ── Payment banner i18n ─────────────────────────────────────
  "billing.trialEndsToday": {
    en: "Your free trial ends today.",
    es: "Tu prueba gratuita termina hoy.",
  },
  "billing.trialEndsTomorrow": {
    en: "Your free trial ends tomorrow.",
    es: "Tu prueba gratuita termina manana.",
  },
  "billing.trialEndsInDays": {
    en: "Your free trial ends in {days} days.",
    es: "Tu prueba gratuita termina en {days} dias.",
  },
  "billing.viewBilling": { en: "View billing", es: "Ver facturacion" },
  "billing.paymentOverdueDesc": {
    en: "Your payment is overdue. Please update your payment method to keep your service running.",
    es: "Tu pago esta vencido. Actualiza tu metodo de pago para mantener tu servicio activo.",
  },
  "billing.paymentFailedDesc": {
    en: "Your payment has failed. Update your payment method to avoid service interruption.",
    es: "Tu pago ha fallado. Actualiza tu metodo de pago para evitar la interrupcion del servicio.",
  },
  "billing.updatePayment": { en: "Update Payment", es: "Actualizar pago" },

  // ── Estimates CSV headers ───────────────────────────────────
  "csv.customer": { en: "Customer", es: "Cliente" },
  "csv.service": { en: "Service", es: "Servicio" },
  "csv.amount": { en: "Amount", es: "Monto" },
  "csv.status": { en: "Status", es: "Estado" },
  "csv.created": { en: "Created", es: "Creada" },
  "csv.notes": { en: "Notes", es: "Notas" },
  "csv.invoiceNumber": { en: "Invoice #", es: "Factura #" },
  "csv.dueDate": { en: "Due Date", es: "Fecha de vencimiento" },
  "csv.paidAt": { en: "Paid At", es: "Pagado el" },

  // ── Invoices expanded row / misc ────────────────────────────
  "invoices.tax": { en: "Tax ({rate}%)", es: "Impuesto ({rate}%)" },
  "invoices.invoicePlural": {
    en: "{count} invoice",
    es: "{count} factura",
  },
  "invoices.invoicePluralMultiple": {
    en: "{count} invoices",
    es: "{count} facturas",
  },
  "invoices.fromDate": { en: "From date", es: "Desde" },
  "invoices.toDate": { en: "To date", es: "Hasta" },
  "invoices.clearDateFilter": { en: "Clear date filter", es: "Limpiar filtro de fecha" },

  // ── Customers page — tier labels ──────────────────────────
  "customers.tierHot": { en: "Hot", es: "Caliente" },
  "customers.tierWarm": { en: "Warm", es: "Tibio" },
  "customers.tierCold": { en: "Cold", es: "Frio" },
  "customers.tierDormant": { en: "Dormant", es: "Inactivo" },
  "customers.tierNew": { en: "New", es: "Nuevo" },
  "customers.tierLoyal": { en: "Loyal", es: "Leal" },
  "customers.tierVip": { en: "VIP", es: "VIP" },
  "customers.tierAtRisk": { en: "At Risk", es: "En riesgo" },

  // ── Customers page — misc labels ──────────────────────────
  "customers.unknown": { en: "Unknown", es: "Desconocido" },
  "customers.repeat": { en: "Repeat", es: "Recurrente" },
  "customers.tags": { en: "Tags", es: "Etiquetas" },
  "customers.sortPrefix": { en: "Sort: {label}", es: "Orden: {label}" },
  "customers.ascending": { en: "Ascending", es: "Ascendente" },
  "customers.descending": { en: "Descending", es: "Descendente" },
  "customers.noMatchSearch": {
    en: "No customers match your search",
    es: "Ningun cliente coincide con tu busqueda",
  },
  "customers.noCustomersYet": { en: "No customers yet", es: "Aun no hay clientes" },
  "customers.failedToLoad": {
    en: "Failed to load customers. Please try again.",
    es: "No se pudieron cargar los clientes. Intentalo de nuevo.",
  },
  "customers.namePhoneRequired": {
    en: "Name and phone are required.",
    es: "El nombre y telefono son obligatorios.",
  },
  "customers.failedToCreate": {
    en: "Failed to create customer",
    es: "No se pudo crear el cliente",
  },

  // ── Customers page — merge modal ──────────────────────────
  "customers.mergeDescription": {
    en: "Choose which customer record to keep as primary. Select which field values to preserve.",
    es: "Elige cual registro de cliente mantener como principal. Selecciona que valores conservar.",
  },
  "customers.fieldName": { en: "Name", es: "Nombre" },
  "customers.fieldPhone": { en: "Phone", es: "Telefono" },
  "customers.fieldEmail": { en: "Email", es: "Correo" },
  "customers.fieldAddress": { en: "Address", es: "Direccion" },
  "customers.fieldHeader": { en: "Field", es: "Campo" },
  "customers.customerA": { en: "Customer A", es: "Cliente A" },
  "customers.customerB": { en: "Customer B", es: "Cliente B" },
  "customers.primary": { en: "Primary", es: "Principal" },
  "customers.calls": { en: "calls", es: "llamadas" },
  "customers.appts": { en: "appts", es: "citas" },
  "customers.failedToMerge": {
    en: "Failed to merge customers",
    es: "No se pudieron combinar los clientes",
  },

  // ── Customers page — CSV export headers ───────────────────
  "customers.csvName": { en: "Name", es: "Nombre" },
  "customers.csvPhone": { en: "Phone", es: "Telefono" },
  "customers.csvEmail": { en: "Email", es: "Correo" },
  "customers.csvCalls": { en: "Calls", es: "Llamadas" },
  "customers.csvAppointments": { en: "Appointments", es: "Citas" },
  "customers.csvLastCall": { en: "Last Call", es: "Ultima llamada" },
  "customers.csvLeadScore": { en: "Lead Score", es: "Puntaje" },
  "customers.csvTier": { en: "Tier", es: "Nivel" },
  "customers.csvTags": { en: "Tags", es: "Etiquetas" },

  // ── Partners page — trade labels ──────────────────────────
  "partners.tradeHvac": { en: "HVAC", es: "HVAC" },
  "partners.tradePlumbing": { en: "Plumbing", es: "Plomeria" },
  "partners.tradeElectrical": { en: "Electrical", es: "Electricidad" },
  "partners.tradeRoofing": { en: "Roofing", es: "Techos" },
  "partners.tradeGeneralContractor": { en: "General Contracting", es: "Contratista general" },
  "partners.tradeRestoration": { en: "Restoration", es: "Restauracion" },
  "partners.tradeLandscaping": { en: "Landscaping", es: "Jardineria" },
  "partners.tradePestControl": { en: "Pest Control", es: "Control de plagas" },
  "partners.tradeGarageDoor": { en: "Garage Door", es: "Puerta de garaje" },
  "partners.tradePainting": { en: "Painting", es: "Pintura" },
  "partners.tradeFlooring": { en: "Flooring", es: "Pisos" },
  "partners.tradeConcrete": { en: "Concrete", es: "Concreto" },
  "partners.tradeFencing": { en: "Fencing", es: "Cercas" },
  "partners.tradeWindows": { en: "Windows & Doors", es: "Ventanas y puertas" },
  "partners.tradeInsulation": { en: "Insulation", es: "Aislamiento" },
  "partners.tradeOther": { en: "Other", es: "Otro" },

  // ── Partners page — outcome labels ────────────────────────
  "partners.outcomePending": { en: "Pending", es: "Pendiente" },
  "partners.outcomeConnected": { en: "Connected", es: "Conectado" },
  "partners.outcomeNoResponse": { en: "No Response", es: "Sin respuesta" },
  "partners.outcomeDeclined": { en: "Declined", es: "Rechazado" },

  // ── Partners page — misc labels ───────────────────────────
  "partners.unknown": { en: "Unknown", es: "Desconocido" },
  "partners.english": { en: "English", es: "Ingles" },
  "partners.spanish": { en: "Spanish", es: "Espanol" },

  // ── Reporting page i18n ──────────────────────────────────
  "reporting.description": {
    en: "Call analytics and business insights",
    es: "Analisis de llamadas e informacion del negocio",
  },
  "reporting.failedToLoad": {
    en: "Failed to load reporting data. Please try again.",
    es: "No se pudieron cargar los reportes. Intenta de nuevo.",
  },
  "reporting.failedToLoadToast": {
    en: "Failed to load reporting data",
    es: "No se pudieron cargar los reportes",
  },
  "reporting.unableToLoad": {
    en: "Unable to load reporting data.",
    es: "No se pudieron cargar los datos de reportes.",
  },
  "reporting.totalCalls": { en: "Total Calls", es: "Total de llamadas" },
  "reporting.busiestHour": { en: "Busiest Hour", es: "Hora mas activa" },
  "reporting.busiestDay": { en: "Busiest Day", es: "Dia mas activo" },
  "reporting.recoveryRate": { en: "Recovery Rate", es: "Tasa de recuperacion" },
  "reporting.callsByDay": {
    en: "Calls by Day of Week",
    es: "Llamadas por dia de la semana",
  },
  "reporting.dailyCallVolume": {
    en: "Daily Call Volume",
    es: "Volumen diario de llamadas",
  },
  "reporting.answered": { en: "Answered", es: "Respondidas" },
  "reporting.missed": { en: "Missed", es: "Perdidas" },
  "reporting.callDuration": { en: "Call Duration", es: "Duracion de llamadas" },
  "reporting.languageBreakdown": {
    en: "Language Breakdown",
    es: "Desglose por idioma",
  },
  "reporting.english": { en: "English", es: "Ingles" },
  "reporting.spanish": { en: "Spanish", es: "Espanol" },
  "reporting.calls": { en: "calls", es: "llamadas" },
  "reporting.missedCallRecovery": {
    en: "Missed Call Recovery",
    es: "Recuperacion de llamadas perdidas",
  },
  "reporting.smsSent": { en: "SMS Sent", es: "SMS enviados" },
  "reporting.recovered": { en: "Recovered", es: "Recuperadas" },
  "reporting.noAppointmentsYet": {
    en: "No appointments yet",
    es: "Aun no hay citas",
  },
  "reporting.noEstimatesYet": {
    en: "No estimates yet",
    es: "Aun no hay cotizaciones",
  },
  "reporting.decided": { en: "decided", es: "decididas" },
  "reporting.total": { en: "Total", es: "Total" },
  "reporting.new": { en: "New", es: "Nuevos" },
  "reporting.repeat": { en: "Repeat", es: "Recurrentes" },
  "reporting.outboundCalls": {
    en: "Outbound Calls",
    es: "Llamadas salientes",
  },
  "reporting.totalOutbound": {
    en: "Total Outbound (30 days)",
    es: "Total salientes (30 dias)",
  },
  "reporting.answerRate": { en: "Answer Rate", es: "Tasa de respuesta" },
  "reporting.outboundByType": {
    en: "Outbound by Type",
    es: "Salientes por tipo",
  },
  "reporting.reminders": { en: "Reminders", es: "Recordatorios" },
  "reporting.estimateFollowUps": {
    en: "Estimate Follow-ups",
    es: "Seguimiento de cotizaciones",
  },
  "reporting.seasonal": { en: "Seasonal", es: "De temporada" },
  "reporting.csvHour": { en: "Hour", es: "Hora" },
  "reporting.csvCalls": { en: "Calls", es: "Llamadas" },
  "reporting.pipelineNew": { en: "New", es: "Nuevo" },
  "reporting.pipelineSent": { en: "Sent", es: "Enviado" },
  "reporting.pipelineFollowUp": { en: "Follow Up", es: "Seguimiento" },
  "reporting.pipelineWon": { en: "Won", es: "Ganado" },
  "reporting.pipelineLost": { en: "Lost", es: "Perdido" },

  // ── Intelligence page i18n ───────────────────────────────
  "intelligence.failedToLoad": {
    en: "Failed to load intelligence data",
    es: "No se pudieron cargar los datos de inteligencia",
  },
  "intelligence.excellent": { en: "Excellent", es: "Excelente" },
  "intelligence.good": { en: "Good", es: "Buena" },
  "intelligence.needsAttention": {
    en: "Needs attention",
    es: "Necesita atencion",
  },
  "intelligence.learningBanner": {
    en: "has been learning for",
    es: "lleva aprendiendo",
  },
  "intelligence.learningBannerDay": { en: "day", es: "dia" },
  "intelligence.learningBannerDays": { en: "days", es: "dias" },
  "intelligence.learningBannerSuffix": {
    en: "— handling calls, building customer profiles, and mastering your FAQs.",
    es: "— atendiendo llamadas, creando perfiles de clientes y dominando tus preguntas frecuentes.",
  },
  "intelligence.categoryFaq": { en: "FAQs", es: "Preguntas frecuentes" },
  "intelligence.categoryOffLimits": {
    en: "Off Limits",
    es: "Temas prohibidos",
  },
  "intelligence.categoryPhrase": {
    en: "Custom Phrases",
    es: "Frases personalizadas",
  },
  "intelligence.categoryEmergency": {
    en: "Emergency Keywords",
    es: "Palabras de emergencia",
  },
  "intelligence.gapPending": { en: "pending", es: "pendiente" },
  "intelligence.gapAnswered": { en: "answered", es: "respondido" },
  "intelligence.gapDismissed": { en: "dismissed", es: "descartado" },
  "intelligence.noGapsYet": {
    en: "No knowledge gaps detected yet.",
    es: "Aun no se detectan vacios de conocimiento.",
  },
  "intelligence.qaGreeting": { en: "Greeting", es: "Saludo" },
  "intelligence.qaLanguageMatch": {
    en: "Language Match",
    es: "Coincidencia de idioma",
  },
  "intelligence.qaNeedCapture": {
    en: "Need Capture",
    es: "Captura de necesidad",
  },
  "intelligence.qaActionTaken": {
    en: "Action Taken",
    es: "Accion tomada",
  },
  "intelligence.qaAccuracy": { en: "Accuracy", es: "Precision" },
  "intelligence.qaSentiment": { en: "Sentiment", es: "Sentimiento" },
  "intelligence.qaWillAppear": {
    en: "QA scores will appear after calls are analyzed.",
    es: "Los puntajes de calidad apareceran una vez que se analicen las llamadas.",
  },
  "intelligence.callsSuffix": { en: "calls", es: "llamadas" },
  "intelligence.heatmapMidnight": { en: "12AM", es: "12AM" },
  "intelligence.heatmapNoon": { en: "12PM", es: "12PM" },
  "intelligence.heatmapLateNight": { en: "11PM", es: "11PM" },

  // ── SMS page CSV headers ─────────────────────────────────────
  "sms.csvDate": { en: "Date", es: "Fecha" },
  "sms.csvDirection": { en: "Direction", es: "Direccion" },
  "sms.csvFrom": { en: "From", es: "De" },
  "sms.csvTo": { en: "To", es: "Para" },
  "sms.csvMessage": { en: "Message", es: "Mensaje" },
  "sms.csvStatus": { en: "Status", es: "Estado" },

  // ── Dispatch page extras ─────────────────────────────────────
  "dispatch.jobCount": {
    en: "{count} job today",
    es: "{count} trabajo hoy",
  },
  "dispatch.jobCountPlural": {
    en: "{count} jobs today",
    es: "{count} trabajos hoy",
  },
  "dispatch.jobCountOnDate": {
    en: "{count} job on {date}",
    es: "{count} trabajo el {date}",
  },
  "dispatch.jobCountOnDatePlural": {
    en: "{count} jobs on {date}",
    es: "{count} trabajos el {date}",
  },
  "dispatch.serviceAtTime": {
    en: "{service} at {time}",
    es: "{service} a las {time}",
  },
  "dispatch.jobsCountLabel": {
    en: "{count} jobs",
    es: "{count} trabajos",
  },
  "dispatch.reassign": { en: "Reassign", es: "Reasignar" },
  "dispatch.unassign": { en: "Unassign", es: "Desasignar" },

  // ── Appointments page extras ─────────────────────────────────
  "appointments.failedToLoad": {
    en: "Failed to load appointments. Please try again.",
    es: "No se pudieron cargar las citas. Intenta de nuevo.",
  },
  "appointments.appointmentStatus": {
    en: "Appointment {status}",
    es: "Cita {status}",
  },
  "appointments.failedToUpdate": {
    en: "Failed to update appointment status",
    es: "No se pudo actualizar el estado de la cita",
  },
  "appointments.bulkUpdated": {
    en: "{count} appointment {status}",
    es: "{count} cita {status}",
  },
  "appointments.bulkUpdatedPlural": {
    en: "{count} appointments {status}",
    es: "{count} citas {status}",
  },
  "appointments.failedBulkUpdate": {
    en: "Failed to update appointments",
    es: "No se pudieron actualizar las citas",
  },
  "appointments.csvDate": { en: "Date", es: "Fecha" },
  "appointments.csvTime": { en: "Time", es: "Hora" },
  "appointments.csvService": { en: "Service", es: "Servicio" },
  "appointments.csvCustomer": { en: "Customer", es: "Cliente" },
  "appointments.csvStatus": { en: "Status", es: "Estado" },
  "appointments.csvNotes": { en: "Notes", es: "Notas" },
  "appointments.calendarView": { en: "Calendar view", es: "Vista de calendario" },
  "appointments.listView": { en: "List view", es: "Vista de lista" },
  "appointments.emptyDescription": {
    en: "When your AI receptionist books appointments, they'll appear here.",
    es: "Cuando tu recepcionista AI agende citas, apareceran aqui.",
  },
  "appointments.customizeScheduling": {
    en: "Customize Scheduling",
    es: "Personalizar agenda",
  },
  "appointments.nSelected": {
    en: "{count} selected",
    es: "{count} seleccionados",
  },
  "appointments.clearSelection": { en: "Clear selection", es: "Limpiar seleccion" },
  "appointments.confirmActionTitle": {
    en: "{action} Appointment?",
    es: "{action} cita?",
  },
  "appointments.cancelDescription": {
    en: "This will cancel the appointment. The customer will be notified via SMS.",
    es: "Esto cancelara la cita. El cliente sera notificado por SMS.",
  },
  "appointments.noShowDescription": {
    en: "This will mark the appointment as a no-show.",
    es: "Esto marcara la cita como no presentada.",
  },
  "appointments.bulkConfirmTitle": {
    en: "{action} {count} Appointment?",
    es: "{action} {count} cita?",
  },
  "appointments.bulkConfirmTitlePlural": {
    en: "{action} {count} Appointments?",
    es: "{action} {count} citas?",
  },
  "appointments.bulkCancelDescription": {
    en: "This will cancel {count} appointment. Customers will be notified.",
    es: "Esto cancelara {count} cita. Los clientes seran notificados.",
  },
  "appointments.bulkCancelDescriptionPlural": {
    en: "This will cancel {count} appointments. Customers will be notified.",
    es: "Esto cancelara {count} citas. Los clientes seran notificados.",
  },
  "appointments.bulkNoShowDescription": {
    en: "This will mark {count} appointment as no-show.",
    es: "Esto marcara {count} cita como no presentada.",
  },
  "appointments.bulkNoShowDescriptionPlural": {
    en: "This will mark {count} appointments as no-show.",
    es: "Esto marcara {count} citas como no presentadas.",
  },
  "appointments.bulkCompleteDescription": {
    en: "This will mark {count} appointment as completed.",
    es: "Esto marcara {count} cita como completada.",
  },
  "appointments.bulkCompleteDescriptionPlural": {
    en: "This will mark {count} appointments as completed.",
    es: "Esto marcara {count} citas como completadas.",
  },
  "appointments.previous": { en: "Previous", es: "Anterior" },
  "appointments.next": { en: "Next", es: "Siguiente" },
  "appointments.showingRange": {
    en: "Showing {from}\u2013{to} of {total}",
    es: "Mostrando {from}\u2013{to} de {total}",
  },

  // ── Activity feed ──────────────────────────────────────────
  "activityFeed.recentActivity": {
    en: "Recent Activity",
    es: "Actividad reciente",
  },
  "activityFeed.noRecentActivity": {
    en: "No recent activity",
    es: "Sin actividad reciente",
  },
  "activityFeed.emptyDescription": {
    en: "Activity will appear here as your receptionist handles calls and books appointments.",
    es: "La actividad aparecera aqui cuando tu recepcionista atienda llamadas y agende citas.",
  },
  "activityFeed.justDid": {
    en: "{name} just: {text}",
    es: "{name} acaba de: {text}",
  },
  "activityFeed.recovered": {
    en: "Recovered",
    es: "Recuperada",
  },
  "activityFeed.showLess": {
    en: "Show less",
    es: "Ver menos",
  },
  "activityFeed.moreEvent": {
    en: "+{count} more event",
    es: "+{count} evento mas",
  },
  "activityFeed.moreEvents": {
    en: "+{count} more events",
    es: "+{count} eventos mas",
  },

  // ── Weekly summary ─────────────────────────────────────────
  "weeklySummary.title": {
    en: "This Week's Report",
    es: "Informe de esta semana",
  },
  "weeklySummary.callsHandled": {
    en: "Calls handled",
    es: "Llamadas atendidas",
  },
  "weeklySummary.languageBreakdown": {
    en: "{en} EN / {es} ES",
    es: "{en} EN / {es} ES",
  },
  "weeklySummary.appointmentsBooked": {
    en: "Appointments booked",
    es: "Citas agendadas",
  },
  "weeklySummary.estimatedRevenue": {
    en: "~${amount} estimated",
    es: "~${amount} estimado",
  },
  "weeklySummary.missedCallsRecovered": {
    en: "Missed calls recovered",
    es: "Llamadas perdidas recuperadas",
  },
  "weeklySummary.wouldHaveGoneToVoicemail": {
    en: "Would have gone to voicemail",
    es: "Habrian ido al buzon de voz",
  },
  "weeklySummary.avgCallDuration": {
    en: "Avg. call duration",
    es: "Duracion promedio de llamada",
  },
  "weeklySummary.callersHighlyEngaged": {
    en: "Callers are highly engaged",
    es: "Los clientes estan muy interesados",
  },
  "weeklySummary.busiestHour": {
    en: "Busiest hour: {hour}",
    es: "Hora mas activa: {hour}",
  },
  "weeklySummary.topService": {
    en: "Top service: {name} ({percentage}%)",
    es: "Servicio principal: {name} ({percentage}%)",
  },
  "weeklySummary.trending": {
    en: "Trending: {service}",
    es: "Tendencia: {service}",
  },

  // ── All Locations ─────────────────────────────────────────
  "allLocations.title": { en: "All Locations", es: "Todas las ubicaciones" },
  "allLocations.subtitle": {
    en: "Aggregate stats across {count} locations (last 30 days)",
    es: "Estadisticas agregadas de {count} ubicaciones (ultimos 30 dias)",
  },
  "allLocations.loadError": {
    en: "Multi-location overview not available",
    es: "Resumen multi-ubicacion no disponible",
  },
  "allLocations.loading": {
    en: "Loading all locations...",
    es: "Cargando todas las ubicaciones...",
  },
  "allLocations.totalCalls": { en: "Total Calls", es: "Total de llamadas" },
  "allLocations.completed": { en: "Completed", es: "Completadas" },
  "allLocations.missed": { en: "Missed", es: "Perdidas" },
  "allLocations.appointments": { en: "Appointments", es: "Citas" },
  "allLocations.confirmed": { en: "Confirmed", es: "Confirmadas" },
  "allLocations.customers": { en: "Customers", es: "Clientes" },
  "allLocations.perLocation": { en: "Per Location", es: "Por ubicacion" },
  "allLocations.calls": { en: "calls", es: "llamadas" },
  "allLocations.completedLabel": { en: "completed", es: "completadas" },

  // ── Import ────────────────────────────────────────────────
  "import.title": { en: "Import Data", es: "Importar datos" },
  "import.subtitle": {
    en: "Bring your data from Jobber, ServiceTitan, Housecall Pro, or any other system.",
    es: "Trae tus datos desde Jobber, ServiceTitan, Housecall Pro o cualquier otro sistema.",
  },
  "import.stepChooseType": { en: "Choose Type", es: "Elige tipo" },
  "import.stepUploadFile": { en: "Upload File", es: "Subir archivo" },
  "import.stepPreview": { en: "Preview", es: "Vista previa" },
  "import.stepResults": { en: "Results", es: "Resultados" },
  "import.whatToImport": {
    en: "What would you like to import?",
    es: "Que te gustaria importar?",
  },
  "import.selectType": {
    en: "Select the type of data you want to bring in from your previous system.",
    es: "Selecciona el tipo de datos que quieres traer de tu sistema anterior.",
  },
  "import.customers": { en: "Customers", es: "Clientes" },
  "import.customersDesc": {
    en: "Import your customer list with names, phones, emails, and addresses.",
    es: "Importa tu lista de clientes con nombres, telefonos, correos y direcciones.",
  },
  "import.appointments": { en: "Appointments", es: "Citas" },
  "import.appointmentsDesc": {
    en: "Import scheduled appointments with dates, times, and services.",
    es: "Importa citas programadas con fechas, horarios y servicios.",
  },
  "import.estimates": { en: "Estimates", es: "Cotizaciones" },
  "import.estimatesDesc": {
    en: "Import estimates and quotes with amounts and service details.",
    es: "Importa cotizaciones con montos y detalles de servicios.",
  },
  "import.uploadCsv": {
    en: "Upload {type} CSV",
    es: "Subir CSV de {type}",
  },
  "import.needTemplate": { en: "Need a template?", es: "Necesitas una plantilla?" },
  "import.templateDesc": {
    en: "Download our CSV template with example data and expected columns.",
    es: "Descarga nuestra plantilla CSV con datos de ejemplo y columnas esperadas.",
  },
  "import.downloadTemplate": { en: "Download Template", es: "Descargar plantilla" },
  "import.dropOrBrowse": {
    en: "Drop your CSV file here or click to browse",
    es: "Arrastra tu archivo CSV aqui o haz clic para buscar",
  },
  "import.maxFileSize": { en: "Maximum file size: 5MB", es: "Tamano maximo: 5MB" },
  "import.tipsTitle": { en: "Tips for a smooth import:", es: "Consejos para una importacion exitosa:" },
  "import.tipExport": {
    en: "Export your data as CSV from your current system (Jobber, ServiceTitan, Housecall Pro, etc.)",
    es: "Exporta tus datos como CSV desde tu sistema actual (Jobber, ServiceTitan, Housecall Pro, etc.)",
  },
  "import.tipColumnsMatched": {
    en: "Column names are matched automatically — no need to rename headers",
    es: "Los nombres de columnas se emparejan automaticamente — no necesitas renombrar encabezados",
  },
  "import.tipPhoneLink": {
    en: "Phone numbers are used to link customers across imports",
    es: "Los numeros de telefono se usan para vincular clientes entre importaciones",
  },
  "import.tipDateFormats": {
    en: "Dates can be in MM/DD/YYYY, YYYY-MM-DD, or M/D/YY format",
    es: "Las fechas pueden estar en formato MM/DD/AAAA, AAAA-MM-DD o M/D/AA",
  },
  "import.tipEstimatesCustomersFirst": {
    en: "Import your customers first, then estimates — they are linked by phone number",
    es: "Importa tus clientes primero, luego las cotizaciones — se vinculan por numero de telefono",
  },
  "import.previewImport": { en: "Preview Import", es: "Vista previa de importacion" },
  "import.rowsFound": {
    en: "{count} row found",
    es: "{count} fila encontrada",
  },
  "import.rowsFoundPlural": {
    en: "{count} rows found",
    es: "{count} filas encontradas",
  },
  "import.showingFirst": {
    en: "Showing first {count} rows. Duplicate phone numbers will be automatically skipped.",
    es: "Mostrando las primeras {count} filas. Los numeros duplicados se omitiran automaticamente.",
  },
  "import.chooseDifferentFile": { en: "Choose Different File", es: "Elegir otro archivo" },
  "import.importing": { en: "Importing...", es: "Importando..." },
  "import.importRows": {
    en: "Import {count} Row",
    es: "Importar {count} fila",
  },
  "import.importRowsPlural": {
    en: "Import {count} Rows",
    es: "Importar {count} filas",
  },
  "import.complete": { en: "Import Complete", es: "Importacion completada" },
  "import.successfullyImported": { en: "Successfully imported", es: "Importados exitosamente" },
  "import.skippedDuplicates": { en: "Skipped (duplicates)", es: "Omitidos (duplicados)" },
  "import.errors": { en: "Errors", es: "Errores" },
  "import.rowsHadErrors": {
    en: "{count} row had errors",
    es: "{count} fila tuvo errores",
  },
  "import.rowsHadErrorsPlural": {
    en: "{count} rows had errors",
    es: "{count} filas tuvieron errores",
  },
  "import.row": { en: "Row {n}", es: "Fila {n}" },
  "import.importMoreData": { en: "Import More Data", es: "Importar mas datos" },
  "import.view": { en: "View {type}", es: "Ver {type}" },
  "import.errorCsvOnly": { en: "Please upload a CSV file", es: "Por favor sube un archivo CSV" },
  "import.errorTooLarge": { en: "File too large. Maximum 5MB.", es: "Archivo muy grande. Maximo 5MB." },
  "import.errorEmpty": { en: "CSV file appears to be empty", es: "El archivo CSV parece estar vacio" },
  "import.errorRateLimit": {
    en: "Too many imports. Please wait and try again later.",
    es: "Demasiadas importaciones. Espera e intenta de nuevo mas tarde.",
  },
  "import.errorFailed": { en: "Import failed. Please try again.", es: "Importacion fallida. Intenta de nuevo." },
  "import.successToast": {
    en: "Successfully imported {count} {type}",
    es: "Se importaron {count} {type} exitosamente",
  },

  // ── Business Insights ───────────────────────────────────────
  "insights.title": { en: "AI Insights", es: "Datos de IA" },
  "insights.spanishLeadsThisMonth": {
    en: "Spanish-speaking leads this month",
    es: "Clientes hispanohablantes este mes",
  },
  "insights.bilingualPercentage": {
    en: "{percentage}% of calls handled in Spanish — without bilingual AI, these leads would be lost",
    es: "{percentage}% de las llamadas atendidas en espanol — sin IA bilingue, estos clientes se perderian",
  },
  "insights.busiestTime": {
    en: "Your busiest time is {hour}. Consider staffing accordingly.",
    es: "Tu hora mas activa es {hour}. Considera ajustar tu personal.",
  },
  "insights.spanishCallers": {
    en: "{percentage}% of your callers speak Spanish. Your bilingual AI is capturing revenue competitors miss.",
    es: "{percentage}% de tus llamadas son en espanol. Tu IA bilingue esta capturando ingresos que tu competencia pierde.",
  },
  "insights.missedRecovered": {
    en: "{count} missed calls were recovered into appointments worth ~${amount}.",
    es: "{count} llamadas perdidas se recuperaron en citas por un valor de ~${amount}.",
  },
  "insights.topService": {
    en: "\"{service}\" is your most requested service at {percentage}% of bookings.",
    es: "\"{service}\" es tu servicio mas solicitado con {percentage}% de las reservas.",
  },
  "insights.avgDuration": {
    en: "Average call duration is {minutes}m {seconds}s — your AI handles calls efficiently.",
    es: "La duracion promedio de llamadas es {minutes}m {seconds}s — tu IA atiende llamadas eficientemente.",
  },
  "insights.readyAndLearning": {
    en: "Your AI receptionist is ready and learning. Insights will appear as more calls come in.",
    es: "Tu recepcionista de IA esta lista y aprendiendo. Los datos apareceran conforme recibas mas llamadas.",
  },

  // ── Dashboard UX — nav, action items, banners ─────────────────
  "calls.callBack": { en: "Call Back", es: "Devolver llamada" },
  "action.clearFilters": { en: "Clear Filters", es: "Limpiar filtros" },
  "dashboard.messagesAwaiting": {
    en: "Message(s) awaiting callback",
    es: "Mensaje(s) esperando respuesta",
  },
  "dashboard.firstCallTitle": {
    en: "{name} handled the first call!",
    es: "{name} atendio la primera llamada!",
  },
  "dashboard.firstCallDesc": {
    en: "{name} just handled the first call{caller}{duration}. This is just the beginning -- every call from here is revenue you're no longer missing.",
    es: "{name} acaba de atender la primera llamada{caller}{duration}. Esto es solo el comienzo -- cada llamada a partir de aqui es ingreso que ya no pierdes.",
  },
  "dashboard.callsSaved": {
    en: "{count} call(s) saved",
    es: "{count} llamada(s) recuperada(s)",
  },
  "billing.trialValue": {
    en: "Day {day} of 14 -- {name} has handled {calls} calls and booked {appointments} appointments",
    es: "Dia {day} de 14 -- {name} ha atendido {calls} llamadas y agendado {appointments} citas",
  },
  "billing.trialUrgent": {
    en: "{days} days left -- {name} handled {calls} calls this week",
    es: "{days} dias restantes -- {name} atendio {calls} llamadas esta semana",
  },

  // ── Setup Checklist (overview card) ─────────────────────────
  "checklist.title": { en: "Setup Checklist", es: "Lista de configuracion" },
  "checklist.progress": {
    en: "{completed} of {total} complete",
    es: "{completed} de {total} completados",
  },
  "checklist.dismiss": { en: "I'm all set", es: "Ya estoy listo" },
  "checklist.accountCreated": { en: "Account created", es: "Cuenta creada" },
  "checklist.setBusinessHours": { en: "Set business hours", es: "Configurar horario de negocio" },
  "checklist.customizeGreeting": { en: "Customize greeting", es: "Personalizar saludo" },
  "checklist.addServicePricing": { en: "Add service pricing", es: "Agregar precios de servicios" },
  "checklist.makeFirstCall": { en: "Make your first call", es: "Haz tu primera llamada" },
  "checklist.setupCallForwarding": { en: "Set up call forwarding", es: "Configurar desvio de llamadas" },

  // ── SMS compose ─────────────────────────────────────────────
  "sms.newMessage": { en: "New Message", es: "Nuevo mensaje" },
  "sms.composeSms": { en: "Compose SMS", es: "Redactar SMS" },
  "sms.phoneNumber": { en: "Phone Number", es: "Numero de telefono" },
  "sms.phonePlaceholder": { en: "+1 (555) 123-4567", es: "+1 (555) 123-4567" },
  "sms.message": { en: "Message", es: "Mensaje" },
  "sms.messagePlaceholder": {
    en: "Type your message...",
    es: "Escribe tu mensaje...",
  },
  "sms.charCount": { en: "{count}/1600", es: "{count}/1600" },
  "sms.sending": { en: "Sending...", es: "Enviando..." },
  "sms.send": { en: "Send SMS", es: "Enviar SMS" },
  "toast.smsSent": { en: "SMS sent successfully", es: "SMS enviado exitosamente" },
  "toast.failedToSendSms": { en: "Failed to send SMS", es: "No se pudo enviar el SMS" },
  "sms.optedOut": { en: "This customer has opted out of SMS", es: "Este cliente se dio de baja de SMS" },

  // ── Referrals empty state ───────────────────────────────────
  "referrals.codeBeingSetUp": {
    en: "Your referral link is being set up. Contact support if you need it sooner.",
    es: "Tu enlace de referido esta siendo configurado. Contacta a soporte si lo necesitas antes.",
  },

  // ── Estimates create ────────────────────────────────────────
  "estimates.createEstimate": { en: "Create Estimate", es: "Crear cotizacion" },
  "estimates.selectCustomer": { en: "Select a customer", es: "Selecciona un cliente" },
  "estimates.searchCustomers": { en: "Search customers...", es: "Buscar clientes..." },
  "estimates.noCustomersFound": { en: "No customers found", es: "No se encontraron clientes" },
  "estimates.serviceLabel": { en: "Service", es: "Servicio" },
  "estimates.servicePlaceholder": { en: "e.g. AC Repair, Plumbing", es: "ej. Reparacion de AC, Plomeria" },
  "estimates.descriptionLabel": { en: "Description", es: "Descripcion" },
  "estimates.descriptionPlaceholder": {
    en: "Describe the work needed...",
    es: "Describe el trabajo necesario...",
  },
  "estimates.amountLabel": { en: "Amount ($)", es: "Monto ($)" },
  "estimates.notesLabel": { en: "Notes", es: "Notas" },
  "estimates.notesPlaceholder": { en: "Internal notes...", es: "Notas internas..." },
  "estimates.creating": { en: "Creating...", es: "Creando..." },
  "toast.estimateCreated": { en: "Estimate created", es: "Cotizacion creada" },
  "toast.failedToCreateEstimate": { en: "Failed to create estimate", es: "No se pudo crear la cotizacion" },

  // ── Callbacks page ────────────────────────────────────────
  "callbacks.title": { en: "Callbacks", es: "Devoluciones de llamada" },
  "callbacks.description": {
    en: "{n} scheduled callbacks",
    es: "{n} devoluciones programadas",
  },
  "callbacks.allCaughtUp": {
    en: "No callbacks scheduled",
    es: "Sin devoluciones programadas",
  },
  "callbacks.scheduleCallback": {
    en: "Schedule Callback",
    es: "Programar devolucion",
  },
  "callbacks.tab.all": { en: "All", es: "Todas" },
  "callbacks.tab.pending": { en: "Pending", es: "Pendientes" },
  "callbacks.tab.completed": { en: "Completed", es: "Completadas" },
  "callbacks.tab.overdue": { en: "Overdue", es: "Vencidas" },
  "callbacks.col.customer": { en: "Customer", es: "Cliente" },
  "callbacks.col.scheduledTime": { en: "Scheduled Time", es: "Hora programada" },
  "callbacks.col.reason": { en: "Reason", es: "Motivo" },
  "callbacks.col.status": { en: "Status", es: "Estado" },
  "callbacks.col.actions": { en: "Actions", es: "Acciones" },
  "callbacks.complete": { en: "Complete", es: "Completar" },
  "callbacks.reschedule": { en: "Reschedule", es: "Reprogramar" },
  "callbacks.cancelCallback": { en: "Cancel", es: "Cancelar" },
  "callbacks.callBack": { en: "Call", es: "Llamar" },
  "callbacks.overdue": { en: "Overdue", es: "Vencida" },
  "callbacks.today": { en: "Today", es: "Hoy" },
  "callbacks.noReason": { en: "No reason provided", es: "Sin motivo indicado" },
  "callbacks.emptyTitle": {
    en: "No callbacks yet",
    es: "Sin devoluciones aun",
  },
  "callbacks.emptyFiltered": {
    en: "No callbacks match this filter",
    es: "No hay devoluciones para este filtro",
  },
  "callbacks.emptyDescription": {
    en: "Schedule a callback to follow up with a customer by phone.",
    es: "Programa una devolucion para darle seguimiento a un cliente por telefono.",
  },
  "callbacks.form.phone": { en: "Phone Number", es: "Numero de telefono" },
  "callbacks.form.phonePlaceholder": {
    en: "e.g. (555) 123-4567",
    es: "ej. (555) 123-4567",
  },
  "callbacks.form.customerName": { en: "Customer Name", es: "Nombre del cliente" },
  "callbacks.form.customerNamePlaceholder": {
    en: "Optional",
    es: "Opcional",
  },
  "callbacks.form.dateTime": { en: "Date & Time", es: "Fecha y hora" },
  "callbacks.form.reason": { en: "Reason", es: "Motivo" },
  "callbacks.form.reasonPlaceholder": {
    en: "Why are you calling back?",
    es: "Por que se devuelve la llamada?",
  },
  "callbacks.form.phoneRequired": {
    en: "Phone number is required",
    es: "El numero de telefono es obligatorio",
  },
  "callbacks.form.dateRequired": {
    en: "Date and time are required",
    es: "La fecha y hora son obligatorias",
  },
  "callbacks.scheduling": { en: "Scheduling...", es: "Programando..." },
  "callbacks.schedule": { en: "Schedule", es: "Programar" },
  "callbacks.created": { en: "Callback scheduled", es: "Devolucion programada" },
  "callbacks.createFailed": {
    en: "Failed to schedule callback",
    es: "No se pudo programar la devolucion",
  },
  "callbacks.completed": { en: "Callback completed", es: "Devolucion completada" },
  "callbacks.cancelled": { en: "Callback cancelled", es: "Devolucion cancelada" },
  "callbacks.updateFailed": {
    en: "Failed to update callback",
    es: "No se pudo actualizar la devolucion",
  },
  "callbacks.rescheduleTitle": { en: "Reschedule Callback", es: "Reprogramar devolucion" },
  "callbacks.rescheduling": { en: "Rescheduling...", es: "Reprogramando..." },
  "callbacks.rescheduled": { en: "Callback rescheduled", es: "Devolucion reprogramada" },
  "callbacks.rescheduleFailed": {
    en: "Failed to reschedule callback",
    es: "No se pudo reprogramar la devolucion",
  },
  "callbacks.stats.total": { en: "Total", es: "Total" },
  "callbacks.stats.scheduled": { en: "Scheduled", es: "Programadas" },
  "callbacks.stats.completed": { en: "Completed", es: "Completadas" },
  "callbacks.stats.failed": { en: "Failed", es: "Fallidas" },

  // ── Recurring Rules ──────────────────────────────────────────
  "recurring.title": { en: "Recurring Appointments", es: "Citas recurrentes" },
  "recurring.newRule": { en: "New Recurring Rule", es: "Nueva regla recurrente" },
  "recurring.editRule": { en: "Edit Rule", es: "Editar regla" },
  "recurring.customer": { en: "Customer", es: "Cliente" },
  "recurring.service": { en: "Service", es: "Servicio" },
  "recurring.frequency": { en: "Frequency", es: "Frecuencia" },
  "recurring.dayOfWeek": { en: "Day of Week", es: "Dia de la semana" },
  "recurring.dayOfMonth": { en: "Day of Month", es: "Dia del mes" },
  "recurring.preferredTime": { en: "Time", es: "Hora" },
  "recurring.nextOccurrence": { en: "Next Occurrence", es: "Proxima cita" },
  "recurring.status": { en: "Status", es: "Estado" },
  "recurring.notes": { en: "Notes", es: "Notas" },
  "recurring.notesPlaceholder": { en: "Optional notes about this recurring rule...", es: "Notas opcionales sobre esta regla recurrente..." },
  "recurring.active": { en: "Active", es: "Activa" },
  "recurring.paused": { en: "Paused", es: "Pausada" },
  "recurring.pause": { en: "Pause", es: "Pausar" },
  "recurring.resume": { en: "Resume", es: "Reanudar" },
  "recurring.deleteRule": { en: "Delete Rule", es: "Eliminar regla" },
  "recurring.confirmDelete": { en: "Delete this recurring rule?", es: "Eliminar esta regla recurrente?" },
  "recurring.confirmDeleteDescription": {
    en: "This will deactivate the rule. No further appointments will be auto-scheduled.",
    es: "Esto desactivara la regla. No se agendaran mas citas automaticamente.",
  },
  "recurring.confirmPause": { en: "Pause this rule?", es: "Pausar esta regla?" },
  "recurring.confirmPauseDescription": {
    en: "No appointments will be auto-scheduled while paused. You can resume anytime.",
    es: "No se agendaran citas mientras este pausada. Puedes reanudarla en cualquier momento.",
  },
  "recurring.failedToLoad": { en: "Failed to load recurring rules", es: "No se pudieron cargar las reglas recurrentes" },
  "recurring.failedToCreate": { en: "Failed to create recurring rule", es: "No se pudo crear la regla recurrente" },
  "recurring.failedToUpdate": { en: "Failed to update recurring rule", es: "No se pudo actualizar la regla recurrente" },
  "recurring.failedToDelete": { en: "Failed to delete recurring rule", es: "No se pudo eliminar la regla recurrente" },
  "recurring.created": { en: "Recurring rule created", es: "Regla recurrente creada" },
  "recurring.updated": { en: "Rule updated", es: "Regla actualizada" },
  "recurring.deleted": { en: "Rule deleted", es: "Regla eliminada" },
  "recurring.pausing": { en: "Pausing...", es: "Pausando..." },
  "recurring.resuming": { en: "Resuming...", es: "Reanudando..." },
  "recurring.creating": { en: "Creating...", es: "Creando..." },
  "recurring.showAll": { en: "Show All", es: "Mostrar todas" },
  "recurring.activeOnly": { en: "Active Only", es: "Solo activas" },
  "recurring.searchCustomer": { en: "Search customers...", es: "Buscar clientes..." },
  "recurring.selectCustomer": { en: "Select a customer", es: "Selecciona un cliente" },
  "recurring.noCustomersFound": { en: "No customers found", es: "No se encontraron clientes" },
  "recurring.servicePlaceholder": { en: "e.g. HVAC Maintenance", es: "ej. Mantenimiento HVAC" },
  "recurring.freq.daily": { en: "Daily", es: "Diario" },
  "recurring.freq.weekly": { en: "Weekly", es: "Semanal" },
  "recurring.freq.biweekly": { en: "Biweekly", es: "Quincenal" },
  "recurring.freq.monthly": { en: "Monthly", es: "Mensual" },
  "recurring.freq.quarterly": { en: "Quarterly", es: "Trimestral" },
  "recurring.freq.annually": { en: "Annually", es: "Anual" },
  "recurring.lastGenerated": { en: "Last Generated", es: "Ultima generada" },
  "recurring.never": { en: "Never", es: "Nunca" },
  "empty.noRecurring": {
    en: "No recurring appointments yet. Set up automatic scheduling for regular customers.",
    es: "Aun no hay citas recurrentes. Configura la programacion automatica para clientes regulares.",
  },

  // ── Complaints ─────────────────────────────────────────────
  "complaints.title": { en: "Complaints", es: "Quejas" },
  "complaints.all": { en: "All", es: "Todas" },
  "complaints.reportIssue": { en: "Report Issue", es: "Reportar problema" },
  "complaints.openCount": { en: "{n} open", es: "{n} abiertas" },
  "complaints.criticalCount": { en: "({n} high priority)", es: "({n} alta prioridad)" },
  "complaints.allResolved": { en: "All complaints resolved", es: "Todas las quejas resueltas" },
  "complaints.updated": { en: "Complaint updated", es: "Queja actualizada" },
  "complaints.updateFailed": { en: "Failed to update complaint", es: "No se pudo actualizar la queja" },
  "complaints.created": { en: "Complaint reported", es: "Queja reportada" },
  "complaints.createFailed": { en: "Failed to report complaint", es: "No se pudo reportar la queja" },
  "complaints.investigate": { en: "Investigate", es: "Investigar" },
  "complaints.resolve": { en: "Resolve", es: "Resolver" },
  "complaints.prev": { en: "Prev", es: "Ant" },
  "complaints.next": { en: "Next", es: "Sig" },
  "complaints.emptyAll": { en: "No complaints yet", es: "Sin quejas aun" },
  "complaints.emptyFiltered": { en: "No complaints match this filter", es: "No hay quejas con este filtro" },
  "complaints.emptyDescription": {
    en: "When issues are reported, they will appear here for tracking and resolution.",
    es: "Cuando se reporten problemas, apareceran aqui para seguimiento y resolucion.",
  },
  "complaints.detailTitle": { en: "Complaint Details", es: "Detalle de queja" },
  "complaints.customerLabel": { en: "Customer:", es: "Cliente:" },
  "complaints.createdLabel": { en: "Created:", es: "Creada:" },
  "complaints.resolvedLabel": { en: "Resolved:", es: "Resuelta:" },
  "complaints.status.open": { en: "Open", es: "Abierta" },
  "complaints.status.investigating": { en: "In Progress", es: "En progreso" },
  "complaints.status.resolved": { en: "Resolved", es: "Resuelta" },
  "complaints.status.closed": { en: "Closed", es: "Cerrada" },
  "complaints.severity.low": { en: "Low", es: "Baja" },
  "complaints.severity.medium": { en: "Medium", es: "Media" },
  "complaints.severity.high": { en: "High", es: "Alta" },
  "complaints.severity.critical": { en: "Critical", es: "Critica" },
  "complaints.category.service_quality": { en: "Service Quality", es: "Calidad de servicio" },
  "complaints.category.billing": { en: "Billing", es: "Facturacion" },
  "complaints.category.scheduling": { en: "Scheduling", es: "Agenda" },
  "complaints.category.communication": { en: "Communication", es: "Comunicacion" },
  "complaints.category.other": { en: "Other", es: "Otro" },
  "complaints.col.severity": { en: "Severity", es: "Severidad" },
  "complaints.col.customer": { en: "Customer", es: "Cliente" },
  "complaints.col.date": { en: "Date", es: "Fecha" },
  "complaints.col.category": { en: "Category", es: "Categoria" },
  "complaints.col.description": { en: "Description", es: "Descripcion" },
  "complaints.col.status": { en: "Status", es: "Estado" },
  "complaints.col.resolution": { en: "Resolution", es: "Resolucion" },
  "complaints.form.customerPhone": { en: "Customer Phone", es: "Telefono del cliente" },
  "complaints.form.phonePlaceholder": { en: "e.g. (555) 123-4567", es: "ej. (555) 123-4567" },
  "complaints.form.category": { en: "Category", es: "Categoria" },
  "complaints.form.severity": { en: "Priority", es: "Prioridad" },
  "complaints.form.description": { en: "Description", es: "Descripcion" },
  "complaints.form.descriptionPlaceholder": {
    en: "Describe the issue in detail...",
    es: "Describe el problema en detalle...",
  },
  "complaints.form.descriptionRequired": { en: "Description is required", es: "La descripcion es obligatoria" },
  "complaints.form.status": { en: "Status", es: "Estado" },
  "complaints.form.resolution": { en: "Resolution Notes", es: "Notas de resolucion" },
  "complaints.form.resolutionPlaceholder": {
    en: "Describe how this was resolved...",
    es: "Describe como se resolvio...",
  },
  "complaints.form.resolutionRequired": {
    en: "Resolution notes are required when resolving or closing",
    es: "Las notas de resolucion son obligatorias al resolver o cerrar",
  },

  // ── SMS Templates ─────────────────────────────────────────
  "smsTemplates.title": { en: "SMS Templates", es: "Plantillas de SMS" },
  "smsTemplates.description": {
    en: "Create and manage message templates for appointments, reminders, and follow-ups.",
    es: "Crea y administra plantillas de mensajes para citas, recordatorios y seguimientos.",
  },
  "smsTemplates.newTemplate": { en: "New Template", es: "Nueva plantilla" },
  "smsTemplates.editTemplate": { en: "Edit Template", es: "Editar plantilla" },
  "smsTemplates.nameLabel": { en: "Template Name", es: "Nombre de la plantilla" },
  "smsTemplates.namePlaceholder": { en: "e.g. Appointment Reminder", es: "ej. Recordatorio de cita" },
  "smsTemplates.categoryLabel": { en: "Category", es: "Categoria" },
  "smsTemplates.messageEn": { en: "Message (English)", es: "Mensaje (Ingles)" },
  "smsTemplates.messageEs": { en: "Message (Spanish)", es: "Mensaje (Espanol)" },
  "smsTemplates.messagePlaceholder": {
    en: "Hi {customer_name}, your {service} with {business_name} is...",
    es: "Hola {customer_name}, su {service} con {business_name} es...",
  },
  "smsTemplates.messagePlaceholderEs": {
    en: "Write the Spanish version of your template...",
    es: "Escribe la version en espanol de tu plantilla...",
  },
  "smsTemplates.variableHint": {
    en: "Click a variable to insert it at cursor position:",
    es: "Haz clic en una variable para insertarla en la posicion del cursor:",
  },
  "smsTemplates.clickToInsert": { en: "Click to insert", es: "Clic para insertar" },
  "smsTemplates.segments": { en: "{count} SMS segment(s)", es: "{count} segmento(s) SMS" },
  "smsTemplates.segmentLabel": { en: "segment(s)", es: "segmento(s)" },
  "smsTemplates.chars": { en: "chars", es: "car." },
  "smsTemplates.default": { en: "Default", es: "Predeterminada" },
  "smsTemplates.saving": { en: "Saving...", es: "Guardando..." },
  "smsTemplates.saveChanges": { en: "Save Changes", es: "Guardar cambios" },
  "smsTemplates.create": { en: "Create Template", es: "Crear plantilla" },
  "smsTemplates.created": { en: "Template created", es: "Plantilla creada" },
  "smsTemplates.updated": { en: "Template updated", es: "Plantilla actualizada" },
  "smsTemplates.deleted": { en: "Template deleted", es: "Plantilla eliminada" },
  "smsTemplates.saveFailed": { en: "Failed to save template", es: "No se pudo guardar la plantilla" },
  "smsTemplates.deleteFailed": { en: "Failed to delete template", es: "No se pudo eliminar la plantilla" },
  "smsTemplates.failedToLoad": { en: "Failed to load templates", es: "No se pudieron cargar las plantillas" },
  "smsTemplates.deleteTitle": { en: "Delete Template", es: "Eliminar plantilla" },
  "smsTemplates.deleteDescription": {
    en: "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
    es: "Estas seguro de que quieres eliminar \"{name}\"? Esta accion no se puede deshacer.",
  },
  "smsTemplates.deleting": { en: "Deleting...", es: "Eliminando..." },
  "smsTemplates.emptyTitle": { en: "No templates yet", es: "Aun no hay plantillas" },
  "smsTemplates.emptyDescription": {
    en: "Create SMS templates for appointment confirmations, reminders, follow-ups, and more. Templates save time and keep your messaging consistent.",
    es: "Crea plantillas de SMS para confirmaciones de citas, recordatorios, seguimientos y mas. Las plantillas ahorran tiempo y mantienen tu comunicacion consistente.",
  },
  "smsTemplates.createFirst": { en: "Create Your First Template", es: "Crea tu primera plantilla" },
  "smsTemplates.suggestions": { en: "Suggested templates to create:", es: "Plantillas sugeridas para crear:" },
  "smsTemplates.suggestReminder": { en: "Appointment Reminder", es: "Recordatorio de cita" },
  "smsTemplates.suggestFollowUp": { en: "Follow-Up Message", es: "Mensaje de seguimiento" },
  "smsTemplates.suggestThankYou": { en: "Thank You Note", es: "Nota de agradecimiento" },
  "smsTemplates.cat.confirmation": { en: "Confirmation", es: "Confirmacion" },
  "smsTemplates.cat.reminder": { en: "Reminder", es: "Recordatorio" },
  "smsTemplates.cat.follow_up": { en: "Follow-up", es: "Seguimiento" },
  "smsTemplates.cat.marketing": { en: "Marketing", es: "Marketing" },
  "smsTemplates.cat.custom": { en: "Custom", es: "Personalizada" },
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
