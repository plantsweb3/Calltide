import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { businesses } from "../src/db/schema";
import "dotenv/config";

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const db = drizzle(client);

  const testBusiness = {
    id: crypto.randomUUID(),
    name: "Rodriguez Plumbing & HVAC",
    type: "plumbing",
    ownerName: "Carlos Rodriguez",
    ownerPhone: "+12105551234",
    ownerEmail: "carlos@rodriguezplumbing.com",
    twilioNumber: process.env.TWILIO_PHONE_NUMBER || "+12105550000",
    // ElevenLabs agent will be created via syncAgent() after seeding
    services: [
      "Emergency Plumbing",
      "Drain Cleaning",
      "Water Heater Installation",
      "HVAC Repair",
      "AC Installation",
      "Pipe Repair",
    ],
    businessHours: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "17:00" },
      saturday: { open: "09:00", close: "14:00" },
      sunday: { open: "closed", close: "closed" },
    },
    timezone: "America/Chicago",
    defaultLanguage: "en",
    greeting: "Thank you for calling Rodriguez Plumbing & HVAC, this is Maria. How can I help you today?",
    greetingEs: "Gracias por llamar a Rodriguez Plumbing & HVAC, habla María. ¿En qué le puedo ayudar hoy?",
    serviceArea: "San Antonio and surrounding areas",
    additionalInfo: "We offer same-day emergency service for plumbing and HVAC issues. Licensed and insured. Family-owned since 2005.",
    active: true,
  };

  await db.insert(businesses).values(testBusiness).onConflictDoNothing();

  console.log("Seeded test business:", testBusiness.name);
  console.log("Business ID:", testBusiness.id);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
