import type { ArticleData } from "./types";

export const articles: ArticleData[] = [
  // ───────────────────────────────────────────────
  // 1. Understanding Your Subscription
  // ───────────────────────────────────────────────
  {
    slug: "understanding-subscription",
    title: "Understanding Your Subscription",
    titleEs: "Entender Tu Suscripción",
    excerpt:
      "Learn what your Calltide subscription includes, how much it costs, and how the billing cycle works.",
    excerptEs:
      "Aprende qué incluye tu suscripción de Calltide, cuánto cuesta y cómo funciona el ciclo de facturación.",
    content: `# Understanding Your Subscription

## What You Get with Calltide

Your Calltide subscription gives your business a professional AI receptionist named Maria. She answers every call to your business phone number — day or night, weekdays and weekends, holidays included. Maria speaks both English and Spanish fluently, so she can help all of your customers.

Here is what is included in your plan:

- **24/7 live call answering** — Maria picks up every call, even at 2 AM on a Sunday.
- **Bilingual support** — She speaks English and Spanish so you never miss a lead because of a language barrier.
- **Call summaries** — After each call, you get a short summary of what the caller needed, sent to your phone or email.
- **Appointment booking** — Maria can schedule jobs on your calendar so your day stays organized.
- **Lead capture** — Every new caller's name, phone number, and job details are saved in your dashboard.
- **SMS follow-ups** — Maria can send a text to the caller to confirm the appointment or share your business info.

## How Much Does It Cost?

The Calltide plan is **$497 per month**. There are no setup fees, no per-minute charges, and no hidden costs. You pay one flat price and Maria handles all of your calls.

## Your Billing Cycle

Your billing cycle starts the day you sign up. For example, if you sign up on March 10, you will be billed on March 10 every month after that. You can see your next billing date on your dashboard under **Settings**.

## No Long-Term Contract

You are not locked into a yearly contract. Your subscription renews every month. If you ever need to cancel, you can do so before your next billing date and you will not be charged again. Your service stays active until the end of the period you already paid for.

## Is It Worth It?

Think about it this way: if Maria books even one or two extra jobs per month that you would have missed, the subscription pays for itself. Many plumbers, electricians, HVAC techs, and landscapers miss calls while they are on a job site. Those missed calls go to a competitor. With Calltide, that does not happen.

## Questions?

If you have questions about your subscription, reach out to our support team. We are happy to walk you through everything.`,
    contentEs: `# Entender Tu Suscripción

## Lo Que Incluye Calltide

Tu suscripción de Calltide le da a tu negocio una recepcionista virtual profesional llamada Maria. Ella contesta cada llamada a tu número de teléfono — de día o de noche, entre semana y fines de semana, incluyendo días festivos. Maria habla inglés y español, así que puede ayudar a todos tus clientes.

Esto es lo que incluye tu plan:

- **Contestar llamadas 24/7** — Maria contesta cada llamada, incluso a las 2 de la mañana un domingo.
- **Atención bilingüe** — Habla inglés y español para que nunca pierdas un cliente por el idioma.
- **Resúmenes de llamadas** — Después de cada llamada, recibes un resumen corto de lo que el cliente necesitaba, enviado a tu teléfono o correo.
- **Reservar citas** — Maria puede agendar trabajos en tu calendario para que tu día esté organizado.
- **Captura de clientes potenciales** — El nombre, teléfono y detalles del trabajo de cada persona que llama se guardan en tu panel de control.
- **Mensajes de texto de seguimiento** — Maria puede enviar un mensaje al cliente para confirmar la cita o compartir la información de tu negocio.

## ¿Cuánto Cuesta?

El plan de Calltide cuesta **$497 al mes**. No hay cargos de instalación, no hay cobros por minuto y no hay costos escondidos. Pagas un solo precio fijo y Maria se encarga de todas tus llamadas.

## Tu Ciclo de Facturación

Tu ciclo de facturación empieza el día que te registras. Por ejemplo, si te registras el 10 de marzo, se te cobrará el 10 de cada mes. Puedes ver la fecha de tu próximo cobro en tu panel de control en **Configuración**.

## Sin Contrato a Largo Plazo

No estás amarrado a un contrato anual. Tu suscripción se renueva cada mes. Si necesitas cancelar, puedes hacerlo antes de tu próxima fecha de cobro y no se te cobrará de nuevo. Tu servicio sigue activo hasta el final del periodo que ya pagaste.

## ¿Vale la Pena?

Piénsalo así: si Maria agenda solo uno o dos trabajos extra al mes que hubieras perdido, la suscripción se paga sola. Muchos plomeros, electricistas, técnicos de aire acondicionado y jardineros pierden llamadas mientras están en un trabajo. Esas llamadas perdidas se van con la competencia. Con Calltide, eso no pasa.

## ¿Preguntas?

Si tienes preguntas sobre tu suscripción, comunícate con nuestro equipo de soporte. Con gusto te explicamos todo.`,
    metaTitle: "Understanding Your Calltide Subscription",
    metaTitleEs: "Entender Tu Suscripción de Calltide",
    metaDescription:
      "Learn what your $497/month Calltide AI receptionist subscription includes — 24/7 bilingual call answering, lead capture, and appointment booking.",
    metaDescriptionEs:
      "Aprende qué incluye tu suscripción de $497/mes de Calltide — contestar llamadas 24/7 bilingüe, captura de clientes y reserva de citas.",
    searchKeywords:
      "subscription, plan, pricing, cost, what is included, monthly fee, $497, billing cycle, cancel, contract",
    searchKeywordsEs:
      "suscripción, plan, precio, costo, qué incluye, cuota mensual, $497, ciclo de facturación, cancelar, contrato",
    categorySlug: "billing-account",
    dashboardContextRoutes: [],
    sortOrder: 1,
    readingTimeMinutes: 2,
  },

  // ───────────────────────────────────────────────
  // 2. Billing and Charges Explained
  // ───────────────────────────────────────────────
  {
    slug: "billing-and-charges",
    title: "Billing and Charges Explained",
    titleEs: "Facturación y Cargos Explicados",
    excerpt:
      "Understand how billing works — when you are charged, what payment methods we accept, and how to read your invoice.",
    excerptEs:
      "Entiende cómo funciona la facturación — cuándo se te cobra, qué métodos de pago aceptamos y cómo leer tu factura.",
    content: `# Billing and Charges Explained

## When Are You Charged?

You are charged once per month on your billing date. Your billing date is the same day of the month that you first signed up. For example, if you signed up on January 15, you are charged on the 15th of every month.

Your card is charged automatically. You do not need to log in and pay manually each month.

## What Does the Charge Look Like?

The charge on your bank or credit card statement will show as **CALLTIDE** or **CALLTIDE AI**. The amount will be **$497.00** each month. If you see a different amount or a charge you do not recognize, contact our support team right away.

## Payment Methods We Accept

We accept the following payment methods:

- **Visa**
- **Mastercard**
- **American Express**
- **Discover**
- **Debit cards** with a Visa or Mastercard logo

We do not accept cash, checks, or bank transfers at this time. All payments are processed securely through our payment provider.

## Your Invoice and Receipt

After each payment, we send a receipt to the email address on your account. This receipt shows:

- The date of the charge
- The amount paid
- The payment method used (last 4 digits of your card)
- The service period covered

You can also find all of your past invoices in your dashboard. Go to **Settings** and look for the **Billing History** section.

## What Happens If Your Payment Fails?

If your card is declined or the payment does not go through, here is what happens:

1. **We try again** — We will try to charge your card up to 3 times over the next 7 days.
2. **You get notified** — We send you an email and a text message letting you know the payment failed.
3. **Update your card** — Log into your dashboard and update your payment method under **Settings**.
4. **Service pause** — If the payment still fails after all retries, your service will be paused. Maria will stop answering calls until the payment is resolved.

To avoid any interruption, make sure your card on file is up to date and has enough funds.

## Sales Tax

The $497 monthly fee does not include sales tax. Depending on your location in Texas, a small amount of sales tax may be added to your charge. The exact amount will show on your invoice.

## Questions About a Charge?

If you see a charge you do not understand or if something looks wrong, contact our support team. We will look into it and get back to you quickly.`,
    contentEs: `# Facturación y Cargos Explicados

## ¿Cuándo Se Te Cobra?

Se te cobra una vez al mes en tu fecha de facturación. Tu fecha de facturación es el mismo día del mes en que te registraste. Por ejemplo, si te registraste el 15 de enero, se te cobra el 15 de cada mes.

Tu tarjeta se cobra automáticamente. No necesitas entrar a tu cuenta y pagar manualmente cada mes.

## ¿Cómo Se Ve el Cargo?

El cargo en tu estado de cuenta bancario o de tarjeta de crédito aparecerá como **CALLTIDE** o **CALLTIDE AI**. El monto será de **$497.00** cada mes. Si ves un monto diferente o un cargo que no reconoces, contacta a nuestro equipo de soporte de inmediato.

## Métodos de Pago Que Aceptamos

Aceptamos los siguientes métodos de pago:

- **Visa**
- **Mastercard**
- **American Express**
- **Discover**
- **Tarjetas de débito** con logotipo de Visa o Mastercard

No aceptamos efectivo, cheques ni transferencias bancarias en este momento. Todos los pagos se procesan de forma segura a través de nuestro proveedor de pagos.

## Tu Factura y Recibo

Después de cada pago, enviamos un recibo al correo electrónico de tu cuenta. Este recibo muestra:

- La fecha del cargo
- El monto pagado
- El método de pago usado (últimos 4 dígitos de tu tarjeta)
- El periodo de servicio cubierto

También puedes encontrar todas tus facturas anteriores en tu panel de control. Ve a **Configuración** y busca la sección de **Historial de Facturación**.

## ¿Qué Pasa Si Tu Pago Falla?

Si tu tarjeta es rechazada o el pago no se procesa, esto es lo que pasa:

1. **Lo intentamos de nuevo** — Intentaremos cobrar tu tarjeta hasta 3 veces en los próximos 7 días.
2. **Te avisamos** — Te enviamos un correo electrónico y un mensaje de texto para avisarte que el pago falló.
3. **Actualiza tu tarjeta** — Entra a tu panel de control y actualiza tu método de pago en **Configuración**.
4. **Pausa del servicio** — Si el pago sigue fallando después de todos los intentos, tu servicio se pausará. Maria dejará de contestar llamadas hasta que se resuelva el pago.

Para evitar cualquier interrupción, asegúrate de que tu tarjeta registrada esté al día y tenga fondos suficientes.

## Impuesto Sobre Ventas

La cuota mensual de $497 no incluye impuesto sobre ventas. Dependiendo de tu ubicación en Texas, se puede agregar una pequeña cantidad de impuesto a tu cargo. El monto exacto aparecerá en tu factura.

## ¿Preguntas Sobre un Cargo?

Si ves un cargo que no entiendes o si algo no se ve bien, contacta a nuestro equipo de soporte. Lo revisaremos y te responderemos rápido.`,
    metaTitle: "Billing and Charges Explained | Calltide",
    metaTitleEs: "Facturación y Cargos Explicados | Calltide",
    metaDescription:
      "Learn when you are billed, what payment methods Calltide accepts, how to read your invoice, and what happens if a payment fails.",
    metaDescriptionEs:
      "Aprende cuándo se te cobra, qué métodos de pago acepta Calltide, cómo leer tu factura y qué pasa si un pago falla.",
    searchKeywords:
      "billing, charges, invoice, receipt, payment method, credit card, declined, payment failed, sales tax, statement",
    searchKeywordsEs:
      "facturación, cargos, factura, recibo, método de pago, tarjeta de crédito, rechazada, pago fallido, impuesto, estado de cuenta",
    categorySlug: "billing-account",
    dashboardContextRoutes: [],
    sortOrder: 2,
    readingTimeMinutes: 2,
  },

  // ───────────────────────────────────────────────
  // 3. Updating Your Payment Method
  // ───────────────────────────────────────────────
  {
    slug: "update-payment-method",
    title: "Updating Your Payment Method",
    titleEs: "Actualizar Tu Método de Pago",
    excerpt:
      "Step-by-step instructions for changing the credit or debit card on your Calltide account.",
    excerptEs:
      "Instrucciones paso a paso para cambiar la tarjeta de crédito o débito en tu cuenta de Calltide.",
    content: `# Updating Your Payment Method

## Why Update Your Card?

There are a few common reasons you might need to update your payment method:

- Your old card expired and you got a new one.
- Your bank sent you a replacement card with a new number.
- You want to switch to a different card.
- Your last payment failed and you need to fix it.

Whatever the reason, updating your card takes less than two minutes.

## How to Update Your Card — Step by Step

Follow these steps to change the card on file:

1. **Log into your dashboard** — Use the magic link sent to your email or phone to sign in.
2. **Go to Settings** — Click on **Settings** in the menu on the left side of the screen.
3. **Find the Payment section** — Scroll down until you see **Payment Method**.
4. **Click "Update Card"** — You will see a button that says **Update Card** or **Change Payment Method**. Click it.
5. **Enter your new card details** — Type in your new card number, the expiration date, and the security code (CVV) on the back of the card.
6. **Save your changes** — Click **Save** or **Update**. You will see a message that says your card has been updated.

That is it. Your new card will be used for all future charges.

## What Happens After You Update

- Your next monthly charge will go to the new card.
- If you had a failed payment, we will try to charge the new card within 24 hours.
- You will get an email confirming that your payment method was updated.

## What If Your Payment Already Failed?

If your last payment did not go through and your service is paused, updating your card will fix it. Once the new card is saved, we will try to process the missed payment. When the payment goes through, Maria will start answering your calls again right away.

Here is the timeline:

1. You update your card in **Settings**.
2. We charge the new card within 24 hours.
3. If the charge is successful, your service is reactivated immediately.
4. You get an email and text confirming everything is back to normal.

## Tips for Avoiding Payment Issues

- **Set a reminder** — When you get a new card, update it in Calltide right away.
- **Check your expiration date** — Cards usually expire every 3 to 5 years. Update before it expires.
- **Use a card with enough funds** — Make sure the card has at least $497 available on your billing date.
- **Keep your email current** — We send payment failure alerts to your email, so make sure it is up to date.

## Need Help?

If you run into any problems updating your card, our support team can help. Reach out and we will walk you through it.`,
    contentEs: `# Actualizar Tu Método de Pago

## ¿Por Qué Actualizar Tu Tarjeta?

Hay varias razones comunes por las que podrías necesitar actualizar tu método de pago:

- Tu tarjeta anterior venció y recibiste una nueva.
- Tu banco te envió una tarjeta de reemplazo con un número nuevo.
- Quieres cambiar a una tarjeta diferente.
- Tu último pago falló y necesitas arreglarlo.

Sea cual sea la razón, actualizar tu tarjeta toma menos de dos minutos.

## Cómo Actualizar Tu Tarjeta — Paso a Paso

Sigue estos pasos para cambiar la tarjeta registrada:

1. **Entra a tu panel de control** — Usa el enlace mágico enviado a tu correo o teléfono para iniciar sesión.
2. **Ve a Configuración** — Haz clic en **Configuración** en el menú del lado izquierdo de la pantalla.
3. **Busca la sección de Pago** — Desplázate hacia abajo hasta que veas **Método de Pago**.
4. **Haz clic en "Actualizar Tarjeta"** — Verás un botón que dice **Actualizar Tarjeta** o **Cambiar Método de Pago**. Haz clic.
5. **Ingresa los datos de tu nueva tarjeta** — Escribe el número de tu nueva tarjeta, la fecha de vencimiento y el código de seguridad (CVV) en la parte de atrás de la tarjeta.
6. **Guarda tus cambios** — Haz clic en **Guardar** o **Actualizar**. Verás un mensaje que dice que tu tarjeta ha sido actualizada.

Eso es todo. Tu nueva tarjeta se usará para todos los cargos futuros.

## Qué Pasa Después de Actualizar

- Tu próximo cargo mensual irá a la nueva tarjeta.
- Si tuviste un pago fallido, intentaremos cobrar la nueva tarjeta dentro de 24 horas.
- Recibirás un correo confirmando que tu método de pago fue actualizado.

## ¿Qué Pasa Si Tu Pago Ya Falló?

Si tu último pago no se procesó y tu servicio está pausado, actualizar tu tarjeta lo arreglará. Una vez que la nueva tarjeta esté guardada, intentaremos procesar el pago pendiente. Cuando el pago se procese, Maria empezará a contestar tus llamadas de nuevo inmediatamente.

Este es el proceso:

1. Actualizas tu tarjeta en **Configuración**.
2. Cobramos la nueva tarjeta dentro de 24 horas.
3. Si el cargo es exitoso, tu servicio se reactiva de inmediato.
4. Recibes un correo y mensaje de texto confirmando que todo está de vuelta a la normalidad.

## Consejos Para Evitar Problemas de Pago

- **Pon un recordatorio** — Cuando recibas una tarjeta nueva, actualízala en Calltide de inmediato.
- **Revisa tu fecha de vencimiento** — Las tarjetas generalmente vencen cada 3 a 5 años. Actualiza antes de que expire.
- **Usa una tarjeta con fondos suficientes** — Asegúrate de que la tarjeta tenga al menos $497 disponibles en tu fecha de cobro.
- **Mantén tu correo actualizado** — Enviamos alertas de pagos fallidos a tu correo, así que asegúrate de que esté al día.

## ¿Necesitas Ayuda?

Si tienes problemas al actualizar tu tarjeta, nuestro equipo de soporte te puede ayudar. Contáctanos y te guiamos paso a paso.`,
    metaTitle: "Update Your Payment Method | Calltide",
    metaTitleEs: "Actualizar Tu Método de Pago | Calltide",
    metaDescription:
      "Step-by-step guide to updating your credit or debit card on Calltide. Fix failed payments and keep your AI receptionist running.",
    metaDescriptionEs:
      "Guía paso a paso para actualizar tu tarjeta en Calltide. Arregla pagos fallidos y mantén tu recepcionista AI funcionando.",
    searchKeywords:
      "update card, change payment, new card, expired card, payment failed, fix payment, credit card, debit card, settings",
    searchKeywordsEs:
      "actualizar tarjeta, cambiar pago, tarjeta nueva, tarjeta vencida, pago fallido, arreglar pago, tarjeta de crédito, tarjeta de débito, configuración",
    categorySlug: "billing-account",
    dashboardContextRoutes: ["/dashboard/settings"],
    sortOrder: 3,
    readingTimeMinutes: 2,
  },

  // ───────────────────────────────────────────────
  // 4. The Referral Program — Earn Free Months
  // ───────────────────────────────────────────────
  {
    slug: "referral-program",
    title: "The Referral Program — Earn Free Months",
    titleEs: "El Programa de Referidos — Gana Meses Gratis",
    excerpt:
      "Refer another home service business to Calltide and earn a $497 credit — that is a full free month of service.",
    excerptEs:
      "Refiere a otro negocio de servicios del hogar a Calltide y gana un crédito de $497 — eso es un mes completo gratis.",
    content: `# The Referral Program — Earn Free Months

## How the Referral Program Works

When you love a service, you tell your friends about it. We want to reward you for that. Our referral program is simple: for every home service business that signs up with your referral code, you earn a **$497 credit**. That is one full month of Calltide for free.

There is no limit to how many people you can refer. Refer five businesses and you get five free months. It is that simple.

## Who Can You Refer?

You can refer any home service business owner in Texas. This includes:

- Plumbers
- HVAC technicians
- Electricians
- Landscapers
- Roofers
- Painters
- Pest control companies
- General contractors
- Cleaning services

The business just needs to be a new Calltide customer. If they are already using Calltide, the referral will not count.

## How to Earn Your Credit — Step by Step

1. **Find your referral code** — Log into your dashboard and go to the **Referrals** page. Your unique referral code is displayed there.
2. **Share your code** — Give your code to another business owner. You can text it, email it, or just tell them in person.
3. **They sign up** — The other business owner signs up for Calltide and enters your referral code during registration.
4. **They stay active for 30 days** — The referred business needs to be an active, paying customer for at least 30 days.
5. **You get your credit** — Once the 30 days pass, a $497 credit is automatically applied to your account.

## When Does the Credit Apply?

Your credit is applied to your next billing cycle. If you already paid for the current month, the credit will cover your next month. You do not need to do anything — it happens automatically.

If you have multiple credits, they stack. So if you referred two businesses in the same month, you will get two months free back to back.

## Tracking Your Referrals

You can see all of your referrals on the **Referrals** page in your dashboard. For each referral, you will see:

- The name of the business you referred
- The date they signed up
- Their status (pending or confirmed)
- Whether your credit has been applied

**Pending** means the referred business signed up but has not completed their 30 active days yet. **Confirmed** means the 30 days passed and your credit is on the way.

## Tips for Getting More Referrals

- **Talk to business owners you know** — If you are at a job site and another trade is working there too, mention Calltide.
- **Share your results** — Tell them how many calls Maria answered for you last month. Real numbers are convincing.
- **Mention the bilingual feature** — Many Hispanic business owners in Texas need a receptionist who speaks both English and Spanish. That is a huge selling point.

## Questions?

If you have questions about the referral program or a referral that has not been credited, contact our support team.`,
    contentEs: `# El Programa de Referidos — Gana Meses Gratis

## Cómo Funciona el Programa de Referidos

Cuando te gusta un servicio, se lo cuentas a tus amigos. Nosotros queremos premiarte por eso. Nuestro programa de referidos es simple: por cada negocio de servicios del hogar que se registre con tu código de referido, ganas un **crédito de $497**. Eso es un mes completo de Calltide gratis.

No hay límite en cuántas personas puedes referir. Refiere cinco negocios y obtienes cinco meses gratis. Así de fácil.

## ¿A Quién Puedes Referir?

Puedes referir a cualquier dueño de un negocio de servicios del hogar en Texas. Esto incluye:

- Plomeros
- Técnicos de aire acondicionado (HVAC)
- Electricistas
- Jardineros y paisajistas
- Techadores
- Pintores
- Empresas de control de plagas
- Contratistas generales
- Servicios de limpieza

El negocio solo necesita ser un cliente nuevo de Calltide. Si ya están usando Calltide, el referido no contará.

## Cómo Ganar Tu Crédito — Paso a Paso

1. **Encuentra tu código de referido** — Entra a tu panel de control y ve a la página de **Referidos**. Tu código único de referido está ahí.
2. **Comparte tu código** — Dale tu código a otro dueño de negocio. Puedes enviarlo por mensaje de texto, correo electrónico, o simplemente decírselo en persona.
3. **Ellos se registran** — El otro dueño de negocio se registra en Calltide e ingresa tu código de referido durante el registro.
4. **Se mantienen activos por 30 días** — El negocio referido necesita ser un cliente activo y pagando por al menos 30 días.
5. **Recibes tu crédito** — Una vez que pasan los 30 días, un crédito de $497 se aplica automáticamente a tu cuenta.

## ¿Cuándo Se Aplica el Crédito?

Tu crédito se aplica a tu próximo ciclo de facturación. Si ya pagaste el mes actual, el crédito cubrirá tu próximo mes. No necesitas hacer nada — pasa automáticamente.

Si tienes múltiples créditos, se acumulan. Así que si referiste dos negocios en el mismo mes, obtendrás dos meses gratis seguidos.

## Seguimiento de Tus Referidos

Puedes ver todos tus referidos en la página de **Referidos** en tu panel de control. Para cada referido, verás:

- El nombre del negocio que referiste
- La fecha en que se registraron
- Su estado (pendiente o confirmado)
- Si tu crédito ha sido aplicado

**Pendiente** significa que el negocio referido se registró pero no ha completado sus 30 días activos. **Confirmado** significa que los 30 días pasaron y tu crédito está en camino.

## Consejos Para Conseguir Más Referidos

- **Habla con dueños de negocios que conoces** — Si estás en un trabajo y otro oficio está trabajando ahí también, menciona Calltide.
- **Comparte tus resultados** — Cuéntales cuántas llamadas contestó Maria por ti el mes pasado. Los números reales convencen.
- **Menciona la función bilingüe** — Muchos dueños de negocios hispanos en Texas necesitan una recepcionista que hable inglés y español. Ese es un punto de venta enorme.

## ¿Preguntas?

Si tienes preguntas sobre el programa de referidos o un referido que no se ha acreditado, contacta a nuestro equipo de soporte.`,
    metaTitle: "Referral Program — Earn Free Months | Calltide",
    metaTitleEs: "Programa de Referidos — Meses Gratis | Calltide",
    metaDescription:
      "Refer a home service business to Calltide and earn a $497 credit — one free month per referral. No limit on how many you can earn.",
    metaDescriptionEs:
      "Refiere un negocio de servicios del hogar a Calltide y gana un crédito de $497 — un mes gratis por referido. Sin límite.",
    searchKeywords:
      "referral, refer a friend, free month, credit, referral code, earn, reward, share, discount, program",
    searchKeywordsEs:
      "referido, referir amigo, mes gratis, crédito, código de referido, ganar, recompensa, compartir, descuento, programa",
    categorySlug: "billing-account",
    dashboardContextRoutes: ["/dashboard/referrals"],
    sortOrder: 4,
    readingTimeMinutes: 2,
  },

  // ───────────────────────────────────────────────
  // 5. Using Your Referral Code
  // ───────────────────────────────────────────────
  {
    slug: "using-referral-code",
    title: "Using Your Referral Code",
    titleEs: "Usar Tu Código de Referido",
    excerpt:
      "Learn where to find your unique referral code, how to share it, and what the referred business gets.",
    excerptEs:
      "Aprende dónde encontrar tu código único de referido, cómo compartirlo y qué recibe el negocio referido.",
    content: `# Using Your Referral Code

## Where to Find Your Referral Code

Every Calltide customer gets a unique referral code. To find yours:

1. Log into your Calltide dashboard.
2. Click on **Referrals** in the left menu.
3. Your referral code is displayed at the top of the page in a large box.

Your code is a short combination of letters and numbers, like **MARIA-JPLUMB** or **CT-7892**. It is unique to your account and does not change.

## How to Share Your Code

You can share your referral code in several ways:

### Text Message
The easiest way is to send a quick text. Here is an example you can copy and paste:

> "Hey, I have been using this AI receptionist for my business and it is great. She answers all my calls in English and Spanish 24/7. Use my code [YOUR CODE] when you sign up and we both benefit. Check it out: calltide.com"

### In Person
If you are talking to another business owner at a job site, a supply house, or a networking event, just tell them your code. It is short enough to remember.

### Email
You can also email your code. This works well if you are part of a local business group or trade association.

### Social Media
Post about your experience with Calltide on Facebook, Instagram, or in local business groups. Include your referral code in the post.

## What Does the Referred Business Get?

When another business owner signs up using your referral code, they get a benefit too. The referred business receives a **discount on their first month**. This makes it easier for them to try Calltide with less risk.

Here is how it works for them:

1. They go to calltide.com and start the sign-up process.
2. During registration, they enter your referral code in the **Referral Code** field.
3. The discount is automatically applied to their first invoice.
4. They get full access to Calltide from day one — Maria starts answering their calls right away.

## What Do You Get?

When the business you referred stays active for 30 days, you earn a **$497 credit**. That credit is applied to your next billing cycle, giving you a full free month. You can track the status of each referral on your **Referrals** page.

## Common Questions

### Can I refer a business that already uses Calltide?
No. The referral code only works for new customers who have never had a Calltide account.

### Is there a limit to how many people I can refer?
No. You can refer as many businesses as you want. Each successful referral earns you one free month.

### What if someone signs up but forgets to use my code?
If they forgot to enter your code during sign-up, have them contact our support team within 7 days of registration. We can manually add the referral code if the account is still within the first week.

### Can I use my own referral code to create a second account?
No. Referral codes cannot be used by the same person or business that owns the code. This is to keep the program fair for everyone.

### How long does my referral code last?
Your referral code does not expire. You can use it for as long as you are a Calltide customer.

## Need Help?

If your referral code is not working or you have questions about how to share it, reach out to our support team. We are here to help.`,
    contentEs: `# Usar Tu Código de Referido

## Dónde Encontrar Tu Código de Referido

Cada cliente de Calltide recibe un código de referido único. Para encontrar el tuyo:

1. Entra a tu panel de control de Calltide.
2. Haz clic en **Referidos** en el menú de la izquierda.
3. Tu código de referido se muestra en la parte superior de la página en un cuadro grande.

Tu código es una combinación corta de letras y números, como **MARIA-JPLUMB** o **CT-7892**. Es único para tu cuenta y no cambia.

## Cómo Compartir Tu Código

Puedes compartir tu código de referido de varias maneras:

### Mensaje de Texto
La forma más fácil es enviar un mensaje de texto rápido. Aquí tienes un ejemplo que puedes copiar y pegar:

> "Oye, he estado usando esta recepcionista de inteligencia artificial para mi negocio y es muy buena. Contesta todas mis llamadas en inglés y español las 24 horas. Usa mi código [TU CÓDIGO] cuando te registres y los dos ganamos. Míralo aquí: calltide.com"

### En Persona
Si estás hablando con otro dueño de negocio en un trabajo, en una tienda de materiales o en un evento, simplemente dile tu código. Es lo suficientemente corto para recordar.

### Correo Electrónico
También puedes enviar tu código por correo. Esto funciona bien si eres parte de un grupo local de negocios o asociación de oficios.

### Redes Sociales
Publica sobre tu experiencia con Calltide en Facebook, Instagram o en grupos locales de negocios. Incluye tu código de referido en la publicación.

## ¿Qué Recibe el Negocio Referido?

Cuando otro dueño de negocio se registra usando tu código de referido, ellos también reciben un beneficio. El negocio referido recibe un **descuento en su primer mes**. Esto les facilita probar Calltide con menos riesgo.

Así funciona para ellos:

1. Van a calltide.com y comienzan el proceso de registro.
2. Durante el registro, ingresan tu código de referido en el campo de **Código de Referido**.
3. El descuento se aplica automáticamente a su primera factura.
4. Obtienen acceso completo a Calltide desde el primer día — Maria empieza a contestar sus llamadas de inmediato.

## ¿Qué Recibes Tú?

Cuando el negocio que referiste se mantiene activo por 30 días, ganas un **crédito de $497**. Ese crédito se aplica a tu próximo ciclo de facturación, dándote un mes completo gratis. Puedes rastrear el estado de cada referido en tu página de **Referidos**.

## Preguntas Frecuentes

### ¿Puedo referir un negocio que ya usa Calltide?
No. El código de referido solo funciona para clientes nuevos que nunca han tenido una cuenta de Calltide.

### ¿Hay un límite de cuántas personas puedo referir?
No. Puedes referir a tantos negocios como quieras. Cada referido exitoso te da un mes gratis.

### ¿Qué pasa si alguien se registra pero olvida usar mi código?
Si olvidaron ingresar tu código durante el registro, diles que contacten a nuestro equipo de soporte dentro de los 7 días del registro. Podemos agregar manualmente el código de referido si la cuenta aún está dentro de la primera semana.

### ¿Puedo usar mi propio código de referido para crear una segunda cuenta?
No. Los códigos de referido no pueden ser usados por la misma persona o negocio que es dueño del código. Esto es para mantener el programa justo para todos.

### ¿Cuánto tiempo dura mi código de referido?
Tu código de referido no expira. Puedes usarlo mientras seas cliente de Calltide.

## ¿Necesitas Ayuda?

Si tu código de referido no funciona o tienes preguntas sobre cómo compartirlo, comunícate con nuestro equipo de soporte. Estamos aquí para ayudarte.`,
    metaTitle: "Using Your Referral Code | Calltide",
    metaTitleEs: "Usar Tu Código de Referido | Calltide",
    metaDescription:
      "Find your Calltide referral code, learn how to share it, and see what the referred business gets. Earn free months for every referral.",
    metaDescriptionEs:
      "Encuentra tu código de referido de Calltide, aprende cómo compartirlo y mira qué recibe el negocio referido. Gana meses gratis.",
    searchKeywords:
      "referral code, share code, find code, refer, friend, free month, discount, new customer, sign up, how to refer",
    searchKeywordsEs:
      "código de referido, compartir código, encontrar código, referir, amigo, mes gratis, descuento, cliente nuevo, registrarse, cómo referir",
    categorySlug: "billing-account",
    dashboardContextRoutes: ["/dashboard/referrals"],
    sortOrder: 5,
    readingTimeMinutes: 2,
  },
];
