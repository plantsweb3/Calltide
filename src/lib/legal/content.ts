// Legal document content strings and sub-processor data
// Extracted from /api/compliance/seed to allow reuse across the codebase

export const SUB_PROCESSORS = [
  { name: "Twilio", purpose: "Call routing, SMS delivery, phone number management", dataProcessed: ["phone_numbers", "sms_content", "call_metadata"], location: "United States", dpaUrl: "https://www.twilio.com/legal/data-protection-addendum" },
  { name: "Hume AI", purpose: "Voice AI processing for AI receptionist", dataProcessed: ["call_audio", "voice_data", "transcripts"], location: "United States", dpaUrl: "https://www.hume.ai/privacy" },
  { name: "Anthropic", purpose: "AI intelligence and natural language processing", dataProcessed: ["transcript_text", "conversation_context"], location: "United States", dpaUrl: "https://www.anthropic.com/legal/data-processing-agreement" },
  { name: "Turso (LibSQL)", purpose: "Database storage", dataProcessed: ["all_structured_data", "pii"], location: "United States", dpaUrl: "https://turso.tech/privacy-policy" },
  { name: "Vercel", purpose: "Application hosting and serverless functions", dataProcessed: ["request_logs", "ip_addresses"], location: "United States", dpaUrl: "https://vercel.com/legal/dpa" },
  { name: "Resend", purpose: "Email delivery", dataProcessed: ["email_addresses", "email_content"], location: "United States", dpaUrl: "https://resend.com/legal/dpa" },
  { name: "Stripe", purpose: "Payment processing and subscription management", dataProcessed: ["payment_details", "billing_information", "email_addresses"], location: "United States", dpaUrl: "https://stripe.com/legal/dpa" },
  { name: "Sentry", purpose: "Error monitoring and performance tracking", dataProcessed: ["error_logs", "performance_data"], location: "United States", dpaUrl: "https://sentry.io/legal/dpa/" },
] as const;

export const TOS_EN = `# Terms of Service

**Effective Date:** March 3, 2026

These Terms of Service ("Terms") constitute a legally binding agreement between you ("Client," "you," or "your") and Capta LLC ("Capta," "we," "us," or "our"). By subscribing to or using the Capta platform, you agree to be bound by these Terms.

## 1. Service Description

Capta provides an AI-powered virtual receptionist platform designed for home service businesses. The Service includes:

- **AI Voice Receptionist:** An artificial intelligence agent ("Maria") that answers inbound phone calls in English and Spanish on behalf of your business, 24 hours a day, 7 days a week.
- **Appointment Scheduling:** Automated appointment booking integrated with your business calendar, including SMS confirmations to both your team and the caller.
- **Call Transcription and Summaries:** AI-generated transcripts, sentiment analysis, and call summaries for every call handled.
- **SMS Notifications:** Real-time text message alerts for new bookings, emergency calls, and missed call recovery.
- **Client Dashboard:** A web-based portal for viewing call history, managing appointments, reviewing transcripts, managing billing, and configuring your AI receptionist.
- **Emergency Detection and Routing:** Automatic detection of emergency situations with immediate SMS escalation to the business owner.
- **CRM and Estimate Pipeline:** Customer relationship management tools including customer profiles, estimate tracking, and follow-up automation.
- **Billing and Subscription Management:** Stripe-powered billing, invoice history, and self-service payment management.

## 2. AI Disclosure

**The Capta receptionist is an artificial intelligence system, not a human.** By using the Service, you acknowledge and agree that:

- Callers to your business phone number will interact with an AI agent.
- The AI agent will identify itself as an AI assistant when asked directly.
- AI-generated responses, summaries, and classifications may contain errors or inaccuracies.
- You are responsible for reviewing AI-generated content (call summaries, sentiment scores, booking details) for accuracy before relying on it for business decisions.
- Capta does not guarantee that the AI will correctly interpret every caller's intent, language, or emergency situation.

## 3. Eligibility and Account Registration

To use Capta, you must:

- Be at least 18 years of age.
- Be a legally authorized representative of a business entity or sole proprietorship.
- Provide accurate, current, and complete registration information.
- Maintain the security of your account credentials.

You are responsible for all activity that occurs under your account.

## 4. Subscription and Payment

### 4.1 Pricing
The Service is offered at $497.00 per month, which includes all features described in Section 1. Annual billing is available at $397.00 per month (billed as $4,764.00 annually). Additional business locations may be added at $197.00 per month each.

### 4.2 Billing
Payments are processed through Stripe, Inc. By subscribing, you authorize Capta to charge your designated payment method on a recurring basis. All fees are quoted in U.S. dollars.

### 4.3 Failed Payments
If a payment fails, Capta will attempt to recover the payment over a 7-day grace period using a combination of email and SMS reminders. If payment is not recovered within the grace period, your account may be suspended or terminated.

### 4.4 Refunds
Capta offers a 30-day money-back guarantee for new subscribers. If you are not satisfied within the first 30 days of your paid subscription, contact us for a full refund. After 30 days, subscription fees are non-refundable, but you may cancel at any time to prevent future charges.

### 4.5 Price Changes
Capta may change subscription pricing with 30 days' written notice. Price changes will not affect your current billing period.

## 5. Acceptable Use

You agree to use the Service only for lawful business purposes. You may not:

- Use the Service for any unlawful, fraudulent, or deceptive purpose.
- Use the Service to make or facilitate robocalls, spam, or unsolicited telemarketing.
- Provide false or misleading business information to the AI receptionist's configuration.
- Attempt to reverse-engineer, decompile, or extract the source code of the Service.
- Interfere with or disrupt the integrity or performance of the Service.
- Use the Service to collect, store, or process data in violation of applicable privacy laws.
- Resell, sublicense, or redistribute the Service without written permission.
- Attempt to manipulate the AI system through prompt injection or adversarial inputs.

Violation of this section may result in immediate suspension or termination of your account.

## 6. Telephone Consumer Protection Act (TCPA) Compliance

### 6.1 Your Obligations
You are responsible for ensuring that your use of the Service complies with the Telephone Consumer Protection Act (TCPA), state telemarketing laws, and all applicable regulations governing automated calls and text messages. This includes:

- Obtaining proper consent from your customers before Capta sends SMS messages on your behalf.
- Honoring opt-out requests promptly.
- Maintaining records of consent.

### 6.2 Capta's TCPA Measures
Capta maintains SMS consent tracking and honors STOP keyword opt-outs automatically. However, you remain ultimately responsible for the lawfulness of communications sent through your account.

## 7. Data Handling and Privacy

Your use of the Service is subject to our [Privacy Policy](/legal/privacy) and, where applicable, our [Data Processing Agreement](/legal/dpa). Key points:

- Call recordings and transcripts are stored for 12 months, then automatically deleted.
- Call metadata is retained for 24 months.
- SMS content is retained for 6 months.
- Consent records are retained for 7 years.
- You may request data export or deletion at any time through the DSAR process described in our Privacy Policy.

## 8. Intellectual Property

### 8.1 Capta's IP
The Service, including all software, AI models, algorithms, designs, and documentation, is owned by Capta and protected by intellectual property laws. These Terms do not grant you any ownership rights in the Service.

### 8.2 Your Data
You retain ownership of all data you provide to the Service ("Client Data"), including business information, customer records, and configuration settings. You grant Capta a limited, non-exclusive license to process Client Data solely for the purpose of providing the Service.

### 8.3 Aggregated Data
Capta may use aggregated, anonymized data derived from the Service (e.g., average call durations, booking rates across industries) for product improvement, benchmarking, and marketing. This data will never identify you or your customers individually.

## 9. Service Level and Availability

Capta targets 99.9% uptime for the core voice answering service. Planned maintenance will be communicated at least 24 hours in advance. In the event of service disruptions, Capta maintains a voicemail fallback system so callers can still leave messages. A real-time status page is available at [captahq.com/status](/status).

Capta does not guarantee uninterrupted or error-free service. The Service depends on third-party providers (Twilio, Hume AI, etc.) whose availability is outside Capta's direct control.

## 10. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAPTA'S TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID TO CAPTA IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

IN NO EVENT SHALL CAPTA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOST PROFITS, LOST REVENUE, LOST BUSINESS OPPORTUNITIES, OR LOSS OF DATA, REGARDLESS OF THE CAUSE OF ACTION OR THE THEORY OF LIABILITY.

CAPTA IS NOT LIABLE FOR:
- Missed calls, incorrect bookings, or scheduling errors caused by AI misinterpretation.
- Business losses resulting from service downtime or degraded performance.
- Damages arising from the actions or inactions of third-party service providers.
- Inaccurate call summaries, sentiment analysis, or lead qualification scores.

## 11. Indemnification

You agree to indemnify, defend, and hold harmless Capta and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney's fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any applicable law; or (d) any claim that your Client Data infringes the rights of a third party.

## 12. Term and Termination

### 12.1 Term
These Terms are effective from the date you create your account and continue until terminated.

### 12.2 Termination by You
You may cancel your subscription at any time through the billing section of your dashboard or by contacting support@captahq.com. Cancellation takes effect at the end of the current billing period.

### 12.3 Termination by Capta
Capta may suspend or terminate your account immediately if you: (a) violate these Terms; (b) fail to pay fees after the grace period; (c) engage in fraudulent or illegal activity; or (d) use the Service in a manner that threatens the security or integrity of the platform.

### 12.4 Effect of Termination
Upon termination, your access to the Service will be disabled. Capta will retain your data for 30 days following termination to allow for data export. After 30 days, your data will be permanently deleted in accordance with our data retention policies.

## 13. Dispute Resolution

### 13.1 Governing Law
These Terms are governed by and construed in accordance with the laws of the State of Texas, without regard to conflict of law principles.

### 13.2 Informal Resolution
Before initiating formal proceedings, both parties agree to attempt to resolve disputes informally by contacting the other party. Capta can be reached at legal@captahq.com.

### 13.3 Binding Arbitration
Any dispute not resolved informally within 30 days shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The arbitration shall take place in Bexar County, Texas, and the arbitrator's award shall be final and binding.

### 13.4 Class Action Waiver
YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.

## 14. General Provisions

### 14.1 Entire Agreement
These Terms, together with the Privacy Policy and DPA, constitute the entire agreement between you and Capta regarding the Service.

### 14.2 Modifications
Capta may modify these Terms at any time. Material changes will be communicated via email and/or a prominent notice on the dashboard at least 30 days before taking effect. Your continued use of the Service after the effective date constitutes acceptance. If you disagree with any changes, you may cancel your subscription.

### 14.3 Severability
If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

### 14.4 Assignment
You may not assign or transfer these Terms without Capta's written consent. Capta may assign these Terms in connection with a merger, acquisition, or sale of assets.

### 14.5 Force Majeure
Capta shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including natural disasters, acts of government, telecommunications failures, or third-party service outages.

## 15. Contact Information

Capta LLC
Email: support@captahq.com
Legal inquiries: legal@captahq.com
Phone: (830) 521-7133`;

export const TOS_ES = `# Términos de Servicio

**Fecha Efectiva:** 3 de marzo de 2026

Estos Términos de Servicio ("Términos") constituyen un acuerdo legalmente vinculante entre usted ("Cliente," "usted," o "su") y Capta LLC ("Capta," "nosotros," "nos," u "nuestro"). Al suscribirse o utilizar la plataforma de Capta, usted acepta estar vinculado por estos Términos.

## 1. Descripción del Servicio

Capta proporciona una plataforma de recepcionista virtual impulsada por inteligencia artificial diseñada para empresas de servicios del hogar. El Servicio incluye:

- **Recepcionista de Voz con IA:** Un agente de inteligencia artificial ("Maria") que contesta llamadas telefónicas entrantes en inglés y español en nombre de su negocio, 24 horas al día, 7 días a la semana.
- **Programación de Citas:** Reserva de citas automatizada integrada con el calendario de su negocio, incluidas confirmaciones por SMS tanto para su equipo como para la persona que llama.
- **Transcripción y Resúmenes de Llamadas:** Transcripciones generadas por IA, análisis de sentimiento y resúmenes de llamadas para cada llamada manejada.
- **Notificaciones por SMS:** Alertas de mensajes de texto en tiempo real para nuevas reservas, llamadas de emergencia y recuperación de llamadas perdidas.
- **Panel de Control del Cliente:** Un portal basado en web para ver el historial de llamadas, administrar citas, revisar transcripciones, gestionar facturación y configurar su recepcionista de IA.
- **Detección y Enrutamiento de Emergencias:** Detección automática de situaciones de emergencia con escalamiento inmediato por SMS al propietario del negocio.
- **CRM y Cartera de Presupuestos:** Herramientas de gestión de relaciones con clientes que incluyen perfiles de clientes, seguimiento de presupuestos y automatización de seguimiento.
- **Facturación y Gestión de Suscripciones:** Facturación impulsada por Stripe, historial de facturas y gestión de pagos de autoservicio.

## 2. Divulgación de IA

**El recepcionista de Capta es un sistema de inteligencia artificial, no un humano.** Al utilizar el Servicio, usted reconoce y acepta que:

- Las personas que llamen al número de teléfono de su negocio interactuarán con un agente de IA.
- El agente de IA se identificará a sí mismo como un asistente de IA cuando se le pregunte directamente.
- Las respuestas, resúmenes y clasificaciones generadas por IA pueden contener errores o inexactitudes.
- Usted es responsable de revisar el contenido generado por IA (resúmenes de llamadas, puntuaciones de sentimiento, detalles de reservas) para verificar su precisión antes de confiar en él para decisiones comerciales.
- Capta no garantiza que la IA interprete correctamente la intención de cada persona que llama, su idioma o situación de emergencia.

## 3. Elegibilidad y Registro de Cuenta

Para usar Capta, debe:

- Tener al menos 18 años de edad.
- Ser un representante autorizado legalmente de una entidad comercial o empresa unipersonal.
- Proporcionar información de registro precisa, actual y completa.
- Mantener la seguridad de las credenciales de su cuenta.

Usted es responsable de toda la actividad que ocurra bajo su cuenta.

## 4. Suscripción y Pago

### 4.1 Precios
El Servicio se ofrece a $497.00 por mes, que incluye todas las funciones descritas en la Sección 1. La facturación anual está disponible a $397.00 por mes (facturado como $4,764.00 anuales). Se pueden agregar ubicaciones comerciales adicionales a $197.00 por mes cada una.

### 4.2 Facturación
Los pagos se procesan a través de Stripe, Inc. Al suscribirse, usted autoriza a Capta a cargar su método de pago designado de manera recurrente. Todas las tarifas se cotizan en dólares estadounidenses.

### 4.3 Pagos Fallidos
Si un pago falla, Capta intentará recuperar el pago durante un período de gracia de 7 días utilizando una combinación de recordatorios por correo electrónico y SMS. Si el pago no se recupera dentro del período de gracia, su cuenta puede ser suspendida o terminada.

### 4.4 Reembolsos
Capta ofrece una garantía de devolución de dinero de 30 días para nuevos suscriptores. Si no está satisfecho dentro de los primeros 30 días de su suscripción de pago, comuníquese con nosotros para obtener un reembolso completo. Después de 30 días, las tarifas de suscripción no son reembolsables, pero puede cancelar en cualquier momento para evitar cargos futuros.

### 4.5 Cambios de Precio
Capta puede cambiar el precio de la suscripción con 30 días de notificación escrita. Los cambios de precio no afectarán su período de facturación actual.

## 5. Uso Aceptable

Usted acepta utilizar el Servicio únicamente con propósitos comerciales lícitos. Usted no puede:

- Utilizar el Servicio para ningún propósito ilícito, fraudulento o engañoso.
- Utilizar el Servicio para hacer o facilitar llamadas robóticas, correo no deseado o telemarketing no solicitado.
- Proporcionar información comercial falsa o engañosa a la configuración del recepcionista de IA.
- Intentar realizar ingeniería inversa, descompilar o extraer el código fuente del Servicio.
- Interferir o interrumpir la integridad o el rendimiento del Servicio.
- Utilizar el Servicio para recopilar, almacenar o procesar datos en violación de las leyes de privacidad aplicables.
- Revender, sublicenciar o redistribuir el Servicio sin permiso escrito.
- Intentar manipular el sistema de IA mediante inyección de indicaciones o entradas adversariales.

La violación de esta sección puede resultar en la suspensión o terminación inmediata de su cuenta.

## 6. Cumplimiento de la Ley de Protección del Consumidor Telefónico (TCPA)

### 6.1 Sus Obligaciones
Usted es responsable de garantizar que su uso del Servicio cumpla con la Ley de Protección del Consumidor Telefónico (TCPA), las leyes estatales de telemarketing y todas las regulaciones aplicables que rigen las llamadas y mensajes de texto automatizados. Esto incluye:

- Obtener el consentimiento apropiado de sus clientes antes de que Capta envíe mensajes SMS en su nombre.
- Respetar las solicitudes de exclusión rápidamente.
- Mantener registros de consentimiento.

### 6.2 Medidas de TCPA de Capta
Capta mantiene seguimiento de consentimiento de SMS y respeta automáticamente las exclusiones de palabras clave STOP. Sin embargo, usted sigue siendo el último responsable de la legalidad de las comunicaciones enviadas a través de su cuenta.

## 7. Manejo de Datos y Privacidad

Su uso del Servicio está sujeto a nuestra [Política de Privacidad](/legal/privacy) y, cuando sea aplicable, nuestro [Acuerdo de Procesamiento de Datos](/legal/dpa). Puntos clave:

- Las grabaciones de llamadas y transcripciones se almacenan durante 12 meses, luego se eliminan automáticamente.
- Los metadatos de llamadas se conservan durante 24 meses.
- El contenido de SMS se conserva durante 6 meses.
- Los registros de consentimiento se conservan durante 7 años.
- Puede solicitar la exportación o eliminación de datos en cualquier momento a través del proceso DSAR descrito en nuestra Política de Privacidad.

## 8. Propiedad Intelectual

### 8.1 IP de Capta
El Servicio, incluidos todos los software, modelos de IA, algoritmos, diseños y documentación, es propiedad de Capta y está protegido por las leyes de propiedad intelectual. Estos Términos no le otorgan derechos de propiedad en el Servicio.

### 8.2 Sus Datos
Usted retiene la propiedad de todos los datos que proporciona al Servicio ("Datos del Cliente"), incluida información comercial, registros de clientes y configuraciones. Usted le otorga a Capta una licencia limitada y no exclusiva para procesar Datos del Cliente únicamente con el propósito de proporcionar el Servicio.

### 8.3 Datos Agregados
Capta puede utilizar datos agregados y anonimizados derivados del Servicio (por ejemplo, duraciones promedio de llamadas, tasas de reservas en industrias) para mejora del producto, evaluación comparativa y marketing. Estos datos nunca lo identificarán a usted ni a sus clientes individualmente.

## 9. Nivel de Servicio y Disponibilidad

Capta se propone alcanzar 99.9% de tiempo de actividad para el servicio principal de contestación de voz. El mantenimiento programado se comunicará con al menos 24 horas de anticipación. En caso de interrupciones del servicio, Capta mantiene un sistema de respuesta de correo de voz de reserva para que las personas que llaman aún puedan dejar mensajes. Una página de estado en tiempo real está disponible en [captahq.com/status](/status).

Capta no garantiza un servicio ininterrumpido o libre de errores. El Servicio depende de proveedores terceros (Twilio, Hume AI, etc.) cuya disponibilidad está fuera del control directo de Capta.

## 10. Limitación de Responsabilidad

EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, LA RESPONSABILIDAD TOTAL DE CAPTA HACIA USTED POR CUALQUIER RECLAMO QUE SURJA DE O SE RELACIONE CON EL SERVICIO NO EXCEDERÁ EL MONTO TOTAL QUE PAGÓ A CAPTA EN LOS DOCE (12) MESES ANTERIORES AL RECLAMO.

EN NINGÚN CASO CAPTA SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO PERO NO LIMITADO A GANANCIAS PERDIDAS, INGRESOS PERDIDOS, OPORTUNIDADES COMERCIALES PERDIDAS O PÉRDIDA DE DATOS, INDEPENDIENTEMENTE DE LA CAUSA DE ACCIÓN O LA TEORÍA DE RESPONSABILIDAD.

CAPTA NO ES RESPONSABLE POR:
- Llamadas perdidas, reservas incorrectas o errores de programación causados por malinterpretación de IA.
- Pérdidas comerciales resultantes de tiempo de inactividad del servicio o rendimiento degradado.
- Daños derivados de las acciones u omisiones de proveedores de servicios terceros.
- Resúmenes de llamadas inexactos, análisis de sentimiento o puntuaciones de calificación de clientes potenciales.

## 11. Indemnización

Usted acepta indemnizar, defender y mantener indemne a Capta y a sus funcionarios, directores, empleados y agentes de cualquier reclamación, daño, pérdida o gasto (incluidos honorarios de abogados razonables) que surja de: (a) su uso del Servicio; (b) su violación de estos Términos; (c) su violación de cualquier ley aplicable; o (d) cualquier reclamación de que sus Datos del Cliente infringen los derechos de un tercero.

## 12. Plazo y Terminación

### 12.1 Plazo
Estos Términos son efectivos a partir de la fecha en que crea su cuenta y continúan hasta que se terminan.

### 12.2 Terminación por Usted
Usted puede cancelar su suscripción en cualquier momento a través de la sección de facturación de su panel de control o comunicándose con support@captahq.com. La cancelación entra en vigor al final del período de facturación actual.

### 12.3 Terminación por Capta
Capta puede suspender o terminar su cuenta inmediatamente si: (a) viola estos Términos; (b) no paga las tarifas después del período de gracia; (c) se involucra en actividad fraudulenta o ilegal; o (d) utiliza el Servicio de una manera que amenace la seguridad o integridad de la plataforma.

### 12.4 Efecto de la Terminación
Al terminar, su acceso al Servicio será deshabilitado. Capta conservará sus datos durante 30 días después de la terminación para permitir la exportación de datos. Después de 30 días, sus datos se eliminarán permanentemente de conformidad con nuestras políticas de retención de datos.

## 13. Resolución de Disputas

### 13.1 Ley Aplicable
Estos Términos se rigen por y se interpretan de acuerdo con las leyes del Estado de Texas, sin considerar los principios de conflicto de leyes.

### 13.2 Resolución Informal
Antes de iniciar procedimientos formales, ambas partes acuerdan intentar resolver disputas informalmente contactando a la otra parte. Capta se puede contactar en legal@captahq.com.

### 13.3 Arbitraje Vinculante
Cualquier disputa no resuelta informalmente dentro de 30 días será resuelta por arbitraje vinculante administrado por la Asociación Americana de Arbitraje (AAA) bajo sus Reglas de Arbitraje Comercial. El arbitraje se llevará a cabo en el Condado de Bexar, Texas, y el laudo del árbitro será final y vinculante.

### 13.4 Exención de Demanda Colectiva
USTED ACEPTA QUE CUALQUIER PROCEDIMIENTO DE RESOLUCIÓN DE DISPUTAS SE LLEVARÁ A CABO ÚNICAMENTE DE MANERA INDIVIDUAL Y NO EN UNA DEMANDA COLECTIVA, CONSOLIDADA O REPRESENTATIVA.

## 14. Disposiciones Generales

### 14.1 Acuerdo Completo
Estos Términos, junto con la Política de Privacidad y el DPA, constituyen el acuerdo completo entre usted y Capta con respecto al Servicio.

### 14.2 Modificaciones
Capta puede modificar estos Términos en cualquier momento. Los cambios materiales se comunicarán por correo electrónico y/o un aviso destacado en el panel de control al menos 30 días antes de entrar en vigor. Su uso continuado del Servicio después de la fecha efectiva constituye aceptación. Si no está de acuerdo con los cambios, puede cancelar su suscripción.

### 14.3 Divisibilidad
Si alguna disposición de estos Términos se considera inaplicable, las disposiciones restantes continuarán en plena vigencia y efecto.

### 14.4 Cesión
Usted no puede ceder o transferir estos Términos sin el consentimiento escrito de Capta. Capta puede ceder estos Términos en conexión con una fusión, adquisición o venta de activos.

### 14.5 Fuerza Mayor
Capta no será responsable por ningún incumplimiento o retraso en el desempeño debido a circunstancias fuera de su control razonable, incluyendo desastres naturales, actos del gobierno, fallos de telecomunicaciones o interrupciones de servicios de terceros.

## 15. Información de Contacto

Capta LLC
Correo Electrónico: support@captahq.com
Consultas Legales: legal@captahq.com
Teléfono: (830) 521-7133`;

export const PRIVACY_EN = `# Privacy Policy

**Effective Date:** March 3, 2026

Capta LLC ("Capta," "we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and protect personal information when you use the Capta platform, visit our website at captahq.com, or interact with our AI receptionist service.

This policy applies to: (a) business owners and employees who subscribe to and use the Capta platform ("Clients"); and (b) individuals who call a business phone number serviced by Capta ("Callers").

## 1. Information We Collect

### 1.1 Information from Clients (Business Owners)

| Category | Examples | Purpose |
|----------|---------|---------|
| Account Information | Name, email address, phone number, business name, business address | Account creation, authentication, communication |
| Business Configuration | Business hours, service types, pricing catalog, employee schedules, custom AI greetings | Configuring the AI receptionist |
| Payment Information | Credit/debit card details (processed and stored by Stripe, Inc. — we do not store card numbers) | Billing and subscription management |
| Usage Data | Dashboard activity, feature usage, login timestamps, IP addresses | Service improvement, security, analytics |
| Support Communications | Emails, feedback submissions, support tickets | Customer support, product improvement |

### 1.2 Information from Callers

| Category | Examples | Purpose |
|----------|---------|---------|
| Call Audio | Voice recordings of calls with the AI receptionist | Providing the AI receptionist service, generating transcripts |
| Call Transcripts | AI-generated text transcriptions of calls | Call summaries, sentiment analysis, quality assurance |
| Caller Information | Phone number, name (if provided), service requested, appointment details | Booking appointments, message delivery, CRM |
| SMS Data | Text messages sent to/from the business phone number, opt-in/opt-out status | Appointment confirmations, notifications, compliance |

### 1.3 Information Collected Automatically

- **Device and Browser Data:** Browser type, operating system, device type, screen resolution (for website visitors and dashboard users).
- **Log Data:** Server logs including IP addresses, access times, pages viewed, and referring URLs.
- **Cookies:** We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.

## 2. How We Use Information

We use personal information for the following purposes:

- **Providing the Service:** Answering calls, booking appointments, sending SMS notifications, generating transcripts and summaries, managing the client dashboard.
- **AI Processing:** Our AI receptionist processes call audio in real-time to understand caller intent, detect language (English/Spanish), identify emergencies, and generate responses. Post-call, we use AI to generate call summaries, sentiment analysis, and lead qualification scores.
- **Billing:** Processing payments, managing subscriptions, sending invoices, and handling payment recovery.
- **Communication:** Sending transactional emails (account confirmations, billing notifications, service reminders), responding to support requests, and delivering product updates.
- **Security:** Detecting and preventing fraud, unauthorized access, and abuse.
- **Compliance:** Fulfilling legal obligations including TCPA consent management, GDPR/CCPA data subject requests, and record-keeping requirements.
- **Product Improvement:** Analyzing aggregated, anonymized usage data to improve the AI receptionist, dashboard features, and overall service quality. We do not use individual call recordings to train AI models.

## 3. How We Share Information

We share personal information only in the following circumstances:

### 3.1 Service Providers (Sub-Processors)

We use third-party service providers to operate the platform. Each processes data only as necessary to provide their service. See our [Sub-Processor List](/legal/sub-processors) for the current list.

| Provider | Purpose | Data Accessed |
|----------|---------|--------------|
| Twilio | Phone call routing, SMS delivery | Phone numbers, call metadata, SMS content |
| Hume AI | Voice AI processing | Call audio, voice data |
| Anthropic (Claude) | Call summaries, AI agents | Transcript text, conversation context |
| Turso | Database hosting | All structured data |
| Vercel | Application hosting | Request logs, IP addresses |
| Resend | Email delivery | Email addresses, email content |
| Stripe | Payment processing | Payment details, billing information |
| Sentry | Error monitoring | Error logs (no PII by design) |

### 3.2 To Your Business (Client-Caller Relationship)
Call recordings, transcripts, caller information, and booking details are made available to the Client whose business number was called. The Client is the data controller for their customers' data; Capta acts as a data processor.

### 3.3 Legal Requirements
We may disclose information when required by law, subpoena, court order, or government request, or when necessary to protect our rights, safety, or property.

### 3.4 Business Transfers
In the event of a merger, acquisition, or sale of assets, personal information may be transferred to the acquiring entity.

We do **not** sell personal information. We do **not** share personal information with third parties for their marketing purposes.

## 4. Data Retention

| Data Type | Retention Period | Basis |
|-----------|-----------------|-------|
| Call recordings and transcripts | 12 months from call date | Service delivery, quality assurance |
| Call metadata (duration, outcome, sentiment) | 24 months from call date | Analytics, service improvement |
| SMS content | 6 months from message date | Compliance, dispute resolution |
| Consent records (TCPA, TOS acceptance) | 7 years | Legal compliance |
| Account and billing data | Duration of account + 30 days | Service delivery, billing |
| Server logs | 90 days | Security, debugging |

After the retention period expires, data is automatically and permanently deleted. Upon account cancellation, we retain data for 30 days to allow for data export, then delete it permanently.

## 5. Your Rights

### 5.1 All Users

You have the right to:
- **Access** the personal information we hold about you.
- **Correct** inaccurate personal information.
- **Delete** your personal information (subject to legal retention requirements).
- **Export** your data in a portable format.
- **Opt out** of SMS communications by texting STOP to any Capta number.

### 5.2 California Residents (CCPA/CPRA)

In addition to the rights above, California residents have the right to:
- **Know** what personal information is collected, used, shared, or sold.
- **Opt out** of the sale or sharing of personal information. (Note: Capta does not sell personal information.)
- **Limit** use of sensitive personal information.
- **Non-discrimination** for exercising your privacy rights.

### 5.3 EU/EEA Residents (GDPR)

If you are located in the EU/EEA, you have additional rights including:
- **Right to restriction** of processing.
- **Right to object** to processing based on legitimate interests.
- **Right to data portability** in a machine-readable format.
- **Right to lodge a complaint** with your local data protection authority.

Our lawful bases for processing include: performance of a contract (providing the Service), legitimate interests (security, product improvement), consent (marketing communications), and legal obligations (compliance, record-keeping).

### 5.4 How to Exercise Your Rights

Submit a data subject access request by emailing privacy@captahq.com or through the compliance section of your dashboard. We will verify your identity and respond within 30 days (GDPR) or 45 days (CCPA). Clients can also submit requests on behalf of their callers through the admin portal's DSAR handling system.

## 6. Security

We implement technical and organizational measures to protect personal information, including:

- Encryption in transit (TLS 1.2+) for all data transmission.
- Database encryption at rest.
- Passwordless authentication (magic links) to eliminate password-based attacks.
- Role-based access controls separating client and admin access.
- Rate limiting on all API endpoints.
- Input validation and prompt injection protection on AI systems.
- Automated error monitoring via Sentry.
- Regular security audits.

No system is 100% secure. If we become aware of a security breach affecting your personal information, we will notify you and applicable authorities in accordance with legal requirements (within 72 hours for GDPR-covered data).

## 7. Children's Privacy

Capta is a business-to-business service. We do not knowingly collect personal information from children under 13 (or 16 in the EU). If we learn we have collected such information, we will delete it promptly.

## 8. International Data Transfers

Capta is based in the United States. All data processing occurs within the United States through U.S.-based service providers. If you are accessing the Service from outside the United States, your data will be transferred to and processed in the United States.

For EU/EEA users, transfers are conducted under Standard Contractual Clauses (SCCs) as described in our Data Processing Agreement.

## 9. Cookies and Tracking

We use only essential cookies necessary for authentication and session management. We do not use:
- Advertising or targeting cookies
- Third-party analytics trackers
- Social media tracking pixels
- Cross-site tracking of any kind

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will be communicated via email and/or a notice on the dashboard at least 30 days before taking effect. The "Effective Date" at the top reflects the latest version.

## 11. Contact Us

For privacy questions, data requests, or concerns:

Capta LLC
Privacy inquiries: privacy@captahq.com
General support: support@captahq.com
Phone: (830) 521-7133`;

export const PRIVACY_ES = `# Política de Privacidad

**Fecha de Vigencia:** 3 de marzo de 2026

Capta LLC ("Capta," "nosotros," "nos," u "nuestro") respeta su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos información personal cuando usted utiliza la plataforma Capta, visita nuestro sitio web en captahq.com, o interactúa con nuestro servicio de recepcionista de IA.

Esta política se aplica a: (a) propietarios de negocios y empleados que se suscriben y utilizan la plataforma Capta ("Clientes"); y (b) individuos que llaman a un número de teléfono de negocios servido por Capta ("Llamadores").

## 1. Información que Recopilamos

### 1.1 Información de Clientes (Propietarios de Negocios)

| Categoría | Ejemplos | Propósito |
|-----------|----------|-----------|
| Información de Cuenta | Nombre, dirección de correo electrónico, número de teléfono, nombre del negocio, dirección del negocio | Creación de cuenta, autenticación, comunicación |
| Configuración del Negocio | Horario comercial, tipos de servicios, catálogo de precios, horarios de empleados, saludos de IA personalizados | Configuración del recepcionista de IA |
| Información de Pago | Detalles de tarjeta de crédito/débito (procesados y almacenados por Stripe, Inc. — no almacenamos números de tarjeta) | Facturación y gestión de suscripción |
| Datos de Uso | Actividad del panel de control, uso de características, marcas de tiempo de inicio de sesión, direcciones IP | Mejora del servicio, seguridad, análisis |
| Comunicaciones de Soporte | Correos electrónicos, envíos de comentarios, tickets de soporte | Soporte al cliente, mejora del producto |

### 1.2 Información de Llamadores

| Categoría | Ejemplos | Propósito |
|-----------|----------|-----------|
| Audio de Llamadas | Grabaciones de voz de llamadas con el recepcionista de IA | Proporcionar el servicio de recepcionista de IA, generar transcripciones |
| Transcripciones de Llamadas | Transcripciones de texto generadas por IA de llamadas | Resúmenes de llamadas, análisis de sentimiento, control de calidad |
| Información del Llamador | Número de teléfono, nombre (si se proporciona), servicio solicitado, detalles de cita | Reserva de citas, entrega de mensajes, CRM |
| Datos de SMS | Mensajes de texto enviados a/desde el número de teléfono del negocio, estado de opción de participación/exclusión | Confirmaciones de citas, notificaciones, cumplimiento normativo |

### 1.3 Información Recopilada Automáticamente

- **Datos de Dispositivo y Navegador:** Tipo de navegador, sistema operativo, tipo de dispositivo, resolución de pantalla (para visitantes del sitio web y usuarios del panel de control).
- **Datos de Registro:** Registros del servidor que incluyen direcciones IP, horas de acceso, páginas visualizadas y URLs de referencia.
- **Cookies:** Utilizamos cookies esenciales para autenticación y gestión de sesiones. No utilizamos cookies de publicidad ni de seguimiento.

## 2. Cómo Utilizamos la Información

Utilizamos información personal para los siguientes propósitos:

- **Proporcionar el Servicio:** Responder llamadas, reservar citas, enviar notificaciones por SMS, generar transcripciones y resúmenes, gestionar el panel de control del cliente.
- **Procesamiento de IA:** Nuestro recepcionista de IA procesa audio de llamadas en tiempo real para comprender la intención del llamador, detectar idioma (inglés/español), identificar emergencias y generar respuestas. Después de la llamada, utilizamos IA para generar resúmenes de llamadas, análisis de sentimiento y puntuaciones de calificación de clientes potenciales.
- **Facturación:** Procesar pagos, gestionar suscripciones, enviar facturas y manejar recuperación de pagos.
- **Comunicación:** Enviar correos electrónicos transaccionales (confirmaciones de cuenta, notificaciones de facturación, recordatorios de prueba), responder a solicitudes de soporte y entregar actualizaciones de productos.
- **Seguridad:** Detectar y prevenir fraude, acceso no autorizado y abuso.
- **Cumplimiento Normativo:** Cumplir con obligaciones legales incluyendo gestión de consentimiento TCPA, solicitudes de sujetos de datos GDPR/CCPA y requisitos de mantenimiento de registros.
- **Mejora del Producto:** Analizar datos de uso agregados y anónimos para mejorar el recepcionista de IA, características del panel de control y calidad general del servicio. No utilizamos grabaciones de llamadas individuales para entrenar modelos de IA.

## 3. Cómo Compartimos Información

Compartimos información personal solo en las siguientes circunstancias:

### 3.1 Proveedores de Servicios (Subprocesadores)

Utilizamos proveedores de servicios de terceros para operar la plataforma. Cada uno procesa datos solo según sea necesario para proporcionar su servicio. Consulte nuestro [Sub-Processor List](/legal/sub-processors) para la lista actual.

| Proveedor | Propósito | Datos Accedidos |
|-----------|-----------|-----------------|
| Twilio | Enrutamiento de llamadas telefónicas, entrega de SMS | Números de teléfono, metadatos de llamadas, contenido de SMS |
| Hume AI | Procesamiento de IA de voz | Audio de llamadas, datos de voz |
| Anthropic (Claude) | Resúmenes de llamadas, agentes de IA | Texto de transcripción, contexto de conversación |
| Turso | Alojamiento de base de datos | Todos los datos estructurados |
| Vercel | Alojamiento de aplicaciones | Registros de solicitudes, direcciones IP |
| Resend | Entrega de correo electrónico | Direcciones de correo electrónico, contenido de correo electrónico |
| Stripe | Procesamiento de pagos | Detalles de pago, información de facturación |
| Sentry | Monitoreo de errores | Registros de errores (sin PII por diseño) |

### 3.2 A Su Negocio (Relación Cliente-Llamador)

Grabaciones de llamadas, transcripciones, información del llamador y detalles de reserva se ponen a disposición del Cliente cuyo número de negocio fue llamado. El Cliente es el controlador de datos para los datos de sus clientes; Capta actúa como procesador de datos.

### 3.3 Requisitos Legales

Podemos divulgar información cuando sea requerido por ley, citación, orden judicial o solicitud gubernamental, o cuando sea necesario para proteger nuestros derechos, seguridad o propiedad.

### 3.4 Transferencias de Negocio

En caso de una fusión, adquisición o venta de activos, la información personal puede ser transferida a la entidad adquirente.

**No** vendemos información personal. **No** compartimos información personal con terceros para sus propósitos de marketing.

## 4. Retención de Datos

| Tipo de Datos | Período de Retención | Base |
|---------------|----------------------|------|
| Grabaciones de llamadas y transcripciones | 12 meses desde la fecha de llamada | Entrega de servicio, control de calidad |
| Metadatos de llamadas (duración, resultado, sentimiento) | 24 meses desde la fecha de llamada | Análisis, mejora del servicio |
| Contenido de SMS | 6 meses desde la fecha del mensaje | Cumplimiento normativo, resolución de disputas |
| Registros de consentimiento (aceptación de TCPA, TOS) | 7 años | Cumplimiento legal |
| Datos de cuenta y facturación | Duración de la cuenta + 30 días | Entrega de servicio, facturación |
| Registros del servidor | 90 días | Seguridad, depuración |

Después de que expire el período de retención, los datos se eliminan automática y permanentemente. Al cancelar la cuenta, conservamos datos durante 30 días para permitir la exportación de datos y luego los eliminamos permanentemente.

## 5. Sus Derechos

### 5.1 Todos los Usuarios

Usted tiene derecho a:
- **Acceder** a la información personal que mantenemos sobre usted.
- **Corregir** información personal inexacta.
- **Eliminar** su información personal (sujeto a requisitos de retención legal).
- **Exportar** sus datos en formato portátil.
- **Optar por no participar** en comunicaciones por SMS escribiendo STOP a cualquier número de Capta.

### 5.2 Residentes de California (CCPA/CPRA)

Además de los derechos anteriores, los residentes de California tienen derecho a:
- **Saber** qué información personal se recopila, utiliza, comparte o vende.
- **Optar por no participar** en la venta o intercambio de información personal. (Nota: Capta no vende información personal.)
- **Limitar** el uso de información personal sensible.
- **No discriminación** por ejercer sus derechos de privacidad.

### 5.3 Residentes de UE/EEA (GDPR)

Si se encuentra en la UE/EEA, tiene derechos adicionales incluyendo:
- **Derecho a la restricción** del procesamiento.
- **Derecho a objetar** el procesamiento basado en intereses legítimos.
- **Derecho a la portabilidad de datos** en formato legible por máquina.
- **Derecho a presentar una reclamación** ante su autoridad local de protección de datos.

Nuestras bases legales para el procesamiento incluyen: cumplimiento de un contrato (proporcionar el Servicio), intereses legítimos (seguridad, mejora del producto), consentimiento (comunicaciones de marketing) y obligaciones legales (cumplimiento normativo, mantenimiento de registros).

### 5.4 Cómo Ejercer Sus Derechos

Envíe una solicitud de acceso de sujeto de datos por correo electrónico a privacy@captahq.com o a través de la sección de cumplimiento de su panel de control. Verificaremos su identidad y responderemos dentro de 30 días (GDPR) o 45 días (CCPA). Los Clientes también pueden enviar solicitudes en nombre de sus llamadores a través del sistema de manejo de DSAR del portal de administrador.

## 6. Seguridad

Implementamos medidas técnicas y organizativas para proteger información personal, incluyendo:

- Cifrado en tránsito (TLS 1.2+) para toda transmisión de datos.
- Cifrado de base de datos en reposo.
- Autenticación sin contraseña (enlaces mágicos) para eliminar ataques basados en contraseña.
- Controles de acceso basados en roles que separan el acceso del cliente y del administrador.
- Limitación de velocidad en todos los puntos finales de API.
- Validación de entrada y protección contra inyección de indicaciones en sistemas de IA.
- Monitoreo automatizado de errores a través de Sentry.
- Auditorías de seguridad regulares.

Ningún sistema es 100% seguro. Si nos enteramos de una violación de seguridad que afecta su información personal, lo notificaremos a usted y a las autoridades aplicables de conformidad con los requisitos legales (dentro de 72 horas para datos cubiertos por GDPR).

## 7. Privacidad de Menores

Capta es un servicio de empresa a empresa. No recopilamos deliberadamente información personal de menores de 13 años (o 16 en la UE). Si nos enteramos de que hemos recopilado tal información, la eliminaremos rápidamente.

## 8. Transferencias Internacionales de Datos

Capta tiene sede en Estados Unidos. Todo procesamiento de datos ocurre en Estados Unidos a través de proveedores de servicios con sede en EE.UU. Si accede al Servicio desde fuera de Estados Unidos, sus datos serán transferidos a y procesados en Estados Unidos.

Para usuarios de UE/EEA, las transferencias se realizan bajo Cláusulas Contractuales Estándar (SCC) como se describe en nuestro Acuerdo de Procesamiento de Datos.

## 9. Cookies y Seguimiento

Utilizamos solo cookies esenciales necesarias para autenticación y gestión de sesiones. No utilizamos:
- Cookies de publicidad o segmentación
- Rastreadores de análisis de terceros
- Píxeles de seguimiento de redes sociales
- Seguimiento entre sitios de ningún tipo

## 10. Cambios a Esta Política

Podemos actualizar esta Política de Privacidad de vez en cuando. Los cambios materiales serán comunicados por correo electrónico y/o un aviso en el panel de control al menos 30 días antes de entrar en vigencia. La "Fecha de Vigencia" en la parte superior refleja la versión más reciente.

## 11. Contáctenos

Para preguntas de privacidad, solicitudes de datos o inquietudes:

Capta LLC
Consultas de privacidad: privacy@captahq.com
Soporte general: support@captahq.com
Teléfono: (830) 521-7133`;

export const DPA_EN = `# Data Processing Agreement

**Effective Date:** March 3, 2026

This Data Processing Agreement ("DPA") is entered into between the business entity subscribing to Capta ("Controller," "Client," or "you") and Capta LLC ("Processor," "Capta," "we," or "us"). This DPA forms part of and supplements the Terms of Service.

This DPA reflects the parties' commitment to abide by applicable data protection laws, including the General Data Protection Regulation (EU) 2016/679 ("GDPR"), the California Consumer Privacy Act as amended by the California Privacy Rights Act ("CCPA/CPRA"), and other applicable privacy regulations.

## 1. Definitions

- **"Personal Data"** means any information relating to an identified or identifiable natural person, as defined by applicable data protection law.
- **"Processing"** means any operation performed on Personal Data, including collection, recording, storage, retrieval, use, disclosure, erasure, or destruction.
- **"Data Subject"** means the identified or identifiable person to whom Personal Data relates.
- **"Sub-Processor"** means any third party engaged by Capta to process Personal Data on behalf of the Controller.
- **"Security Incident"** means any unauthorized access, disclosure, alteration, or destruction of Personal Data.

## 2. Scope and Roles

### 2.1 Controller and Processor
The Client acts as the **Controller** of the Personal Data of its customers (callers). Capta acts as the **Processor**, processing Personal Data on behalf of the Controller solely to provide the Capta platform.

### 2.2 Processing Details

| Element | Description |
|---------|-------------|
| **Subject Matter** | Provision of AI-powered virtual receptionist services |
| **Duration** | For the term of the Client's subscription, plus any applicable retention periods |
| **Nature of Processing** | Automated voice call handling, speech-to-text transcription, AI-powered call summarization, appointment booking, SMS notifications, CRM record creation |
| **Purpose** | Answering inbound phone calls, booking appointments, sending notifications, generating call analytics, and related services as described in the Terms of Service |
| **Categories of Personal Data** | Phone numbers, caller names, voice recordings, call transcripts, appointment details, service requests, SMS content, email addresses |
| **Categories of Data Subjects** | Callers to the Client's business phone number, Client employees and representatives |

## 3. Processor Obligations

Capta shall:

### 3.1 Lawful Processing
Process Personal Data only on documented instructions from the Controller (as set forth in this DPA and the Terms of Service), unless required to do so by applicable law. In such case, Capta shall inform the Controller of that legal requirement before processing, unless prohibited by law.

### 3.2 Confidentiality
Ensure that all personnel authorized to process Personal Data have committed to confidentiality obligations or are under an appropriate statutory obligation of confidentiality.

### 3.3 Security Measures
Implement and maintain appropriate technical and organizational security measures, including:

- Encryption of Personal Data in transit (TLS 1.2+) and at rest
- Passwordless authentication (magic links) for Client access
- Role-based access controls with separation between Client and admin functions
- Rate limiting on all API endpoints (200 requests per 60 seconds on dashboard routes)
- Input validation and sanitization on all user inputs, including prompt injection protection
- Automated error monitoring and alerting
- Regular security audits and vulnerability assessments
- Voicemail fallback system for business continuity

### 3.4 Sub-Processors
Capta uses the Sub-Processors listed at [/legal/sub-processors](/legal/sub-processors). Capta shall:

- Impose data protection obligations on each Sub-Processor that are no less protective than those in this DPA.
- Remain fully liable for the acts and omissions of its Sub-Processors.
- Notify the Controller at least 30 days before adding or replacing a Sub-Processor, providing the Controller with an opportunity to object. If the Controller objects on reasonable grounds, the parties will work in good faith to resolve the concern. If no resolution is reached, the Controller may terminate the affected service.

### 3.5 Data Subject Rights
Capta shall assist the Controller in responding to Data Subject requests (access, rectification, erasure, portability, restriction, or objection) by:

- Providing a DSAR (Data Subject Access Request) handling system accessible through the admin dashboard.
- Responding to Controller's data subject fulfillment requests within 10 business days.
- Supporting atomic batch deletion across all database tables when processing erasure requests.

### 3.6 Security Incident Notification
In the event of a Security Incident involving Personal Data, Capta shall:

- Notify the Controller without undue delay and no later than **48 hours** after becoming aware of the incident.
- Provide sufficient information to enable the Controller to meet its breach notification obligations (within 72 hours under GDPR).
- Cooperate with the Controller's investigation and remediation efforts.
- Document the incident, including its effects and the corrective actions taken.

Notification shall include: (a) the nature of the incident; (b) the categories and approximate number of Data Subjects affected; (c) the likely consequences; and (d) the measures taken or proposed to address the incident.

### 3.7 Data Protection Impact Assessments
Capta shall provide reasonable assistance to the Controller in conducting data protection impact assessments and prior consultations with supervisory authorities, where required under applicable law.

### 3.8 Audit Rights
Upon the Controller's written request (no more than once per 12-month period), Capta shall make available information necessary to demonstrate compliance with this DPA. This may be satisfied through:

- Provision of a current SOC 2 Type II report or equivalent third-party audit report, if available.
- Written responses to the Controller's reasonable audit questionnaire.
- In the absence of the above, a remote or on-site audit conducted by the Controller or a mutually agreed-upon third-party auditor, at the Controller's expense, with at least 30 days' written notice.

## 4. Data Retention and Deletion

### 4.1 Retention Periods
Capta retains Personal Data according to the following schedule:

| Data Type | Retention Period |
|-----------|-----------------|
| Call recordings and transcripts | 12 months from call date |
| Call metadata | 24 months from call date |
| SMS content | 6 months from message date |
| Consent records | 7 years |
| Account data | Duration of subscription + 30 days |

### 4.2 Deletion on Termination
Upon termination of the Client's subscription:

- Capta will retain Client Data for 30 days to allow for data export.
- After the 30-day period, Capta will permanently delete all Client Personal Data from active systems within 30 days.
- Backup copies will be deleted within 90 days of termination.
- Capta may retain anonymized, aggregated data that does not identify individuals.
- Data subject to legal retention requirements (e.g., consent records, billing records) will be retained for the required period and then deleted.

### 4.3 Return of Data
Upon written request prior to deletion, Capta will provide the Controller with a copy of its Personal Data in a structured, commonly used, machine-readable format (JSON or CSV).

## 5. International Data Transfers

### 5.1 Processing Locations
All Personal Data is processed and stored within the United States. Capta's Sub-Processors are all U.S.-based entities.

### 5.2 Transfer Mechanisms
For transfers of Personal Data from the EU/EEA to the United States, Capta relies on the EU-U.S. Data Privacy Framework where applicable, and Standard Contractual Clauses (SCCs) — Module Two (Controller to Processor) — as adopted by the European Commission in June 2021.

### 5.3 Supplementary Measures
Capta implements the following supplementary technical measures to protect transferred data:

- End-to-end encryption for data in transit
- Encryption at rest for all stored data
- Access controls limiting data access to authorized personnel
- Prompt deletion of data in accordance with retention schedules

## 6. CCPA/CPRA Specific Provisions

For purposes of the CCPA/CPRA:

- Capta is a **Service Provider** as defined under the CCPA.
- Capta shall not sell or share Personal Information received from the Controller.
- Capta shall not retain, use, or disclose Personal Information for any purpose other than providing the Service, or as otherwise permitted by the CCPA.
- Capta shall not combine Personal Information received from the Controller with Personal Information received from or on behalf of another person, except as permitted by the CCPA.

## 7. Liability

Each party's liability under this DPA shall be subject to the limitations of liability set forth in the Terms of Service.

## 8. Term

This DPA shall remain in effect for the duration of the Controller's subscription to Capta. Provisions relating to data deletion, confidentiality, and audit rights shall survive termination.

## 9. Contact

For questions about this DPA or data processing:

Capta LLC
Data Protection inquiries: privacy@captahq.com
General: support@captahq.com
Phone: (830) 521-7133`;

export const DPA_ES = `# Acuerdo de Procesamiento de Datos

**Fecha Efectiva:** 3 de marzo de 2026

Este Acuerdo de Procesamiento de Datos ("DPA") se celebra entre la entidad comercial que se suscribe a Capta ("Responsable del Tratamiento," "Cliente," o "usted") y Capta LLC ("Encargado del Tratamiento," "Capta," "nosotros," o "nos"). Este DPA forma parte de y complementa los Términos de Servicio.

Este DPA refleja el compromiso de las partes de cumplir con las leyes de protección de datos aplicables, incluyendo la Reglamentación General de Protección de Datos (UE) 2016/679 ("GDPR"), la Ley de Privacidad del Consumidor de California modificada por la Ley de Derechos de Privacidad de California ("CCPA/CPRA"), y otras regulaciones de privacidad aplicables.

## 1. Definiciones

- **"Datos Personales"** significa cualquier información relacionada con una persona física identificada o identificable, conforme se define en la ley de protección de datos aplicable.
- **"Procesamiento"** significa cualquier operación realizada en Datos Personales, incluyendo recopilación, registro, almacenamiento, recuperación, uso, divulgación, borrado o destrucción.
- **"Sujeto de Datos"** significa la persona identificada o identificable a la que se refieren los Datos Personales.
- **"Sub-Encargado del Tratamiento"** significa cualquier tercero contratado por Capta para procesar Datos Personales en nombre del Responsable del Tratamiento.
- **"Incidente de Seguridad"** significa cualquier acceso no autorizado, divulgación, alteración o destrucción de Datos Personales.

## 2. Alcance y Roles

### 2.1 Responsable del Tratamiento y Encargado del Tratamiento
El Cliente actúa como el **Responsable del Tratamiento** de los Datos Personales de sus clientes (llamantes). Capta actúa como el **Encargado del Tratamiento**, procesando Datos Personales en nombre del Responsable del Tratamiento únicamente para proporcionar la plataforma Capta.

### 2.2 Detalles del Procesamiento

| Elemento | Descripción |
|---------|-------------|
| **Asunto** | Prestación de servicios de recepcionista virtual impulsado por inteligencia artificial |
| **Duración** | Para el período de la suscripción del Cliente, más los períodos de retención aplicables |
| **Naturaleza del Procesamiento** | Gestión automatizada de llamadas telefónicas, transcripción de voz a texto, resumen de llamadas impulsado por inteligencia artificial, reserva de citas, notificaciones por SMS, creación de registros en CRM |
| **Propósito** | Responder llamadas telefónicas entrantes, reservar citas, enviar notificaciones, generar análisis de llamadas, y servicios relacionados conforme se describe en los Términos de Servicio |
| **Categorías de Datos Personales** | Números de teléfono, nombres de llamantes, grabaciones de voz, transcripciones de llamadas, detalles de citas, solicitudes de servicio, contenido de SMS, direcciones de correo electrónico |
| **Categorías de Sujetos de Datos** | Llamantes al número de teléfono del negocio del Cliente, empleados y representantes del Cliente |

## 3. Obligaciones del Encargado del Tratamiento

Capta deberá:

### 3.1 Procesamiento Lícito
Procesar Datos Personales únicamente conforme a instrucciones documentadas del Responsable del Tratamiento (conforme se establece en este DPA y en los Términos de Servicio), a menos que sea requerido hacerlo por ley aplicable. En tal caso, Capta informará al Responsable del Tratamiento de ese requisito legal antes de procesar, a menos que esté prohibido por ley.

### 3.2 Confidencialidad
Asegurar que todo el personal autorizado para procesar Datos Personales haya asumido obligaciones de confidencialidad o esté sujeto a una obligación estatutaria apropiada de confidencialidad.

### 3.3 Medidas de Seguridad
Implementar y mantener medidas de seguridad técnicas y organizacionales apropiadas, incluyendo:

- Encriptación de Datos Personales en tránsito (TLS 1.2+) y en reposo
- Autenticación sin contraseña (enlaces mágicos) para acceso del Cliente
- Controles de acceso basados en roles con separación entre funciones del Cliente y administrador
- Limitación de velocidad en todos los puntos finales de API (200 solicitudes por 60 segundos en rutas del panel de control)
- Validación de entrada y sanitización en todas las entradas del usuario, incluyendo protección contra inyección de solicitudes
- Monitoreo de errores automatizado y alertas
- Auditorías de seguridad regulares y evaluaciones de vulnerabilidades
- Sistema de respuesta de buzón de voz para continuidad comercial

### 3.4 Sub-Encargados del Tratamiento
Capta utiliza los Sub-Encargados del Tratamiento enumerados en [/legal/sub-processors](/legal/sub-processors). Capta deberá:

- Imponer obligaciones de protección de datos en cada Sub-Encargado del Tratamiento que no sean menos protectoras que las de este DPA.
- Permanecer completamente responsable por los actos y omisiones de sus Sub-Encargados del Tratamiento.
- Notificar al Responsable del Tratamiento al menos 30 días antes de agregar o reemplazar un Sub-Encargado del Tratamiento, proporcionando al Responsable del Tratamiento la oportunidad de objetar. Si el Responsable del Tratamiento objeta con fundamentos razonables, las partes trabajarán de buena fe para resolver la preocupación. Si no se llega a una resolución, el Responsable del Tratamiento podrá rescindir el servicio afectado.

### 3.5 Derechos de Sujetos de Datos
Capta deberá asistir al Responsable del Tratamiento en responder solicitudes de Sujetos de Datos (acceso, rectificación, borrado, portabilidad, restricción u objeción) mediante:

- Proporcionar un sistema de manejo de DSAR (Solicitud de Acceso de Sujeto de Datos) accesible a través del panel de control del administrador.
- Responder a solicitudes de cumplimiento de sujeto de datos del Responsable del Tratamiento dentro de 10 días hábiles.
- Apoyar la eliminación por lotes atómica en todas las tablas de bases de datos al procesar solicitudes de borrado.

### 3.6 Notificación de Incidentes de Seguridad
En caso de un Incidente de Seguridad que implique Datos Personales, Capta deberá:

- Notificar al Responsable del Tratamiento sin demora indebida y no más tarde de **48 horas** después de tener conocimiento del incidente.
- Proporcionar información suficiente para permitir que el Responsable del Tratamiento cumpla con sus obligaciones de notificación de brechas (dentro de 72 horas conforme al GDPR).
- Cooperar con la investigación y los esfuerzos de remediación del Responsable del Tratamiento.
- Documentar el incidente, incluyendo sus efectos y las acciones correctivas tomadas.

La notificación deberá incluir: (a) la naturaleza del incidente; (b) las categorías y el número aproximado de Sujetos de Datos afectados; (c) las consecuencias probables; y (d) las medidas tomadas o propuestas para abordar el incidente.

### 3.7 Evaluaciones de Impacto de Protección de Datos
Capta deberá proporcionar asistencia razonable al Responsable del Tratamiento en la realización de evaluaciones de impacto de protección de datos y consultas previas con autoridades de supervisión, cuando sea requerido por ley aplicable.

### 3.8 Derechos de Auditoría
Previa solicitud escrita del Responsable del Tratamiento (no más de una vez por período de 12 meses), Capta deberá poner a disposición la información necesaria para demostrar cumplimiento con este DPA. Esto puede satisfacerse mediante:

- Provisión de un informe actual de SOC 2 Tipo II u informe de auditoría de tercero equivalente, si está disponible.
- Respuestas escritas al cuestionario de auditoría razonable del Responsable del Tratamiento.
- En ausencia de lo anterior, una auditoría remota u presencial realizada por el Responsable del Tratamiento o un auditor de tercero mutuamente acordado, a expensas del Responsable del Tratamiento, con al menos 30 días de notificación escrita.

## 4. Retención y Eliminación de Datos

### 4.1 Períodos de Retención
Capta retiene Datos Personales conforme al siguiente cronograma:

| Tipo de Datos | Período de Retención |
|-----------|-----------------|
| Grabaciones y transcripciones de llamadas | 12 meses desde la fecha de la llamada |
| Metadatos de llamadas | 24 meses desde la fecha de la llamada |
| Contenido de SMS | 6 meses desde la fecha del mensaje |
| Registros de consentimiento | 7 años |
| Datos de cuenta | Duración de la suscripción + 30 días |

### 4.2 Eliminación en Caso de Terminación
Previa la terminación de la suscripción del Cliente:

- Capta retendrá Datos del Cliente durante 30 días para permitir la exportación de datos.
- Después del período de 30 días, Capta eliminará permanentemente todos los Datos Personales del Cliente de sistemas activos dentro de 30 días.
- Las copias de seguridad serán eliminadas dentro de 90 días de la terminación.
- Capta podrá retener datos anonimizados y agregados que no identifiquen individuos.
- Los datos sujetos a requisitos de retención legal (por ejemplo, registros de consentimiento, registros de facturación) serán retenidos durante el período requerido y luego eliminados.

### 4.3 Devolución de Datos
Previa solicitud escrita antes de la eliminación, Capta proporcionará al Responsable del Tratamiento una copia de sus Datos Personales en un formato estructurado, comúnmente utilizado y legible por máquina (JSON o CSV).

## 5. Transferencias Internacionales de Datos

### 5.1 Ubicaciones de Procesamiento
Todos los Datos Personales se procesan y almacenan dentro de los Estados Unidos. Los Sub-Encargados del Tratamiento de Capta son todas entidades con sede en EE.UU.

### 5.2 Mecanismos de Transferencia
Para transferencias de Datos Personales de la UE/EEA a los Estados Unidos, Capta se basa en el Marco de Privacidad de Datos UE-EE.UU. cuando es aplicable, y Cláusulas Contractuales Estándar (SCCs) — Módulo Dos (Responsable del Tratamiento a Encargado del Tratamiento) — conforme adoptadas por la Comisión Europea en junio de 2021.

### 5.3 Medidas Complementarias
Capta implementa las siguientes medidas técnicas complementarias para proteger datos transferidos:

- Encriptación de extremo a extremo para datos en tránsito
- Encriptación en reposo para todos los datos almacenados
- Controles de acceso que limitan el acceso a datos únicamente a personal autorizado
- Eliminación oportuna de datos conforme a cronogramas de retención

## 6. Disposiciones Específicas CCPA/CPRA

Para propósitos de CCPA/CPRA:

- Capta es un **Proveedor de Servicios** conforme se define conforme a la CCPA.
- Capta no deberá vender ni compartir Información Personal recibida del Responsable del Tratamiento.
- Capta no deberá retener, usar, o divulgar Información Personal para ningún propósito que no sea proporcionar el Servicio, o conforme sea permitido de otra manera por la CCPA.
- Capta no deberá combinar Información Personal recibida del Responsable del Tratamiento con Información Personal recibida de o en nombre de otra persona, excepto conforme sea permitido por la CCPA.

## 7. Responsabilidad

La responsabilidad de cada parte bajo este DPA estará sujeta a las limitaciones de responsabilidad establecidas en los Términos de Servicio.

## 8. Vigencia

Este DPA permanecerá en vigor durante la duración de la suscripción del Responsable del Tratamiento a Capta. Las disposiciones relacionadas con eliminación de datos, confidencialidad y derechos de auditoría sobrevivirán la terminación.

## 9. Contacto

Para preguntas sobre este DPA o procesamiento de datos:

Capta LLC
Consultas de Protección de Datos: privacy@captahq.com
General: support@captahq.com
Teléfono: (830) 521-7133`;
