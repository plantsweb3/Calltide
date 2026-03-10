import { NextResponse } from "next/server";
import { db } from "@/db";
import { helpCategories } from "@/db/schema";
import { count } from "drizzle-orm";

const SEED_CATEGORIES = [
  { slug: "getting-started", name: "Getting Started", nameEs: "Primeros Pasos", description: "Set up your account and get Maria answering calls", descriptionEs: "Configura tu cuenta y pon a María a contestar llamadas", icon: "🚀", sortOrder: 1 },
  { slug: "managing-calls", name: "Managing Calls", nameEs: "Administrar Llamadas", description: "Understand how Maria handles your calls day to day", descriptionEs: "Entiende cómo María maneja tus llamadas día a día", icon: "📞", sortOrder: 2 },
  { slug: "billing-account", name: "Billing & Account", nameEs: "Facturación y Cuenta", description: "Payments, invoices, and subscription management", descriptionEs: "Pagos, facturas y gestión de suscripción", icon: "💳", sortOrder: 3 },
  { slug: "troubleshooting", name: "Troubleshooting", nameEs: "Solución de Problemas", description: "Fix common issues and get back on track", descriptionEs: "Resuelve problemas comunes y vuelve a la normalidad", icon: "🔧", sortOrder: 4 },
  { slug: "features-tips", name: "Features & Tips", nameEs: "Funciones y Consejos", description: "Get the most out of Capta and Maria", descriptionEs: "Aprovecha al máximo Capta y María", icon: "⭐", sortOrder: 5 },
  { slug: "for-prospects", name: "Learn About AI Receptionists", nameEs: "Aprende Sobre Recepcionistas AI", description: "Understand how AI receptionists can help your business", descriptionEs: "Entiende cómo una recepcionista AI puede ayudar a tu negocio", icon: "💡", sortOrder: 6 },
];

export async function POST() {
  const [existing] = await db.select({ c: count() }).from(helpCategories);
  if (existing.c > 0) {
    return NextResponse.json({ message: "Categories already seeded", count: existing.c });
  }

  await db.insert(helpCategories).values(SEED_CATEGORIES);
  return NextResponse.json({ message: "Seeded 6 help categories", count: 6 });
}
