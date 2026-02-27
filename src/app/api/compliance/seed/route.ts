import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { legalDocuments, subProcessors } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * POST /api/compliance/seed
 * Seeds initial legal documents and sub-processors
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Seed legal documents
    const docs = [
      {
        documentType: "tos",
        version: "1.0",
        title: "Terms of Service",
        titleEs: "Términos de Servicio",
        content: "# Terms of Service\n\n**Effective Date:** February 2026\n\n*Placeholder — have a licensed attorney draft this before launch.*\n\nBy using Calltide's AI receptionist services, you agree to these terms.\n\n## 1. Service Description\nCalltide provides AI-powered phone answering and scheduling services for businesses.\n\n## 2. Acceptable Use\nYou agree to use the service only for lawful business purposes.\n\n## 3. Privacy\nYour use of the service is subject to our Privacy Policy.\n\n## 4. Payment\nService is billed monthly at the agreed rate. See our billing terms.\n\n## 5. Termination\nEither party may terminate with 30 days written notice.\n\n## 6. Limitation of Liability\nCalltide's liability is limited to the amount paid for the service.\n\n## 7. Governing Law\nThese terms are governed by the laws of the State of Texas.",
        contentEs: "# Términos de Servicio\n\n**Fecha de vigencia:** Febrero 2026\n\n*Marcador de posición — haga que un abogado con licencia redacte esto antes del lanzamiento.*\n\nAl utilizar los servicios de recepcionista AI de Calltide, usted acepta estos términos.\n\n## 1. Descripción del Servicio\nCalltide proporciona servicios de contestación telefónica y programación impulsados por IA.\n\n## 2. Uso Aceptable\nUsted acepta usar el servicio solo para fines comerciales legales.\n\n## 3. Privacidad\nSu uso del servicio está sujeto a nuestra Política de Privacidad.\n\n## 4. Pago\nEl servicio se factura mensualmente a la tarifa acordada.\n\n## 5. Terminación\nCualquiera de las partes puede terminar con 30 días de aviso por escrito.\n\n## 6. Limitación de Responsabilidad\nLa responsabilidad de Calltide se limita al monto pagado por el servicio.\n\n## 7. Ley Aplicable\nEstos términos se rigen por las leyes del Estado de Texas.",
        effectiveDate: now,
      },
      {
        documentType: "privacy_policy",
        version: "1.0",
        title: "Privacy Policy",
        titleEs: "Política de Privacidad",
        content: "# Privacy Policy\n\n**Effective Date:** February 2026\n\n*Placeholder — have a licensed attorney draft this before launch.*\n\n## Information We Collect\n- Business contact information\n- Call recordings and transcripts\n- Appointment and scheduling data\n- Payment information (processed by Stripe)\n\n## How We Use Information\n- Providing AI receptionist services\n- Improving our AI models\n- Billing and account management\n- Compliance and legal obligations\n\n## Data Retention\n- Call transcripts: 12 months\n- Call metadata: 24 months\n- SMS content: 6 months\n- Consent records: 7 years\n\n## Your Rights\n- Access your data\n- Request deletion\n- Export your data\n- Opt out of SMS\n\n## Sub-Processors\nSee our Sub-Processor list at /legal/sub-processors\n\n## Contact\nsupport@calltide.app",
        contentEs: "# Política de Privacidad\n\n**Fecha de vigencia:** Febrero 2026\n\n*Marcador de posición — haga que un abogado con licencia redacte esto antes del lanzamiento.*\n\n## Información que Recopilamos\n- Información de contacto comercial\n- Grabaciones y transcripciones de llamadas\n- Datos de citas y programación\n- Información de pago (procesada por Stripe)\n\n## Cómo Usamos la Información\n- Proporcionar servicios de recepcionista AI\n- Mejorar nuestros modelos de AI\n- Facturación y gestión de cuentas\n- Cumplimiento y obligaciones legales\n\n## Retención de Datos\n- Transcripciones de llamadas: 12 meses\n- Metadatos de llamadas: 24 meses\n- Contenido SMS: 6 meses\n- Registros de consentimiento: 7 años\n\n## Sus Derechos\n- Acceder a sus datos\n- Solicitar eliminación\n- Exportar sus datos\n- Cancelar SMS\n\n## Sub-Procesadores\nVea nuestra lista en /legal/sub-processors\n\n## Contacto\nsupport@calltide.app",
        effectiveDate: now,
      },
      {
        documentType: "dpa",
        version: "1.0",
        title: "Data Processing Agreement",
        titleEs: "Acuerdo de Procesamiento de Datos",
        content: "# Data Processing Agreement\n\n**Effective Date:** February 2026\n\n*Placeholder — have a licensed attorney draft this before launch.*\n\nThis Data Processing Agreement (\"DPA\") forms part of the Terms of Service.\n\n## 1. Definitions\n- \"Personal Data\" means any information relating to an identified or identifiable person.\n- \"Processing\" means any operation performed on Personal Data.\n\n## 2. Scope\nCalltide processes Personal Data on behalf of the Client to provide AI receptionist services.\n\n## 3. Data Processing Details\n- **Categories of Data:** Phone numbers, names, call recordings, appointment details\n- **Purpose:** AI receptionist services, scheduling, SMS notifications\n- **Duration:** For the term of the service agreement plus retention periods\n\n## 4. Security Measures\n- Encryption in transit (TLS 1.2+)\n- Database encryption at rest\n- Access controls and authentication\n- Regular security reviews\n\n## 5. Sub-Processors\nSee /legal/sub-processors for current list.\n\n## 6. Data Subject Rights\nCalltide will assist Client in responding to data subject requests.\n\n## 7. Data Breach Notification\nCalltide will notify Client within 72 hours of a confirmed data breach.",
        contentEs: "# Acuerdo de Procesamiento de Datos\n\n**Fecha de vigencia:** Febrero 2026\n\n*Marcador de posición — haga que un abogado con licencia redacte esto antes del lanzamiento.*\n\nEste Acuerdo de Procesamiento de Datos (\"DPA\") forma parte de los Términos de Servicio.\n\n## 1. Definiciones\n- \"Datos Personales\" significa cualquier información relativa a una persona identificada o identificable.\n\n## 2. Alcance\nCalltide procesa Datos Personales en nombre del Cliente para proporcionar servicios de recepcionista AI.\n\n## 3. Detalles del Procesamiento\n- **Categorías de Datos:** Números de teléfono, nombres, grabaciones de llamadas, detalles de citas\n- **Propósito:** Servicios de recepcionista AI, programación, notificaciones SMS\n\n## 4. Medidas de Seguridad\n- Encriptación en tránsito (TLS 1.2+)\n- Encriptación de base de datos en reposo\n- Controles de acceso y autenticación\n\n## 5. Sub-Procesadores\nVea /legal/sub-processors para la lista actual.\n\n## 6. Derechos del Sujeto de Datos\nCalltide asistirá al Cliente en responder a solicitudes.\n\n## 7. Notificación de Brecha de Datos\nCalltide notificará al Cliente dentro de 72 horas de una brecha confirmada.",
        effectiveDate: now,
      },
    ];

    for (const doc of docs) {
      await db.insert(legalDocuments).values(doc).onConflictDoNothing();
    }

    // Seed sub-processors
    const processors = [
      { name: "Twilio", purpose: "Call routing, SMS delivery, phone number management", dataProcessed: ["phone_numbers", "sms_content", "call_metadata"], location: "United States", dpaUrl: "https://www.twilio.com/legal/data-protection-addendum" },
      { name: "Hume AI", purpose: "Voice AI processing for AI receptionist", dataProcessed: ["call_audio", "voice_data", "transcripts"], location: "United States", dpaUrl: "https://www.hume.ai/privacy" },
      { name: "Anthropic", purpose: "AI intelligence and natural language processing", dataProcessed: ["transcript_text", "conversation_context"], location: "United States", dpaUrl: "https://www.anthropic.com/legal/data-processing-agreement" },
      { name: "Turso (LibSQL)", purpose: "Database storage", dataProcessed: ["all_structured_data", "pii"], location: "United States", dpaUrl: "https://turso.tech/privacy-policy" },
      { name: "Vercel", purpose: "Application hosting and serverless functions", dataProcessed: ["request_logs", "ip_addresses"], location: "United States", dpaUrl: "https://vercel.com/legal/dpa" },
      { name: "Resend", purpose: "Email delivery", dataProcessed: ["email_addresses", "email_content"], location: "United States", dpaUrl: "https://resend.com/legal/dpa" },
    ];

    for (const proc of processors) {
      await db.insert(subProcessors).values({
        ...proc,
        lastReviewedAt: now,
      }).onConflictDoNothing();
    }

    return NextResponse.json({ ok: true, documents: docs.length, processors: processors.length });
  } catch (error) {
    console.error("Compliance seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
