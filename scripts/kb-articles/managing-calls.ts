import type { ArticleData } from "./types";

export const articles: ArticleData[] = [
  // ── 1. Understanding Your Call Logs ──────────────────────────────────
  {
    slug: "understanding-call-logs",
    title: "Understanding Your Call Logs",
    titleEs: "Entender Tu Registro de Llamadas",
    excerpt:
      "Learn how to read your call list, what each status means, and how to find details like duration, sentiment, and transcripts.",
    excerptEs:
      "Aprende a leer tu lista de llamadas, qué significa cada estado y cómo encontrar detalles como duración, sentimiento y transcripciones.",
    content: `# Understanding Your Call Logs

Every call that comes into your business through Maria is recorded in your call log. You can view it anytime from your dashboard at **Dashboard > Calls**.

## Finding Your Call List

When you log in to your dashboard, click **Calls** in the left menu. You will see a list of every call, starting with the most recent. Each row shows:

- **Date and time** the call came in
- **Caller's phone number** (or name, if they are a known contact)
- **Call status** — tells you what happened with the call
- **Duration** — how long the call lasted
- **Sentiment** — whether the caller sounded positive, neutral, or frustrated

## What Each Call Status Means

You will see one of these statuses next to each call:

- **Completed** — Maria answered the call and the conversation finished normally. This is the most common status. It means the caller got help, booked an appointment, or got their question answered.
- **Missed** — The call came in, but it was not answered. This can happen if there is a phone system issue. Missed calls are rare, but you should follow up with these callers.
- **Failed** — Something went wrong during the call. This could be a bad connection on the caller's end or a technical problem. If you see several failed calls, contact our support team.
- **Transferred** — Maria sent the call to your personal phone. This happens when a caller asks for the owner or has an urgent issue that needs a real person.

## Call Duration

Duration is shown in minutes and seconds. A typical call lasts between 1 and 4 minutes. If you see very short calls (under 15 seconds), the caller may have hung up quickly. Very long calls (over 10 minutes) could mean the caller had a complex question.

## Sentiment Scores

Maria uses AI to detect the caller's mood during the conversation. You will see one of three labels:

- **Positive** — The caller sounded happy or satisfied.
- **Neutral** — The caller was calm and matter-of-fact.
- **Negative** — The caller sounded frustrated or upset.

Sentiment helps you spot unhappy callers so you can follow up with them right away.

## Reading Transcripts

Click on any call to open its detail page. There you will find the full transcript of the conversation. You can read exactly what the caller said and how Maria responded. This is useful for checking that Maria gave the right information.

## Tips for Using Your Call Log

1. **Check your log daily.** A quick look each morning helps you catch missed calls or unhappy callers.
2. **Filter by status.** Use the filter options at the top to show only missed or failed calls so you can follow up fast.
3. **Look at trends.** If you notice more calls on certain days or times, you can plan your schedule around that.

Your call log is your window into every customer interaction. Use it to stay on top of your business and make sure every caller gets great service.`,
    contentEs: `# Entender Tu Registro de Llamadas

Cada llamada que entra a tu negocio a través de Maria se guarda en tu registro de llamadas. Puedes verlo cuando quieras desde tu panel en **Panel > Llamadas**.

## Encontrar Tu Lista de Llamadas

Cuando entras a tu panel, haz clic en **Llamadas** en el menú de la izquierda. Verás una lista de cada llamada, empezando por la más reciente. Cada fila muestra:

- **Fecha y hora** en que entró la llamada
- **Número de teléfono** del que llamó (o su nombre, si es un contacto conocido)
- **Estado de la llamada** — te dice qué pasó con la llamada
- **Duración** — cuánto tiempo duró la llamada
- **Sentimiento** — si la persona que llamó sonaba positiva, neutral o frustrada

## Qué Significa Cada Estado

Verás uno de estos estados junto a cada llamada:

- **Completada** — Maria contestó la llamada y la conversación terminó normalmente. Este es el estado más común. Significa que la persona recibió ayuda, agendó una cita o le contestaron su pregunta.
- **Perdida** — La llamada entró pero no fue contestada. Esto puede pasar si hay un problema con el sistema telefónico. Las llamadas perdidas son raras, pero debes dar seguimiento a esas personas.
- **Fallida** — Algo salió mal durante la llamada. Puede ser mala conexión del lado de quien llamó o un problema técnico. Si ves varias llamadas fallidas, contacta a nuestro equipo de soporte.
- **Transferida** — Maria envió la llamada a tu teléfono personal. Esto pasa cuando alguien pide hablar con el dueño o tiene un problema urgente que necesita una persona real.

## Duración de la Llamada

La duración se muestra en minutos y segundos. Una llamada típica dura entre 1 y 4 minutos. Si ves llamadas muy cortas (menos de 15 segundos), la persona probablemente colgó rápido. Llamadas muy largas (más de 10 minutos) pueden significar que tenían una pregunta complicada.

## Puntuación de Sentimiento

Maria usa inteligencia artificial para detectar el ánimo de la persona durante la conversación. Verás una de tres etiquetas:

- **Positivo** — La persona sonaba contenta o satisfecha.
- **Neutral** — La persona estaba tranquila y directa.
- **Negativo** — La persona sonaba frustrada o molesta.

El sentimiento te ayuda a encontrar personas insatisfechas para que puedas darles seguimiento de inmediato.

## Leer Transcripciones

Haz clic en cualquier llamada para abrir su página de detalle. Ahí encontrarás la transcripción completa de la conversación. Puedes leer exactamente lo que dijo la persona y cómo respondió Maria. Esto es útil para verificar que Maria dio la información correcta.

## Consejos para Usar Tu Registro de Llamadas

1. **Revisa tu registro todos los días.** Un vistazo rápido cada mañana te ayuda a ver llamadas perdidas o personas insatisfechas.
2. **Filtra por estado.** Usa las opciones de filtro en la parte superior para mostrar solo llamadas perdidas o fallidas y dar seguimiento rápido.
3. **Observa las tendencias.** Si notas más llamadas en ciertos días u horas, puedes planear tu horario alrededor de eso.

Tu registro de llamadas es tu ventana a cada interacción con clientes. Úsalo para estar al tanto de tu negocio y asegurarte de que cada persona reciba un gran servicio.`,
    metaTitle: "Understanding Your Call Logs | Capta Help",
    metaTitleEs: "Entender Tu Registro de Llamadas | Ayuda Capta",
    metaDescription:
      "Learn how to read your Capta call logs, what each call status means, and how to use duration and sentiment data to manage your business.",
    metaDescriptionEs:
      "Aprende a leer tu registro de llamadas de Capta, qué significa cada estado y cómo usar los datos de duración y sentimiento.",
    searchKeywords:
      "call logs, call history, call status, completed, missed, failed, transferred, duration, sentiment, call list, dashboard calls",
    searchKeywordsEs:
      "registro de llamadas, historial de llamadas, estado de llamada, completada, perdida, fallida, transferida, duración, sentimiento, lista de llamadas",
    categorySlug: "managing-calls",
    dashboardContextRoutes: ["/dashboard/calls"],
    sortOrder: 1,
    readingTimeMinutes: 3,
  },

  // ── 2. When Calls Get Transferred to You ─────────────────────────────
  {
    slug: "when-calls-transfer",
    title: "When Calls Get Transferred to You",
    titleEs: "Cuándo las Llamadas Se Transfieren a Ti",
    excerpt:
      "Learn what triggers a call transfer, what the caller hears, and how to prepare for transferred calls versus voicemails.",
    excerptEs:
      "Aprende qué activa una transferencia de llamada, qué escucha la persona y cómo prepararte para llamadas transferidas versus buzón de voz.",
    content: `# When Calls Get Transferred to You

Maria handles most calls on her own, but sometimes a caller needs to speak with you directly. When that happens, Maria transfers the call to your phone. Here is how the process works and how to be ready for it.

## What Triggers a Transfer

Maria will transfer a call to you in these situations:

- **The caller asks for the owner or manager.** If someone says "I need to talk to the boss" or "Can I speak to a real person," Maria will try to connect them to you.
- **Urgent problems.** If a caller reports a gas leak, flooding, or another emergency, Maria knows to get you on the line right away.
- **Complex requests.** When a caller has a question Maria cannot answer — like a custom quote for a big job — she will transfer so you can handle it personally.
- **Repeat callers with issues.** If someone calls back about an unresolved problem, Maria may transfer them to you for a better experience.

You can also set custom transfer rules in your settings. For example, you can tell Maria to always transfer calls from certain phone numbers or about certain topics.

## What the Caller Hears

When Maria decides to transfer, she tells the caller something like: "Let me connect you with the owner right now. Please hold for just a moment." The caller then hears a brief hold tone while Maria dials your phone.

If you answer, the call connects right away. The caller will not hear any awkward silence — the handoff is smooth.

## What Happens If You Don't Answer

If you do not pick up within 20 seconds, the call goes to voicemail. Maria tells the caller: "I wasn't able to reach them right now. Let me take a message for you." She then collects the caller's name, number, and reason for calling. You will see this in your dashboard as a voicemail entry with a transcript.

## How to Prepare for Transfers

1. **Keep your phone nearby.** Transferred calls come from your Capta number, so save it in your contacts so you recognize it.
2. **Answer quickly.** The faster you pick up, the better the experience for the caller. They are already waiting.
3. **Check the notification.** When a transfer starts, you may get a quick text or push notification with the caller's name and reason. Glance at it before you answer so you have context.
4. **Be professional.** The caller already spoke with Maria, so you can start with "Hi, Maria told me you need help with…" to show you are on the same page.

## Transfer vs. Voicemail

Think of it this way:

- **Transfer** = the caller gets you live, right now. Best for urgent issues and high-value leads.
- **Voicemail** = the caller leaves a message, and you call back later. Fine for non-urgent requests.

You can see both transfers and voicemails in your **Calls** page. Transfers are marked with a "Transferred" status and voicemails are marked with "Voicemail."

## Adjusting Transfer Settings

Go to **Dashboard > Settings** to change when Maria transfers calls. You can set quiet hours so transfers only happen during your work hours. Outside those hours, all calls go to voicemail automatically.

Transfers are a powerful feature. They let Maria handle the routine calls while making sure you are there for the moments that really matter.`,
    contentEs: `# Cuándo las Llamadas Se Transfieren a Ti

Maria maneja la mayoría de las llamadas por su cuenta, pero a veces la persona necesita hablar contigo directamente. Cuando eso pasa, Maria transfiere la llamada a tu teléfono. Aquí te explicamos cómo funciona el proceso y cómo prepararte.

## Qué Activa una Transferencia

Maria transferirá una llamada en estas situaciones:

- **La persona pide hablar con el dueño o gerente.** Si alguien dice "Necesito hablar con el jefe" o "¿Puedo hablar con una persona real?", Maria intentará conectarlos contigo.
- **Problemas urgentes.** Si alguien reporta una fuga de gas, inundación u otra emergencia, Maria sabe que debe ponerte en la línea de inmediato.
- **Solicitudes complejas.** Cuando alguien tiene una pregunta que Maria no puede contestar — como una cotización especial para un trabajo grande — ella transferirá para que tú lo manejes personalmente.
- **Personas que llaman de nuevo con problemas.** Si alguien llama otra vez por un problema sin resolver, Maria puede transferirlos para una mejor experiencia.

También puedes configurar reglas de transferencia personalizadas en tus ajustes. Por ejemplo, puedes decirle a Maria que siempre transfiera llamadas de ciertos números o sobre ciertos temas.

## Qué Escucha la Persona

Cuando Maria decide transferir, le dice algo como: "Permítame conectarlo con el dueño ahora mismo. Por favor espere un momento." La persona luego escucha un breve tono de espera mientras Maria marca tu teléfono.

Si contestas, la llamada se conecta de inmediato. La persona no escuchará ningún silencio incómodo — la transición es fluida.

## Qué Pasa Si No Contestas

Si no contestas en 20 segundos, la llamada va al buzón de voz. Maria le dice a la persona: "No pude comunicarme con ellos en este momento. Permítame tomar un mensaje." Luego recoge el nombre, número y razón de la llamada. Verás esto en tu panel como una entrada de buzón de voz con transcripción.

## Cómo Prepararte para Transferencias

1. **Ten tu teléfono cerca.** Las llamadas transferidas vienen de tu número de Capta, así que guárdalo en tus contactos para que lo reconozcas.
2. **Contesta rápido.** Entre más rápido contestes, mejor será la experiencia para la persona. Ya están esperando.
3. **Revisa la notificación.** Cuando empieza una transferencia, puedes recibir un texto rápido o notificación con el nombre y razón de la persona. Míralo antes de contestar para tener contexto.
4. **Sé profesional.** La persona ya habló con Maria, así que puedes empezar con "Hola, Maria me dijo que necesita ayuda con…" para mostrar que estás al tanto.

## Transferencia vs. Buzón de Voz

Piénsalo así:

- **Transferencia** = la persona te habla en vivo, ahora mismo. Mejor para problemas urgentes y clientes potenciales valiosos.
- **Buzón de voz** = la persona deja un mensaje y tú llamas después. Bien para solicitudes que no son urgentes.

Puedes ver tanto transferencias como buzones de voz en tu página de **Llamadas**. Las transferencias están marcadas con estado "Transferida" y los buzones de voz con "Buzón de voz."

## Ajustar Configuración de Transferencias

Ve a **Panel > Ajustes** para cambiar cuándo Maria transfiere llamadas. Puedes configurar horas tranquilas para que las transferencias solo pasen durante tu horario de trabajo. Fuera de esas horas, todas las llamadas van al buzón de voz automáticamente.

Las transferencias son una función poderosa. Dejan que Maria maneje las llamadas rutinarias mientras se asegura de que estés presente para los momentos que realmente importan.`,
    metaTitle: "When Calls Get Transferred to You | Capta",
    metaTitleEs: "Cuándo las Llamadas Se Transfieren | Capta",
    metaDescription:
      "Understand what triggers Maria to transfer a call to your phone, what callers hear during the handoff, and how to handle transfers and voicemails.",
    metaDescriptionEs:
      "Entiende qué hace que Maria transfiera una llamada a tu teléfono, qué escuchan las personas y cómo manejar transferencias y buzón de voz.",
    searchKeywords:
      "call transfer, transferred calls, voicemail, live transfer, urgent calls, transfer settings, call forwarding, owner transfer, pickup",
    searchKeywordsEs:
      "transferencia de llamada, llamadas transferidas, buzón de voz, transferencia en vivo, llamadas urgentes, ajustes de transferencia, reenvío de llamada",
    categorySlug: "managing-calls",
    dashboardContextRoutes: ["/dashboard/calls"],
    sortOrder: 2,
    readingTimeMinutes: 3,
  },

  // ── 3. How Appointments Are Booked and Tracked ───────────────────────
  {
    slug: "appointments-booked-tracked",
    title: "How Appointments Are Booked and Tracked",
    titleEs: "Cómo Se Reservan y Rastrean las Citas",
    excerpt:
      "See how Maria books appointments for your callers, how SMS confirmations work, and how to manage cancellations and no-shows.",
    excerptEs:
      "Mira cómo Maria reserva citas para tus clientes, cómo funcionan las confirmaciones por SMS y cómo manejar cancelaciones y ausencias.",
    content: `# How Appointments Are Booked and Tracked

One of the biggest benefits of Maria is that she books appointments for you while you are out in the field. Here is how the whole process works from start to finish.

## How Maria Books an Appointment

When a caller needs service, Maria walks them through a simple booking flow:

1. **She asks what they need.** Maria finds out the type of service — for example, "AC repair" or "leaky faucet."
2. **She collects their information.** Maria gets the caller's name, phone number, and address.
3. **She offers available times.** Based on your schedule settings, Maria suggests open time slots.
4. **She confirms the booking.** Once the caller picks a time, Maria repeats the details back to make sure everything is correct.

The whole process takes about 60 to 90 seconds. The caller never has to wait on hold or call back later.

## SMS Confirmations

Right after an appointment is booked, the caller gets a text message confirming the details. The text includes:

- The date and time of the appointment
- Your business name
- A short note about the service requested

You also get a text or notification letting you know a new appointment was booked. This way you always know what is on your schedule even if you are on a job site.

The day before the appointment, the caller gets an automatic reminder text. This helps reduce no-shows because the customer is reminded to be ready.

## Viewing Your Appointments

Log in to your dashboard and click **Appointments** in the left menu. You will see a list of all upcoming appointments with:

- Customer name and phone number
- Service type
- Date and time
- Current status (confirmed, pending, cancelled, completed)

You can click on any appointment to see the full details, including notes from the original call.

## Cancellations

If a customer calls back to cancel, Maria handles it. She removes the appointment from your schedule and sends the customer a confirmation text that it has been cancelled. You will see the status change to "Cancelled" in your dashboard.

You can also cancel an appointment yourself from the dashboard. Just click the appointment and select **Cancel**. The customer will get a text letting them know.

## Handling No-Shows

If a customer does not show up for their appointment, you can mark it as a "No-Show" in your dashboard. This helps you track which customers are unreliable. Over time, you can see patterns — some customers may need an extra reminder call.

## Tips for Getting the Most from Appointment Booking

- **Keep your availability up to date.** Go to **Settings** and make sure your available hours and days are correct. Maria can only book times you have marked as open.
- **Set buffer time between appointments.** Give yourself travel time between jobs. You can set a buffer of 30, 60, or 90 minutes in your settings.
- **Review your appointments each evening.** Take two minutes to look at tomorrow's schedule so there are no surprises.

Maria's appointment booking saves you time and makes sure you never miss a lead. While you are fixing an AC unit or unclogging a drain, Maria is filling your schedule with the next job.`,
    contentEs: `# Cómo Se Reservan y Rastrean las Citas

Uno de los mayores beneficios de Maria es que reserva citas por ti mientras estás en el campo. Aquí te explicamos cómo funciona todo el proceso de principio a fin.

## Cómo Maria Reserva una Cita

Cuando alguien llama y necesita servicio, Maria los guía por un proceso sencillo de reserva:

1. **Pregunta qué necesitan.** Maria averigua el tipo de servicio — por ejemplo, "reparación de aire acondicionado" o "fuga de agua."
2. **Recoge su información.** Maria obtiene el nombre, número de teléfono y dirección de la persona.
3. **Ofrece horarios disponibles.** Basándose en tu configuración de horario, Maria sugiere espacios de tiempo abiertos.
4. **Confirma la reserva.** Una vez que la persona escoge un horario, Maria repite los detalles para asegurarse de que todo esté correcto.

Todo el proceso toma unos 60 a 90 segundos. La persona nunca tiene que esperar en línea ni llamar de nuevo después.

## Confirmaciones por SMS

Justo después de reservar una cita, la persona recibe un mensaje de texto confirmando los detalles. El texto incluye:

- La fecha y hora de la cita
- El nombre de tu negocio
- Una nota corta sobre el servicio solicitado

Tú también recibes un texto o notificación avisándote que se reservó una nueva cita. Así siempre sabes qué hay en tu agenda aunque estés en un sitio de trabajo.

El día antes de la cita, la persona recibe un texto de recordatorio automático. Esto ayuda a reducir las ausencias porque el cliente recuerda estar listo.

## Ver Tus Citas

Entra a tu panel y haz clic en **Citas** en el menú de la izquierda. Verás una lista de todas las citas próximas con:

- Nombre y número de teléfono del cliente
- Tipo de servicio
- Fecha y hora
- Estado actual (confirmada, pendiente, cancelada, completada)

Puedes hacer clic en cualquier cita para ver todos los detalles, incluyendo notas de la llamada original.

## Cancelaciones

Si un cliente llama para cancelar, Maria lo maneja. Ella elimina la cita de tu agenda y envía al cliente un texto de confirmación de que fue cancelada. Verás el estado cambiar a "Cancelada" en tu panel.

Tú también puedes cancelar una cita desde el panel. Solo haz clic en la cita y selecciona **Cancelar**. El cliente recibirá un texto avisándole.

## Manejar Ausencias

Si un cliente no se presenta a su cita, puedes marcarla como "Ausencia" en tu panel. Esto te ayuda a rastrear qué clientes no son confiables. Con el tiempo, puedes ver patrones — algunos clientes pueden necesitar una llamada de recordatorio extra.

## Consejos para Aprovechar al Máximo la Reserva de Citas

- **Mantén tu disponibilidad actualizada.** Ve a **Ajustes** y asegúrate de que tus horas y días disponibles estén correctos. Maria solo puede reservar horarios que hayas marcado como abiertos.
- **Pon tiempo entre citas.** Date tiempo de traslado entre trabajos. Puedes poner un espacio de 30, 60 o 90 minutos en tus ajustes.
- **Revisa tus citas cada noche.** Toma dos minutos para ver el horario de mañana y que no haya sorpresas.

La reserva de citas de Maria te ahorra tiempo y se asegura de que nunca pierdas un cliente potencial. Mientras tú reparas un aire acondicionado o destapas un drenaje, Maria está llenando tu agenda con el siguiente trabajo.`,
    metaTitle: "How Appointments Are Booked and Tracked | Capta",
    metaTitleEs: "Cómo Se Reservan y Rastrean las Citas | Capta",
    metaDescription:
      "Learn how Maria books appointments for your callers, how SMS confirmations and reminders work, and how to manage cancellations and no-shows.",
    metaDescriptionEs:
      "Aprende cómo Maria reserva citas para tus clientes, cómo funcionan las confirmaciones por SMS y cómo manejar cancelaciones y ausencias.",
    searchKeywords:
      "appointments, booking, schedule, SMS confirmation, reminder, cancellation, no-show, availability, appointment tracking, calendar",
    searchKeywordsEs:
      "citas, reserva, agenda, confirmación SMS, recordatorio, cancelación, ausencia, disponibilidad, rastreo de citas, calendario",
    categorySlug: "managing-calls",
    dashboardContextRoutes: ["/dashboard/appointments"],
    sortOrder: 3,
    readingTimeMinutes: 3,
  },

  // ── 4. Viewing Your SMS Messages ─────────────────────────────────────
  {
    slug: "viewing-messages",
    title: "Viewing Your SMS Messages",
    titleEs: "Ver Tus Mensajes SMS",
    excerpt:
      "Learn how to view your SMS log, understand inbound vs outbound messages, and see the different template types Maria sends.",
    excerptEs:
      "Aprende a ver tu registro de SMS, entender mensajes entrantes vs salientes y los diferentes tipos de plantillas que envía Maria.",
    content: `# Viewing Your SMS Messages

Maria does not just answer calls — she also sends and receives text messages on behalf of your business. Your SMS log keeps a record of every text so you always know what was communicated to your customers.

## Where to Find Your SMS Log

Log in to your dashboard and click **SMS** in the left menu. You will see a complete list of all text messages, sorted by the most recent. Each entry shows:

- **Date and time** the message was sent or received
- **Phone number** of the customer
- **Direction** — whether it was inbound (from the customer) or outbound (from Maria)
- **Message preview** — the first few words of the text

Click on any message to see the full text and the conversation thread with that customer.

## Inbound vs. Outbound Messages

Understanding the difference between these two types helps you see the full picture:

- **Inbound messages** are texts that customers send to your Capta business number. For example, a customer might text "What time is my appointment?" or "I need to reschedule."
- **Outbound messages** are texts that Maria sends to customers. These include appointment confirmations, reminders, and follow-up messages.

Your SMS log shows both types so you can see the entire conversation in one place.

## Types of Outbound Messages

Maria sends several kinds of automated texts. Here are the most common:

- **Appointment confirmation** — Sent right after a call where an appointment was booked. Includes the date, time, and service type.
- **Appointment reminder** — Sent the day before the appointment as a friendly nudge. Helps reduce no-shows.
- **Follow-up message** — Sent after a completed appointment to ask how the service went. This can help you get reviews and repeat business.
- **Missed call text** — If a call is missed for any reason, Maria sends a text to the caller saying, "Sorry we missed you. How can we help?" This turns a missed call into a text conversation.

## Message History by Customer

You can also view all messages for a specific customer. Click on any message in the log and you will see the full thread — every text sent back and forth with that person. This is helpful when you need context before calling someone back.

## Searching and Filtering

At the top of the SMS page, you can:

- **Search by phone number** to quickly find messages from a specific customer
- **Filter by direction** to see only inbound or only outbound messages
- **Filter by date** to look at messages from a specific time period

## Tips for Managing Your SMS

1. **Check your inbound messages daily.** Customers sometimes text instead of calling. If Maria cannot handle the request by text, you may need to follow up.
2. **Look at missed call texts.** These are golden opportunities. Someone tried to reach you and Maria texted them — now you can close the deal.
3. **Use message history before callbacks.** Before you call a customer back, glance at their SMS thread so you know what has already been discussed.

Your SMS log works hand-in-hand with your call log. Together they give you a complete picture of every customer interaction with your business.`,
    contentEs: `# Ver Tus Mensajes SMS

Maria no solo contesta llamadas — también envía y recibe mensajes de texto en nombre de tu negocio. Tu registro de SMS guarda un historial de cada texto para que siempre sepas lo que se comunicó a tus clientes.

## Dónde Encontrar Tu Registro de SMS

Entra a tu panel y haz clic en **SMS** en el menú de la izquierda. Verás una lista completa de todos los mensajes de texto, ordenados por los más recientes. Cada entrada muestra:

- **Fecha y hora** en que se envió o recibió el mensaje
- **Número de teléfono** del cliente
- **Dirección** — si fue entrante (del cliente) o saliente (de Maria)
- **Vista previa del mensaje** — las primeras palabras del texto

Haz clic en cualquier mensaje para ver el texto completo y el hilo de conversación con ese cliente.

## Mensajes Entrantes vs. Salientes

Entender la diferencia entre estos dos tipos te ayuda a ver todo el panorama:

- **Mensajes entrantes** son textos que los clientes envían a tu número de negocio de Capta. Por ejemplo, un cliente podría escribir "¿A qué hora es mi cita?" o "Necesito reprogramar."
- **Mensajes salientes** son textos que Maria envía a los clientes. Estos incluyen confirmaciones de citas, recordatorios y mensajes de seguimiento.

Tu registro de SMS muestra ambos tipos para que puedas ver toda la conversación en un solo lugar.

## Tipos de Mensajes Salientes

Maria envía varios tipos de textos automáticos. Aquí están los más comunes:

- **Confirmación de cita** — Se envía justo después de una llamada donde se reservó una cita. Incluye la fecha, hora y tipo de servicio.
- **Recordatorio de cita** — Se envía el día antes de la cita como un recordatorio amigable. Ayuda a reducir las ausencias.
- **Mensaje de seguimiento** — Se envía después de una cita completada para preguntar cómo estuvo el servicio. Esto puede ayudarte a conseguir reseñas y clientes recurrentes.
- **Texto por llamada perdida** — Si una llamada se pierde por cualquier razón, Maria envía un texto a la persona diciendo "Disculpa que no pudimos contestar. ¿En qué podemos ayudar?" Esto convierte una llamada perdida en una conversación por texto.

## Historial de Mensajes por Cliente

También puedes ver todos los mensajes de un cliente específico. Haz clic en cualquier mensaje del registro y verás el hilo completo — cada texto enviado y recibido con esa persona. Esto es útil cuando necesitas contexto antes de llamar a alguien de vuelta.

## Buscar y Filtrar

En la parte superior de la página de SMS, puedes:

- **Buscar por número de teléfono** para encontrar rápidamente mensajes de un cliente específico
- **Filtrar por dirección** para ver solo mensajes entrantes o solo salientes
- **Filtrar por fecha** para ver mensajes de un período de tiempo específico

## Consejos para Manejar Tus SMS

1. **Revisa tus mensajes entrantes todos los días.** Los clientes a veces prefieren escribir en vez de llamar. Si Maria no puede manejar la solicitud por texto, puede que necesites dar seguimiento.
2. **Mira los textos por llamadas perdidas.** Estas son oportunidades de oro. Alguien trató de comunicarse y Maria les escribió — ahora puedes cerrar el trato.
3. **Usa el historial de mensajes antes de devolver llamadas.** Antes de llamar a un cliente, revisa su hilo de SMS para saber qué ya se habló.

Tu registro de SMS funciona de la mano con tu registro de llamadas. Juntos te dan una imagen completa de cada interacción de clientes con tu negocio.`,
    metaTitle: "Viewing Your SMS Messages | Capta Help",
    metaTitleEs: "Ver Tus Mensajes SMS | Ayuda Capta",
    metaDescription:
      "Learn how to view and manage your SMS message log in Capta, including inbound and outbound texts, templates, and message history.",
    metaDescriptionEs:
      "Aprende a ver y manejar tu registro de mensajes SMS en Capta, incluyendo textos entrantes y salientes, plantillas e historial.",
    searchKeywords:
      "SMS, text messages, inbound, outbound, message log, appointment confirmation, reminder text, missed call text, SMS history, text templates",
    searchKeywordsEs:
      "SMS, mensajes de texto, entrante, saliente, registro de mensajes, confirmación de cita, texto recordatorio, texto llamada perdida, historial SMS",
    categorySlug: "managing-calls",
    dashboardContextRoutes: ["/dashboard/sms"],
    sortOrder: 4,
    readingTimeMinutes: 3,
  },

  // ── 5. Reading Call Transcripts and Summaries ────────────────────────
  {
    slug: "reading-transcripts",
    title: "Reading Call Transcripts and Summaries",
    titleEs: "Leer Transcripciones y Resúmenes de Llamadas",
    excerpt:
      "Find out where to read full call transcripts, AI-generated summaries, and sentiment analysis to improve your customer service.",
    excerptEs:
      "Descubre dónde leer transcripciones completas de llamadas, resúmenes generados por IA y análisis de sentimiento para mejorar tu servicio.",
    content: `# Reading Call Transcripts and Summaries

Every call Maria handles gets a full transcript and an AI-generated summary. These tools help you understand what happened on each call without having to listen to recordings. Here is how to find and use them.

## Where to Find Transcripts

1. Go to your **Dashboard** and click **Calls** in the left menu.
2. Find the call you want to review and click on it.
3. On the call detail page, scroll down to the **Transcript** section.

The transcript shows the full conversation between Maria and the caller, word for word. Each message is labeled so you can see who said what. Maria's responses are on one side and the caller's words are on the other.

## AI-Generated Summaries

At the top of each call detail page, you will see a **Summary** box. This is a short paragraph written by AI that captures the key points of the call. A typical summary includes:

- **Why the person called** — for example, "Customer called to schedule an AC tune-up."
- **What was discussed** — the main topics and any questions asked.
- **What happened next** — whether an appointment was booked, a transfer was made, or information was provided.

Summaries save you time. Instead of reading a full 3-minute transcript, you can get the gist in 10 seconds. This is especially useful when you have 20 or 30 calls to review at the end of the week.

## Sentiment Analysis

Next to the summary, you will see a **Sentiment** label. This tells you the overall mood of the caller during the conversation:

- **Positive** — The caller was friendly, satisfied, or enthusiastic. Example: "Great, that time works perfectly!"
- **Neutral** — The caller was calm and straightforward. Example: "Yes, I need a plumber for Thursday."
- **Negative** — The caller sounded frustrated, angry, or upset. Example: "I've been waiting all week and nobody called me back."

Sentiment is measured by Maria's AI during the call. It looks at the caller's tone of voice and the words they use.

## Why Sentiment Matters

Paying attention to sentiment helps you in several ways:

- **Catch unhappy customers quickly.** Filter your call log by negative sentiment to find callers who might leave a bad review or stop using your service.
- **Recognize great interactions.** Positive calls often mean a lead is ready to buy. Follow up with these callers to close the deal.
- **Track trends over time.** If you see more negative calls than usual, something might need fixing — maybe a scheduling issue or a miscommunication.

## Using Transcripts for Quality

Transcripts are not just for seeing what happened — they help you improve:

1. **Check Maria's answers.** Make sure she is giving accurate information about your services, prices, and availability.
2. **Find common questions.** If many callers ask the same thing, you can update Maria's knowledge base so she handles it better.
3. **Train your team.** Share transcripts with your employees so they know what customers are asking about and how to respond.
4. **Resolve disputes.** If a customer says "I was told a different price," you can pull up the transcript and see exactly what was said.

## Tips for Getting the Most from Transcripts

- **Review negative sentiment calls first.** These are the most important to follow up on.
- **Skim summaries daily.** Even if you do not read every transcript, read the summaries so you know what is happening.
- **Bookmark important calls.** If a call is especially valuable or problematic, bookmark it so you can find it again easily.

Transcripts and summaries give you full visibility into every customer conversation. Use them to provide better service and grow your business.`,
    contentEs: `# Leer Transcripciones y Resúmenes de Llamadas

Cada llamada que maneja Maria recibe una transcripción completa y un resumen generado por IA. Estas herramientas te ayudan a entender qué pasó en cada llamada sin tener que escuchar grabaciones. Aquí te explicamos cómo encontrarlas y usarlas.

## Dónde Encontrar las Transcripciones

1. Ve a tu **Panel** y haz clic en **Llamadas** en el menú de la izquierda.
2. Encuentra la llamada que quieres revisar y haz clic en ella.
3. En la página de detalle de la llamada, baja hasta la sección de **Transcripción**.

La transcripción muestra la conversación completa entre Maria y la persona, palabra por palabra. Cada mensaje está etiquetado para que puedas ver quién dijo qué. Las respuestas de Maria están de un lado y las palabras de la persona del otro.

## Resúmenes Generados por IA

En la parte superior de cada página de detalle de llamada, verás un cuadro de **Resumen**. Este es un párrafo corto escrito por IA que captura los puntos clave de la llamada. Un resumen típico incluye:

- **Por qué llamó la persona** — por ejemplo, "El cliente llamó para programar un mantenimiento de aire acondicionado."
- **Qué se discutió** — los temas principales y cualquier pregunta que se hizo.
- **Qué pasó después** — si se reservó una cita, se hizo una transferencia o se proporcionó información.

Los resúmenes te ahorran tiempo. En vez de leer una transcripción completa de 3 minutos, puedes entender lo esencial en 10 segundos. Esto es especialmente útil cuando tienes 20 o 30 llamadas que revisar al final de la semana.

## Análisis de Sentimiento

Junto al resumen, verás una etiqueta de **Sentimiento**. Esto te dice el ánimo general de la persona durante la conversación:

- **Positivo** — La persona fue amigable, satisfecha o entusiasta. Ejemplo: "¡Perfecto, ese horario me funciona muy bien!"
- **Neutral** — La persona estuvo tranquila y directa. Ejemplo: "Sí, necesito un plomero para el jueves."
- **Negativo** — La persona sonaba frustrada, enojada o molesta. Ejemplo: "Llevo esperando toda la semana y nadie me devolvió la llamada."

El sentimiento es medido por la IA de Maria durante la llamada. Analiza el tono de voz y las palabras que usa la persona.

## Por Qué Importa el Sentimiento

Prestar atención al sentimiento te ayuda de varias maneras:

- **Detectar clientes insatisfechos rápido.** Filtra tu registro de llamadas por sentimiento negativo para encontrar personas que podrían dejar una mala reseña o dejar de usar tu servicio.
- **Reconocer buenas interacciones.** Las llamadas positivas frecuentemente significan que un cliente potencial está listo para contratar. Dale seguimiento a estas personas para cerrar el trato.
- **Rastrear tendencias con el tiempo.** Si ves más llamadas negativas de lo usual, algo puede necesitar arreglarse — quizás un problema de horarios o una mala comunicación.

## Usar Transcripciones para Mejorar la Calidad

Las transcripciones no son solo para ver qué pasó — te ayudan a mejorar:

1. **Verifica las respuestas de Maria.** Asegúrate de que esté dando información correcta sobre tus servicios, precios y disponibilidad.
2. **Encuentra preguntas comunes.** Si muchas personas preguntan lo mismo, puedes actualizar la base de conocimiento de Maria para que lo maneje mejor.
3. **Capacita a tu equipo.** Comparte transcripciones con tus empleados para que sepan qué preguntan los clientes y cómo responder.
4. **Resuelve disputas.** Si un cliente dice "Me dijeron un precio diferente," puedes buscar la transcripción y ver exactamente qué se dijo.

## Consejos para Aprovechar las Transcripciones

- **Revisa primero las llamadas con sentimiento negativo.** Estas son las más importantes para dar seguimiento.
- **Lee los resúmenes a diario.** Aunque no leas cada transcripción, lee los resúmenes para saber qué está pasando.
- **Marca llamadas importantes.** Si una llamada es especialmente valiosa o problemática, márcala para encontrarla fácilmente después.

Las transcripciones y resúmenes te dan visibilidad completa de cada conversación con clientes. Úsalos para dar mejor servicio y hacer crecer tu negocio.`,
    metaTitle: "Reading Call Transcripts & Summaries | Capta",
    metaTitleEs: "Leer Transcripciones y Resúmenes | Capta",
    metaDescription:
      "Find call transcripts, AI summaries, and sentiment analysis in your Capta dashboard. Learn how to use them to improve customer service.",
    metaDescriptionEs:
      "Encuentra transcripciones, resúmenes de IA y análisis de sentimiento en tu panel de Capta. Aprende a usarlos para mejorar tu servicio.",
    searchKeywords:
      "transcripts, call transcripts, AI summary, call summary, sentiment analysis, positive, negative, neutral, call review, call quality",
    searchKeywordsEs:
      "transcripciones, transcripciones de llamadas, resumen de IA, resumen de llamada, análisis de sentimiento, positivo, negativo, neutral, revisión de llamada",
    categorySlug: "managing-calls",
    dashboardContextRoutes: ["/dashboard/calls"],
    sortOrder: 5,
    readingTimeMinutes: 3,
  },

  // ── 6. Your Monthly Performance Report ───────────────────────────────
  {
    slug: "monthly-report",
    title: "Your Monthly Performance Report",
    titleEs: "Tu Reporte Mensual de Rendimiento",
    excerpt:
      "Understand your monthly performance report, including call volume trends, appointment conversion rates, and how to use the data.",
    excerptEs:
      "Entiende tu reporte mensual de rendimiento, incluyendo tendencias de volumen de llamadas, tasas de conversión de citas y cómo usar los datos.",
    content: `# Your Monthly Performance Report

At the beginning of each month, Capta puts together a performance report for your business. This report shows you how Maria performed over the past 30 days and gives you data to make smarter decisions. Here is what is in the report and how to use it.

## Where to Find Your Report

Your monthly report shows up in two places:

1. **Your dashboard home page.** When you log in to your dashboard, the most recent report summary is displayed right on the main page.
2. **Email.** We send a copy of the report to your email address on the first of each month.

## What Is in the Report

Your report has several sections. Here is what each one covers:

### Call Volume

This section shows the total number of calls Maria handled during the month. You will see:

- **Total calls** — the overall number
- **Calls by day of the week** — a chart showing which days are busiest
- **Calls by time of day** — so you can see if you get more calls in the morning, afternoon, or evening
- **Comparison to last month** — whether your call volume went up or down

This data helps you understand your busy times. If Tuesdays are your busiest day, you might schedule lighter jobs on Tuesdays so you can handle overflow.

### Appointment Conversion

This is one of the most important numbers in the report. It shows:

- **Total appointments booked** — how many callers scheduled a service
- **Conversion rate** — the percentage of calls that turned into appointments. For example, if Maria handled 100 calls and 35 of them booked an appointment, your conversion rate is 35%.
- **Comparison to last month** — so you can see if you are trending up or down

A healthy conversion rate for home service businesses is usually between 25% and 45%. If your rate is lower, it might mean callers are just asking questions, or that Maria needs updated information about your services.

### Call Outcomes

This section breaks down what happened on each call:

- **Completed** — normal calls that finished successfully
- **Transferred** — calls that went to your phone
- **Voicemail** — calls where the customer left a message
- **Missed or failed** — calls that did not connect

If your missed or failed rate is high, contact support so we can look into it.

### Customer Sentiment

The report includes a sentiment breakdown:

- What percentage of callers were positive, neutral, or negative
- Any change compared to the previous month

If negative sentiment is rising, it is a signal to investigate. Maybe your prices changed and callers are frustrated, or maybe there is a common issue Maria is not handling well.

## How to Use the Data

Here are practical ways to use your monthly report:

1. **Adjust your schedule.** If the report shows most calls come on Monday mornings, consider keeping that time open for phone callbacks.
2. **Improve your conversion rate.** If it is low, look at call transcripts to see why callers are not booking. Maybe Maria needs better answers about pricing.
3. **Set monthly goals.** Use last month's numbers as a baseline. Try to beat your appointment count or improve your conversion rate by a few percentage points.
4. **Share with your team.** If you have employees, share the report so everyone knows how the business is doing.

## A Quick Note on Data Privacy

Your report only includes aggregate numbers — it does not share individual customer details. All data is kept secure and only you can see your report.

Your monthly report is like a scorecard for your business. Review it every month, look for patterns, and use the data to keep growing. Maria is working for you 24/7 — the report shows you exactly how well she is doing.`,
    contentEs: `# Tu Reporte Mensual de Rendimiento

Al inicio de cada mes, Capta prepara un reporte de rendimiento para tu negocio. Este reporte te muestra cómo se desempeñó Maria durante los últimos 30 días y te da datos para tomar mejores decisiones. Aquí te explicamos qué contiene el reporte y cómo usarlo.

## Dónde Encontrar Tu Reporte

Tu reporte mensual aparece en dos lugares:

1. **La página principal de tu panel.** Cuando entras a tu panel, el resumen del reporte más reciente se muestra en la página principal.
2. **Correo electrónico.** Enviamos una copia del reporte a tu correo el primer día de cada mes.

## Qué Contiene el Reporte

Tu reporte tiene varias secciones. Esto es lo que cubre cada una:

### Volumen de Llamadas

Esta sección muestra el número total de llamadas que manejó Maria durante el mes. Verás:

- **Total de llamadas** — el número general
- **Llamadas por día de la semana** — una gráfica que muestra qué días son los más ocupados
- **Llamadas por hora del día** — para que veas si recibes más llamadas en la mañana, tarde o noche
- **Comparación con el mes anterior** — si tu volumen de llamadas subió o bajó

Estos datos te ayudan a entender tus momentos más ocupados. Si los martes son tu día más activo, podrías programar trabajos más ligeros los martes para manejar el exceso.

### Conversión de Citas

Este es uno de los números más importantes del reporte. Muestra:

- **Total de citas reservadas** — cuántas personas programaron un servicio
- **Tasa de conversión** — el porcentaje de llamadas que se convirtieron en citas. Por ejemplo, si Maria manejó 100 llamadas y 35 de ellas reservaron una cita, tu tasa de conversión es 35%.
- **Comparación con el mes anterior** — para que veas si la tendencia va hacia arriba o abajo

Una tasa de conversión saludable para negocios de servicios del hogar usualmente está entre 25% y 45%. Si tu tasa es menor, puede significar que las personas solo están haciendo preguntas, o que Maria necesita información actualizada sobre tus servicios.

### Resultados de Llamadas

Esta sección desglosa qué pasó en cada llamada:

- **Completada** — llamadas normales que terminaron bien
- **Transferida** — llamadas que fueron a tu teléfono
- **Buzón de voz** — llamadas donde el cliente dejó un mensaje
- **Perdida o fallida** — llamadas que no se conectaron

Si tu tasa de llamadas perdidas o fallidas es alta, contacta a soporte para que podamos investigar.

### Sentimiento de Clientes

El reporte incluye un desglose de sentimiento:

- Qué porcentaje de personas fueron positivas, neutrales o negativas
- Cualquier cambio comparado con el mes anterior

Si el sentimiento negativo está subiendo, es una señal para investigar. Quizás cambiaron tus precios y las personas están frustradas, o hay un problema común que Maria no está manejando bien.

## Cómo Usar los Datos

Aquí hay maneras prácticas de usar tu reporte mensual:

1. **Ajusta tu horario.** Si el reporte muestra que la mayoría de las llamadas llegan los lunes en la mañana, considera mantener ese tiempo libre para devolver llamadas.
2. **Mejora tu tasa de conversión.** Si es baja, revisa las transcripciones para ver por qué las personas no están agendando. Quizás Maria necesita mejores respuestas sobre precios.
3. **Establece metas mensuales.** Usa los números del mes pasado como punto de partida. Intenta superar tu cantidad de citas o mejorar tu tasa de conversión unos puntos porcentuales.
4. **Comparte con tu equipo.** Si tienes empleados, comparte el reporte para que todos sepan cómo va el negocio.

## Una Nota sobre Privacidad de Datos

Tu reporte solo incluye números generales — no comparte detalles individuales de clientes. Todos los datos se mantienen seguros y solo tú puedes ver tu reporte.

Tu reporte mensual es como una tarjeta de calificaciones para tu negocio. Revísalo cada mes, busca patrones y usa los datos para seguir creciendo. Maria trabaja para ti las 24 horas del día, los 7 días de la semana — el reporte te muestra exactamente qué tan bien lo está haciendo.`,
    metaTitle: "Your Monthly Performance Report | Capta",
    metaTitleEs: "Tu Reporte Mensual de Rendimiento | Capta",
    metaDescription:
      "Understand your Capta monthly report with call volume trends, appointment conversion rates, sentiment data, and tips to grow your business.",
    metaDescriptionEs:
      "Entiende tu reporte mensual de Capta con tendencias de llamadas, tasas de conversión de citas, datos de sentimiento y consejos para crecer.",
    searchKeywords:
      "monthly report, performance report, call volume, appointment conversion, conversion rate, sentiment trends, analytics, business data, call stats",
    searchKeywordsEs:
      "reporte mensual, reporte de rendimiento, volumen de llamadas, conversión de citas, tasa de conversión, tendencias de sentimiento, analíticas, datos del negocio",
    categorySlug: "managing-calls",
    dashboardContextRoutes: ["/dashboard"],
    sortOrder: 6,
    readingTimeMinutes: 3,
  },
];
