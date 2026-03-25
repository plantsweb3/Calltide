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
  "settings.tab.general": { en: "General", es: "General" },
  "settings.tab.receptionist": { en: "Receptionist", es: "Recepcionista" },
  "settings.tab.responses": { en: "Responses", es: "Respuestas" },
  "settings.tab.notifications": { en: "Notifications", es: "Notificaciones" },
  "settings.tab.pricing": { en: "Pricing", es: "Precios" },
  "settings.tab.automations": { en: "Automations", es: "Automatizaciones" },
  "settings.tab.integrations": { en: "Integrations", es: "Integraciones" },
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
  "followUps.markDone": { en: "Mark Done", es: "Marcar hecho" },
  "followUps.skip": { en: "Skip", es: "Omitir" },
  "followUps.callBack": { en: "Call Back", es: "Devolver llamada" },

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
