import type { ArticleData } from "./types";

export const articles: ArticleData[] = [
  // ── 1. Maria Not Answering ─────────────────────────────────────────
  {
    slug: "maria-not-answering",
    title: "Maria Isn't Answering My Calls",
    titleEs: "María No Está Contestando Mis Llamadas",
    excerpt:
      "Learn what to check when Maria doesn't pick up your business calls, from call forwarding settings to Twilio configuration.",
    excerptEs:
      "Aprende qué revisar cuando María no contesta las llamadas de tu negocio, desde el desvío de llamadas hasta la configuración de Twilio.",
    content: `# Maria Isn't Answering My Calls

If customers are calling your business number and Maria isn't picking up, don't worry. This is usually a quick fix. Let's walk through the most common reasons and how to solve each one.

## Step 1: Check Your Call Forwarding

The most common reason Maria doesn't answer is that calls are not being forwarded to her. Your phone carrier needs to send calls to the Calltide number when you can't answer.

**How to check:**

1. From your cell phone, dial the test number shown in your Calltide dashboard.
2. If Maria answers, forwarding from your phone to Calltide works. The problem is between your customers and your carrier.
3. If Maria does NOT answer, your forwarding is not set up right.

**How to fix forwarding:**

- **AT&T:** Dial \`*61*[your Calltide number]#\` then press Call.
- **T-Mobile:** Dial \`**61*1[your Calltide number]#\` then press Call.
- **Verizon:** Dial \`*71[your Calltide number]\` then press Call.
- If you use a different carrier, call them and ask to set up "conditional call forwarding" to your Calltide number.

## Step 2: Verify Your Twilio Configuration

Your Calltide account connects to phone lines through Twilio. Sometimes the connection between Twilio and Calltide can have a hiccup.

**What to check:**

- Log into your Calltide dashboard and go to your account settings.
- Make sure your phone number is listed and shows a green "Active" status.
- If you see a yellow or red status, click on the number to see the error details.

## Step 3: Check Your Business Hours

Maria answers calls 24/7 by default. But if you set up custom business hours, she might be configured to only answer during certain times.

**How to check:**

- In your dashboard, go to Settings and look for "Business Hours."
- Make sure the hours match when you want Maria to answer.
- Remember that times are based on your timezone. If your timezone is wrong, Maria might think it's a different time of day.

## Step 4: Try a Test Call

After making any changes, test right away:

1. Call your business number from a different phone.
2. Wait at least 4 rings.
3. Maria should pick up and greet the caller.

## Still Not Working?

If you've checked all of the above and Maria still isn't answering, contact our support team. We can look at the call logs on our end and find the issue fast.

- **Email:** support@calltide.com
- **Text:** Send "HELP" to your Calltide number
- **Dashboard:** Click the chat icon in the bottom-right corner

We usually respond within one business hour.`,
    contentEs: `# María No Está Contestando Mis Llamadas

Si tus clientes están llamando al número de tu negocio y María no contesta, no te preocupes. Esto casi siempre tiene una solución rápida. Vamos a revisar las razones más comunes y cómo arreglar cada una.

## Paso 1: Revisa el Desvío de Llamadas

La razón más común por la que María no contesta es que las llamadas no se están desviando hacia ella. Tu compañía de teléfono necesita enviar las llamadas al número de Calltide cuando tú no puedes contestar.

**Cómo verificar:**

1. Desde tu celular, marca el número de prueba que aparece en tu panel de Calltide.
2. Si María contesta, el desvío desde tu teléfono a Calltide funciona. El problema está entre tus clientes y tu compañía de teléfono.
3. Si María NO contesta, el desvío no está bien configurado.

**Cómo arreglar el desvío:**

- **AT&T:** Marca \`*61*[tu número de Calltide]#\` y presiona Llamar.
- **T-Mobile:** Marca \`**61*1[tu número de Calltide]#\` y presiona Llamar.
- **Verizon:** Marca \`*71[tu número de Calltide]\` y presiona Llamar.
- Si usas otra compañía, llámalos y pide que configuren el "desvío de llamadas condicional" hacia tu número de Calltide.

## Paso 2: Verifica la Configuración de Twilio

Tu cuenta de Calltide se conecta a las líneas telefónicas a través de Twilio. A veces la conexión entre Twilio y Calltide puede tener un problema temporal.

**Qué revisar:**

- Entra a tu panel de Calltide y ve a la configuración de tu cuenta.
- Asegúrate de que tu número de teléfono esté listado y muestre un estado verde de "Activo."
- Si ves un estado amarillo o rojo, haz clic en el número para ver los detalles del error.

## Paso 3: Revisa Tu Horario de Atención

María contesta llamadas las 24 horas del día, los 7 días de la semana por defecto. Pero si configuraste un horario personalizado, ella podría estar configurada para contestar solo durante ciertas horas.

**Cómo verificar:**

- En tu panel, ve a Configuración y busca "Horario de Atención."
- Asegúrate de que las horas correspondan a cuando quieres que María conteste.
- Recuerda que los horarios se basan en tu zona horaria. Si tu zona horaria está incorrecta, María podría pensar que es una hora diferente.

## Paso 4: Haz una Llamada de Prueba

Después de hacer cualquier cambio, prueba de inmediato:

1. Llama a tu número de negocio desde un teléfono diferente.
2. Espera al menos 4 timbrazos.
3. María debería contestar y saludar a la persona que llama.

## ¿Todavía No Funciona?

Si ya revisaste todo lo anterior y María todavía no contesta, contacta a nuestro equipo de soporte. Nosotros podemos revisar los registros de llamadas de nuestro lado y encontrar el problema rápido.

- **Correo electrónico:** support@calltide.com
- **Mensaje de texto:** Envía "AYUDA" a tu número de Calltide
- **Panel:** Haz clic en el ícono de chat en la esquina inferior derecha

Normalmente respondemos dentro de una hora de trabajo.`,
    metaTitle: "Maria Not Answering Calls — Calltide Help",
    metaTitleEs: "María No Contesta Llamadas — Ayuda Calltide",
    metaDescription:
      "Troubleshoot why Maria isn't answering your business calls. Check call forwarding, Twilio config, and business hours step by step.",
    metaDescriptionEs:
      "Soluciona por qué María no contesta las llamadas de tu negocio. Revisa desvío de llamadas, configuración de Twilio y horarios paso a paso.",
    searchKeywords:
      "maria not answering, calls not working, no answer, call forwarding, twilio, business hours, phone not ringing, missed calls",
    searchKeywordsEs:
      "maría no contesta, llamadas no funcionan, sin respuesta, desvío de llamadas, twilio, horario de atención, teléfono no suena, llamadas perdidas",
    categorySlug: "troubleshooting",
    dashboardContextRoutes: [],
    sortOrder: 1,
    readingTimeMinutes: 3,
  },

  // ── 2. Not Receiving SMS Notifications ─────────────────────────────
  {
    slug: "not-receiving-notifications",
    title: "I'm Not Receiving SMS Notifications",
    titleEs: "No Estoy Recibiendo Notificaciones SMS",
    excerpt:
      "Find out why you aren't getting text message alerts from Calltide and how to fix common SMS issues.",
    excerptEs:
      "Descubre por qué no estás recibiendo alertas por mensaje de texto de Calltide y cómo arreglar los problemas comunes de SMS.",
    content: `# I'm Not Receiving SMS Notifications

Calltide sends you a text message after every call Maria handles. These texts tell you who called, what they needed, and if an appointment was booked. If you stopped getting these messages, here's how to fix it.

## Step 1: Make Sure You Didn't Opt Out

If you ever replied "STOP" to a Calltide text message, our system is required by law to stop sending you texts. This is the number one reason people stop getting notifications.

**How to fix it:**

1. From your phone, send the word **START** to your Calltide number.
2. You should get a confirmation message within a few seconds.
3. That's it — you'll start getting notifications again.

## Step 2: Check Your Phone Number Format

Your phone number in the system needs to be in the right format. It should be a 10-digit US number with no dashes, spaces, or country code.

**How to check:**

1. Log into your Calltide dashboard.
2. Go to Settings and find "Notification Phone Number."
3. Make sure the number is correct and matches the phone you're checking.
4. If the number is wrong, update it and save.

## Step 3: Look at Your SMS Log

Your dashboard keeps a record of every text message Calltide tries to send you. This can help you figure out where the problem is.

**How to check:**

1. In your dashboard, go to the **SMS** section.
2. Look at the "Status" column for your recent messages.
3. **Delivered** means the message left our system and reached your carrier.
4. **Failed** means something went wrong on our end — contact support.
5. **Undelivered** means your carrier blocked or rejected the message.

## Step 4: Check for Carrier Blocking

Phone carriers like AT&T, T-Mobile, and Verizon sometimes block text messages they think are spam. This can happen to business messages like ours.

**What to try:**

- **Check your phone's spam/blocked messages folder.** Some phones filter texts automatically.
- **Make sure your phone isn't set to block unknown numbers.** On iPhone, go to Settings > Messages > Filter Unknown Senders. On Android, check your Messages app settings.
- **Contact your carrier.** Ask them if they are blocking texts from your Calltide number. They can add it to an allow list.

## Step 5: Check for Do Not Disturb

This one sounds simple, but it catches people all the time. If your phone is on Do Not Disturb mode, you won't hear text notifications even though the messages are arriving.

- **iPhone:** Swipe down from the top-right corner. If the moon icon is purple, DND is on. Tap it to turn it off.
- **Android:** Swipe down from the top. Look for the "Do Not Disturb" tile and make sure it's off.

## Still Not Getting Texts?

If none of the above steps fix the problem, reach out to our support team. We can check the delivery logs on our side and work with your carrier if needed.

- **Email:** support@calltide.com
- **Dashboard:** Click the chat icon in the bottom-right corner`,
    contentEs: `# No Estoy Recibiendo Notificaciones SMS

Calltide te envía un mensaje de texto después de cada llamada que María maneja. Estos textos te dicen quién llamó, qué necesitaban y si se reservó una cita. Si dejaste de recibir estos mensajes, aquí te explicamos cómo arreglarlo.

## Paso 1: Asegúrate de Que No Te Diste de Baja

Si alguna vez respondiste "STOP" a un mensaje de texto de Calltide, nuestro sistema está obligado por ley a dejar de enviarte textos. Esta es la razón número uno por la que las personas dejan de recibir notificaciones.

**Cómo arreglarlo:**

1. Desde tu teléfono, envía la palabra **START** a tu número de Calltide.
2. Deberías recibir un mensaje de confirmación en unos segundos.
3. Eso es todo — empezarás a recibir notificaciones de nuevo.

## Paso 2: Revisa el Formato de Tu Número de Teléfono

Tu número de teléfono en el sistema necesita estar en el formato correcto. Debe ser un número de EE.UU. de 10 dígitos sin guiones, espacios ni código de país.

**Cómo verificar:**

1. Entra a tu panel de Calltide.
2. Ve a Configuración y busca "Número de Teléfono para Notificaciones."
3. Asegúrate de que el número sea correcto y corresponda al teléfono que estás revisando.
4. Si el número está mal, actualízalo y guarda los cambios.

## Paso 3: Revisa Tu Registro de SMS

Tu panel guarda un registro de cada mensaje de texto que Calltide intenta enviarte. Esto puede ayudarte a determinar dónde está el problema.

**Cómo verificar:**

1. En tu panel, ve a la sección de **SMS**.
2. Mira la columna de "Estado" de tus mensajes recientes.
3. **Entregado** significa que el mensaje salió de nuestro sistema y llegó a tu compañía de teléfono.
4. **Fallido** significa que algo salió mal de nuestro lado — contacta a soporte.
5. **No entregado** significa que tu compañía de teléfono bloqueó o rechazó el mensaje.

## Paso 4: Revisa Si Tu Compañía Está Bloqueando Mensajes

Las compañías de teléfono como AT&T, T-Mobile y Verizon a veces bloquean mensajes de texto que creen que son spam. Esto puede pasar con mensajes de negocios como los nuestros.

**Qué intentar:**

- **Revisa la carpeta de spam o mensajes bloqueados de tu teléfono.** Algunos teléfonos filtran textos automáticamente.
- **Asegúrate de que tu teléfono no esté configurado para bloquear números desconocidos.** En iPhone, ve a Ajustes > Mensajes > Filtrar Remitentes Desconocidos. En Android, revisa la configuración de tu aplicación de Mensajes.
- **Contacta a tu compañía de teléfono.** Pregunta si están bloqueando textos de tu número de Calltide. Ellos pueden agregarlo a una lista de permitidos.

## Paso 5: Revisa el Modo No Molestar

Esto suena sencillo, pero le pasa a muchas personas. Si tu teléfono está en modo No Molestar, no escucharás las notificaciones de texto aunque los mensajes estén llegando.

- **iPhone:** Desliza hacia abajo desde la esquina superior derecha. Si el ícono de la luna está morado, No Molestar está activado. Tócalo para desactivarlo.
- **Android:** Desliza hacia abajo desde la parte superior. Busca la opción "No Molestar" y asegúrate de que esté desactivada.

## ¿Todavía No Recibes Textos?

Si ninguno de los pasos anteriores arregla el problema, comunícate con nuestro equipo de soporte. Podemos revisar los registros de entrega de nuestro lado y trabajar con tu compañía si es necesario.

- **Correo electrónico:** support@calltide.com
- **Panel:** Haz clic en el ícono de chat en la esquina inferior derecha`,
    metaTitle: "Not Getting SMS Notifications — Calltide Help",
    metaTitleEs: "No Llegan Notificaciones SMS — Ayuda Calltide",
    metaDescription:
      "Fix missing SMS notifications from Calltide. Check opt-out status, phone number format, SMS logs, and carrier blocking issues.",
    metaDescriptionEs:
      "Arregla las notificaciones SMS faltantes de Calltide. Revisa estado de baja, formato de número, registros SMS y bloqueos de compañía.",
    searchKeywords:
      "sms not working, no text messages, notifications missing, opt out, stop texts, carrier blocking, text alerts, sms log",
    searchKeywordsEs:
      "sms no funciona, no llegan mensajes, notificaciones perdidas, darse de baja, detener textos, compañía bloquea, alertas de texto, registro sms",
    categorySlug: "troubleshooting",
    dashboardContextRoutes: ["/dashboard/sms"],
    sortOrder: 2,
    readingTimeMinutes: 3,
  },

  // ── 3. Wrong Greeting ──────────────────────────────────────────────
  {
    slug: "wrong-greeting",
    title: "Callers Are Hearing the Wrong Greeting",
    titleEs: "Los Que Llaman Escuchan el Saludo Incorrecto",
    excerpt:
      "Fix the greeting your callers hear when Maria answers by updating your custom greeting settings.",
    excerptEs:
      "Corrige el saludo que escuchan tus clientes cuando María contesta actualizando la configuración de tu saludo personalizado.",
    content: `# Callers Are Hearing the Wrong Greeting

When Maria answers your calls, the first thing she says is your greeting. If callers are hearing the wrong business name, the wrong language, or a generic greeting instead of your custom one, here's how to fix it.

## How Greetings Work

Maria uses the greeting you set up in your dashboard. If you never set a custom greeting, she uses a default one that says: "Thank you for calling. How can I help you today?"

Your custom greeting should include:

- Your business name
- A friendly welcome
- Optionally, your hours, current promotions, or anything you want callers to hear first

For example: "Thank you for calling Rodriguez Plumbing! Maria speaking, how can I help you today?"

## Step 1: Check Your Current Greeting

1. Log into your Calltide dashboard.
2. Go to **Settings** and look for the **Greeting** section.
3. Read what's in the greeting text box. This is exactly what Maria will say.
4. If it's blank, Maria is using the default greeting.

## Step 2: Update Your Greeting

To change what Maria says when she answers:

1. In the Greeting section of your settings, clear the text box.
2. Type your new greeting. Keep it short — under 30 words works best. Callers don't want to wait through a long message before they can talk.
3. Click **Save**.
4. The change takes effect right away. There's no delay.

**Tips for a great greeting:**

- Say your business name clearly.
- Keep it warm and friendly.
- Don't include your phone number — the caller already dialed it.
- Avoid listing all your services. Maria will ask what they need.

## Step 3: Check Your Language Settings

Maria can greet callers in English, Spanish, or both. If callers are hearing the greeting in the wrong language, your language setting might be off.

**How to check:**

1. In Settings, find the **Language** option.
2. You should see three choices:
   - **English only** — Maria always greets in English.
   - **Spanish only** — Maria always greets in Spanish.
   - **Bilingual** — Maria detects the caller's language and responds accordingly.
3. For most home service businesses in Texas, we recommend **Bilingual**. This way, English-speaking and Spanish-speaking customers both feel welcome.

## Step 4: Check Your Spanish Greeting

If you have bilingual mode turned on, you also need a Spanish version of your greeting.

1. In the Greeting section, look for the **Spanish Greeting** text box.
2. If it's empty, Maria will translate your English greeting automatically. This usually works fine, but a custom Spanish greeting sounds more natural.
3. Type your Spanish greeting and click **Save**.

For example: "¡Gracias por llamar a Rodriguez Plumbing! Habla María, ¿en qué le puedo ayudar?"

## Step 5: Test It

After making changes, call your business number from another phone. Listen to what Maria says. If it sounds right, you're all set.

## Common Issues

- **Maria says an old business name:** You probably updated your business name in one place but not in the greeting. Go to Settings > Greeting and update the text.
- **Maria uses a generic greeting:** Your custom greeting field is probably empty. Type in your greeting and save.
- **Maria greets in Spanish but I want English:** Change your language setting to English or Bilingual.

## Need Help Writing a Greeting?

Our support team is happy to help you write the perfect greeting in English and Spanish. Just reach out:

- **Email:** support@calltide.com
- **Dashboard:** Click the chat icon in the bottom-right corner`,
    contentEs: `# Los Que Llaman Escuchan el Saludo Incorrecto

Cuando María contesta tus llamadas, lo primero que dice es tu saludo. Si tus clientes escuchan el nombre de negocio incorrecto, el idioma equivocado, o un saludo genérico en vez de uno personalizado, aquí te explicamos cómo arreglarlo.

## Cómo Funcionan los Saludos

María usa el saludo que configuraste en tu panel. Si nunca configuraste un saludo personalizado, ella usa uno predeterminado que dice: "Gracias por llamar. ¿En qué le puedo ayudar?"

Tu saludo personalizado debe incluir:

- El nombre de tu negocio
- Una bienvenida amigable
- Opcionalmente, tu horario, promociones actuales o cualquier cosa que quieras que los clientes escuchen primero

Por ejemplo: "¡Gracias por llamar a Rodríguez Plomería! Habla María, ¿en qué le puedo ayudar?"

## Paso 1: Revisa Tu Saludo Actual

1. Entra a tu panel de Calltide.
2. Ve a **Configuración** y busca la sección de **Saludo**.
3. Lee lo que está en el cuadro de texto del saludo. Esto es exactamente lo que María dirá.
4. Si está vacío, María está usando el saludo predeterminado.

## Paso 2: Actualiza Tu Saludo

Para cambiar lo que María dice cuando contesta:

1. En la sección de Saludo de tu configuración, borra el cuadro de texto.
2. Escribe tu nuevo saludo. Mantenlo corto — menos de 30 palabras funciona mejor. Los clientes no quieren esperar un mensaje largo antes de poder hablar.
3. Haz clic en **Guardar**.
4. El cambio toma efecto de inmediato. No hay ningún retraso.

**Consejos para un buen saludo:**

- Di el nombre de tu negocio claramente.
- Mantenlo cálido y amigable.
- No incluyas tu número de teléfono — la persona que llama ya lo marcó.
- Evita listar todos tus servicios. María les preguntará qué necesitan.

## Paso 3: Revisa la Configuración de Idioma

María puede saludar a las personas en inglés, español, o ambos. Si los clientes escuchan el saludo en el idioma equivocado, tu configuración de idioma podría estar mal.

**Cómo verificar:**

1. En Configuración, busca la opción de **Idioma**.
2. Deberías ver tres opciones:
   - **Solo inglés** — María siempre saluda en inglés.
   - **Solo español** — María siempre saluda en español.
   - **Bilingüe** — María detecta el idioma de la persona y responde de acuerdo.
3. Para la mayoría de los negocios de servicios del hogar en Texas, recomendamos **Bilingüe**. De esta forma, los clientes que hablan inglés y español se sienten bienvenidos.

## Paso 4: Revisa Tu Saludo en Español

Si tienes el modo bilingüe activado, también necesitas una versión en español de tu saludo.

1. En la sección de Saludo, busca el cuadro de texto de **Saludo en Español**.
2. Si está vacío, María traducirá tu saludo en inglés automáticamente. Esto generalmente funciona bien, pero un saludo personalizado en español suena más natural.
3. Escribe tu saludo en español y haz clic en **Guardar**.

Por ejemplo: "¡Gracias por llamar a Rodríguez Plomería! Habla María, ¿en qué le puedo ayudar?"

## Paso 5: Pruébalo

Después de hacer cambios, llama a tu número de negocio desde otro teléfono. Escucha lo que dice María. Si suena bien, ya quedó listo.

## Problemas Comunes

- **María dice un nombre de negocio antiguo:** Probablemente actualizaste el nombre de tu negocio en un lugar pero no en el saludo. Ve a Configuración > Saludo y actualiza el texto.
- **María usa un saludo genérico:** El campo de saludo personalizado probablemente está vacío. Escribe tu saludo y guarda.
- **María saluda en inglés pero quiero español:** Cambia tu configuración de idioma a Español o Bilingüe.

## ¿Necesitas Ayuda Para Escribir un Saludo?

Nuestro equipo de soporte está feliz de ayudarte a escribir el saludo perfecto en inglés y español. Solo contáctanos:

- **Correo electrónico:** support@calltide.com
- **Panel:** Haz clic en el ícono de chat en la esquina inferior derecha`,
    metaTitle: "Fix Wrong Greeting Message — Calltide Help",
    metaTitleEs: "Arreglar Saludo Incorrecto — Ayuda Calltide",
    metaDescription:
      "Fix what callers hear when Maria answers. Update your custom greeting, language settings, and Spanish greeting in your dashboard.",
    metaDescriptionEs:
      "Corrige lo que escuchan tus clientes cuando María contesta. Actualiza tu saludo, configuración de idioma y saludo en español.",
    searchKeywords:
      "wrong greeting, custom greeting, change greeting, language settings, bilingual, spanish greeting, business name wrong, default greeting",
    searchKeywordsEs:
      "saludo incorrecto, saludo personalizado, cambiar saludo, configuración de idioma, bilingüe, saludo en español, nombre de negocio mal, saludo predeterminado",
    categorySlug: "troubleshooting",
    dashboardContextRoutes: [],
    sortOrder: 3,
    readingTimeMinutes: 3,
  },

  // ── 4. Appointments Not Showing ────────────────────────────────────
  {
    slug: "appointments-not-showing",
    title: "Appointments Not Showing in Dashboard",
    titleEs: "Las Citas No Aparecen en el Panel",
    excerpt:
      "Troubleshoot missing appointments in your Calltide dashboard, including sync timing, filters, and timezone issues.",
    excerptEs:
      "Soluciona citas que no aparecen en tu panel de Calltide, incluyendo tiempos de sincronización, filtros y problemas de zona horaria.",
    content: `# Appointments Not Showing in Dashboard

When Maria books an appointment for you, it should show up in your Calltide dashboard right away. If you're not seeing appointments that you know were booked, here are the most common causes and how to fix them.

## Step 1: Wait a Moment for Syncing

After Maria finishes a call, it takes a short time for the appointment to appear in your dashboard. This is usually less than 30 seconds, but during busy times it can take up to 2 minutes.

**What to do:**

- Refresh your dashboard page by pressing F5 on your keyboard or pulling down on your phone screen.
- If the appointment still isn't there after 2 minutes, move to the next step.

## Step 2: Check Your Status Filters

Your dashboard lets you filter appointments by status. If you have a filter turned on, some appointments might be hidden.

**How to check:**

1. In your dashboard, go to the **Appointments** section.
2. Look at the top of the page for any filter buttons or dropdown menus.
3. Common filters include: Upcoming, Completed, Canceled, All.
4. Click **All** to see every appointment, no matter the status.
5. If the missing appointment shows up now, you just had a filter hiding it.

## Step 3: Check Your Timezone

This is a sneaky one. If your timezone is set wrong, appointments might appear on a different date than you expect. For example, if Maria books a job for Tuesday at 9 AM Central Time, but your dashboard is set to Pacific Time, it would show the right time but could look confusing when it falls near midnight.

**How to fix:**

1. Go to **Settings** in your dashboard.
2. Find the **Timezone** setting.
3. For Texas businesses, this should be set to **Central Time (CT)**.
4. Save the change and go back to your appointments page.

## Step 4: Check the Call Recording

Sometimes what sounds like an appointment booking on a call wasn't actually confirmed. Maria is trained to confirm the date, time, and service before booking. If the caller hung up before confirming, the appointment may not have been created.

**How to check:**

1. Go to the **Calls** section of your dashboard.
2. Find the call in question and click on it.
3. Read the call summary. Look for "Appointment booked" in the notes.
4. If it says "Appointment not confirmed" or "Caller disconnected," the appointment was not created.

## Step 5: Check the Date Range

Make sure you're looking at the right date range. If an appointment was booked for next week, it won't show up if you're only looking at today's appointments.

**What to do:**

- Use the date picker or calendar view to expand your date range.
- Try looking at the full month view to spot the appointment.

## Still Can't Find It?

If you've checked all the above and the appointment is still missing, contact support. We can pull up the call recording and check exactly what happened.

- **Email:** support@calltide.com
- **Dashboard:** Click the chat icon in the bottom-right corner

Give us the approximate time of the call and the caller's name or number, and we'll track it down for you.`,
    contentEs: `# Las Citas No Aparecen en el Panel

Cuando María reserva una cita por ti, debería aparecer en tu panel de Calltide de inmediato. Si no estás viendo citas que sabes que fueron reservadas, aquí están las causas más comunes y cómo arreglarlas.

## Paso 1: Espera un Momento para la Sincronización

Después de que María termina una llamada, toma un poco de tiempo para que la cita aparezca en tu panel. Esto generalmente toma menos de 30 segundos, pero en momentos de mucho tráfico puede tomar hasta 2 minutos.

**Qué hacer:**

- Actualiza la página de tu panel presionando F5 en tu teclado o deslizando hacia abajo en la pantalla de tu teléfono.
- Si la cita todavía no aparece después de 2 minutos, pasa al siguiente paso.

## Paso 2: Revisa Tus Filtros de Estado

Tu panel te permite filtrar citas por estado. Si tienes un filtro activado, algunas citas podrían estar ocultas.

**Cómo verificar:**

1. En tu panel, ve a la sección de **Citas**.
2. Mira en la parte superior de la página si hay botones de filtro o menús desplegables.
3. Los filtros comunes incluyen: Próximas, Completadas, Canceladas, Todas.
4. Haz clic en **Todas** para ver cada cita, sin importar el estado.
5. Si la cita que faltaba aparece ahora, solo tenías un filtro que la ocultaba.

## Paso 3: Revisa Tu Zona Horaria

Este es un problema sutil. Si tu zona horaria está configurada incorrectamente, las citas podrían aparecer en una fecha diferente a la que esperas. Por ejemplo, si María reserva un trabajo para el martes a las 9 AM hora Central, pero tu panel está configurado en hora del Pacífico, mostraría la hora correcta pero podría verse confuso cuando cae cerca de la medianoche.

**Cómo arreglar:**

1. Ve a **Configuración** en tu panel.
2. Busca la opción de **Zona Horaria**.
3. Para negocios en Texas, esto debería estar configurado como **Hora Central (CT)**.
4. Guarda el cambio y regresa a tu página de citas.

## Paso 4: Revisa la Grabación de la Llamada

A veces lo que suena como una reserva de cita en una llamada no fue realmente confirmado. María está entrenada para confirmar la fecha, hora y servicio antes de reservar. Si la persona colgó antes de confirmar, la cita podría no haberse creado.

**Cómo verificar:**

1. Ve a la sección de **Llamadas** de tu panel.
2. Encuentra la llamada en cuestión y haz clic en ella.
3. Lee el resumen de la llamada. Busca "Cita reservada" en las notas.
4. Si dice "Cita no confirmada" o "La persona que llamó se desconectó," la cita no fue creada.

## Paso 5: Revisa el Rango de Fechas

Asegúrate de que estés viendo el rango de fechas correcto. Si una cita fue reservada para la próxima semana, no aparecerá si solo estás viendo las citas de hoy.

**Qué hacer:**

- Usa el selector de fechas o la vista de calendario para ampliar tu rango de fechas.
- Intenta ver el mes completo para encontrar la cita.

## ¿Todavía No La Encuentras?

Si revisaste todo lo anterior y la cita sigue sin aparecer, contacta a soporte. Podemos revisar la grabación de la llamada y verificar exactamente qué pasó.

- **Correo electrónico:** support@calltide.com
- **Panel:** Haz clic en el ícono de chat en la esquina inferior derecha

Danos la hora aproximada de la llamada y el nombre o número de la persona que llamó, y la rastrearemos por ti.`,
    metaTitle: "Appointments Not Showing — Calltide Help",
    metaTitleEs: "Citas No Aparecen en el Panel — Ayuda Calltide",
    metaDescription:
      "Fix missing appointments in your Calltide dashboard. Check sync timing, status filters, timezone settings, and call recordings.",
    metaDescriptionEs:
      "Arregla citas faltantes en tu panel de Calltide. Revisa sincronización, filtros de estado, zona horaria y grabaciones de llamadas.",
    searchKeywords:
      "appointments missing, no appointments, dashboard empty, sync problem, timezone wrong, filter appointments, booking not showing, calendar empty",
    searchKeywordsEs:
      "citas faltantes, no hay citas, panel vacío, problema de sincronización, zona horaria incorrecta, filtrar citas, reserva no aparece, calendario vacío",
    categorySlug: "troubleshooting",
    dashboardContextRoutes: ["/dashboard/appointments"],
    sortOrder: 4,
    readingTimeMinutes: 3,
  },

  // ── 5. Can't Log In ────────────────────────────────────────────────
  {
    slug: "cant-login",
    title: "I Can't Log Into My Dashboard",
    titleEs: "No Puedo Entrar a Mi Panel",
    excerpt:
      "Solve login problems with your Calltide dashboard, including magic link issues, expired links, and browser troubles.",
    excerptEs:
      "Resuelve problemas para entrar a tu panel de Calltide, incluyendo problemas con enlaces mágicos, enlaces expirados y problemas del navegador.",
    content: `# I Can't Log Into My Dashboard

Calltide uses magic links to log you in. That means instead of a password, we send a special link to your email. You click the link and you're in. If this process isn't working for you, here's what to check.

## How Magic Link Login Works

1. You go to the Calltide login page.
2. You type in your email address and click "Send Magic Link."
3. We send an email with a special link to your inbox.
4. You click the link in the email.
5. You're logged into your dashboard.

There's no password to remember. The link works only once and expires after 15 minutes.

## Step 1: Check Your Spam Folder

The most common issue is that the magic link email ended up in your spam or junk folder. Email providers sometimes filter out emails with login links.

**What to do:**

1. Open your email app (Gmail, Yahoo, Outlook, etc.).
2. Go to your Spam or Junk folder.
3. Look for an email from **Calltide** or **noreply@calltide.com**.
4. If you find it, open it and click the login link.
5. Mark the email as "Not Spam" so future emails go to your inbox.

## Step 2: Make Sure You're Using the Right Email

You need to use the same email address you signed up with. If you're not sure which email that is, think about which email you gave us when you first set up Calltide.

**Common mistakes:**

- Using a personal email instead of a business email (or the other way around).
- Typos in the email address — double-check for missing letters or wrong domains (like typing .con instead of .com).

## Step 3: Check If the Link Expired

Magic links expire after 15 minutes. If you waited too long to click the link, it won't work anymore.

**How to fix:**

1. Go back to the Calltide login page.
2. Enter your email again and click "Send Magic Link."
3. Go to your email right away and click the new link.
4. Don't wait — click it as soon as you see it.

## Step 4: Try a Different Browser

Sometimes browser settings or extensions can block the login process. If clicking the magic link takes you to an error page or a blank screen, try a different browser.

**What to try:**

- If you use Safari, try Chrome or Firefox instead.
- If you use Chrome, try opening an Incognito window (press Ctrl+Shift+N on Windows or Cmd+Shift+N on Mac).
- Clear your browser's cookies and cache, then try again.

**How to clear cookies in Chrome:**

1. Click the three dots in the top-right corner.
2. Go to Settings > Privacy and Security > Clear Browsing Data.
3. Check "Cookies" and "Cached images and files."
4. Click "Clear data."
5. Go back to the Calltide login page and try again.

## Step 5: Check Your Internet Connection

If your internet is slow or disconnected, the magic link might not load properly. Try opening a different website to make sure your internet is working. If you're on a phone, try switching from Wi-Fi to cellular data (or the other way around).

## Still Can't Get In?

If you've tried everything above and still can't log in, contact our support team. We can verify your account, resend the magic link, or help you update your email address if needed.

- **Email:** support@calltide.com
- **Text:** Send "HELP" to your Calltide number
- **Phone:** Call us during business hours at the number in your welcome email

When you contact us, please include:

- Your business name
- The email address you're trying to log in with
- What happens when you try to log in (error message, blank page, etc.)`,
    contentEs: `# No Puedo Entrar a Mi Panel

Calltide usa enlaces mágicos para iniciar sesión. Eso significa que en vez de una contraseña, te enviamos un enlace especial a tu correo electrónico. Haces clic en el enlace y ya estás dentro. Si este proceso no te está funcionando, aquí te explicamos qué revisar.

## Cómo Funciona el Inicio de Sesión con Enlace Mágico

1. Vas a la página de inicio de sesión de Calltide.
2. Escribes tu dirección de correo electrónico y haces clic en "Enviar Enlace Mágico."
3. Te enviamos un correo con un enlace especial a tu bandeja de entrada.
4. Haces clic en el enlace del correo.
5. Ya estás dentro de tu panel.

No hay contraseña que recordar. El enlace funciona solo una vez y expira después de 15 minutos.

## Paso 1: Revisa Tu Carpeta de Spam

El problema más común es que el correo del enlace mágico terminó en tu carpeta de spam o correo no deseado. Los proveedores de correo a veces filtran correos que contienen enlaces de inicio de sesión.

**Qué hacer:**

1. Abre tu aplicación de correo (Gmail, Yahoo, Outlook, etc.).
2. Ve a tu carpeta de Spam o Correo No Deseado.
3. Busca un correo de **Calltide** o **noreply@calltide.com**.
4. Si lo encuentras, ábrelo y haz clic en el enlace de inicio de sesión.
5. Marca el correo como "No es Spam" para que los correos futuros lleguen a tu bandeja de entrada.

## Paso 2: Asegúrate de Usar el Correo Correcto

Necesitas usar la misma dirección de correo electrónico con la que te registraste. Si no estás seguro cuál es, piensa en cuál correo nos diste cuando configuraste Calltide por primera vez.

**Errores comunes:**

- Usar un correo personal en vez de uno de negocio (o al revés).
- Errores de escritura en el correo — revisa si faltan letras o si el dominio está mal (como escribir .con en vez de .com).

## Paso 3: Verifica Si el Enlace Expiró

Los enlaces mágicos expiran después de 15 minutos. Si esperaste mucho tiempo para hacer clic, el enlace ya no funcionará.

**Cómo arreglar:**

1. Regresa a la página de inicio de sesión de Calltide.
2. Ingresa tu correo de nuevo y haz clic en "Enviar Enlace Mágico."
3. Ve a tu correo de inmediato y haz clic en el nuevo enlace.
4. No esperes — haz clic tan pronto como lo veas.

## Paso 4: Prueba con un Navegador Diferente

A veces la configuración o las extensiones del navegador pueden bloquear el proceso de inicio de sesión. Si al hacer clic en el enlace mágico te lleva a una página de error o una pantalla en blanco, prueba con otro navegador.

**Qué intentar:**

- Si usas Safari, prueba con Chrome o Firefox.
- Si usas Chrome, intenta abrir una ventana de Incógnito (presiona Ctrl+Shift+N en Windows o Cmd+Shift+N en Mac).
- Borra las cookies y el caché de tu navegador, luego intenta de nuevo.

**Cómo borrar cookies en Chrome:**

1. Haz clic en los tres puntos en la esquina superior derecha.
2. Ve a Configuración > Privacidad y Seguridad > Borrar Datos de Navegación.
3. Marca "Cookies" y "Archivos e imágenes en caché."
4. Haz clic en "Borrar datos."
5. Regresa a la página de inicio de sesión de Calltide e intenta de nuevo.

## Paso 5: Revisa Tu Conexión a Internet

Si tu internet está lento o desconectado, el enlace mágico podría no cargar bien. Intenta abrir otro sitio web para asegurarte de que tu internet funcione. Si estás en tu teléfono, intenta cambiar de Wi-Fi a datos celulares (o al revés).

## ¿Todavía No Puedes Entrar?

Si intentaste todo lo anterior y aún no puedes iniciar sesión, contacta a nuestro equipo de soporte. Podemos verificar tu cuenta, reenviar el enlace mágico o ayudarte a actualizar tu dirección de correo si es necesario.

- **Correo electrónico:** support@calltide.com
- **Mensaje de texto:** Envía "AYUDA" a tu número de Calltide
- **Teléfono:** Llámanos en horario de trabajo al número que aparece en tu correo de bienvenida

Cuando nos contactes, por favor incluye:

- El nombre de tu negocio
- La dirección de correo electrónico con la que estás intentando entrar
- Qué pasa cuando intentas iniciar sesión (mensaje de error, pantalla en blanco, etc.)`,
    metaTitle: "Can't Log In to Dashboard — Calltide Help",
    metaTitleEs: "No Puedo Entrar al Panel — Ayuda Calltide",
    metaDescription:
      "Fix login issues with your Calltide dashboard. Troubleshoot magic link emails, expired links, spam folders, and browser problems.",
    metaDescriptionEs:
      "Arregla problemas de inicio de sesión en tu panel de Calltide. Soluciona enlaces mágicos, enlaces expirados, spam y problemas del navegador.",
    searchKeywords:
      "cant login, login not working, magic link, no email, password reset, dashboard access, locked out, browser issue, expired link",
    searchKeywordsEs:
      "no puedo entrar, inicio de sesión no funciona, enlace mágico, no llega correo, restablecer contraseña, acceso al panel, bloqueado, problema de navegador, enlace expirado",
    categorySlug: "troubleshooting",
    dashboardContextRoutes: [],
    sortOrder: 5,
    readingTimeMinutes: 3,
  },
];
