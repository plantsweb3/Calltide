import { HumeClient } from "hume";
import "dotenv/config";

const hume = new HumeClient({
  apiKey: process.env.HUME_API_KEY!,
});

const tools = [
  {
    name: "check_availability",
    description:
      "Check available appointment slots for a specific date. Use this when a caller wants to schedule an appointment.",
    parameters: JSON.stringify({
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "The date to check availability for, in YYYY-MM-DD format",
        },
        service: {
          type: "string",
          description: "The service the caller is interested in (optional)",
        },
      },
      required: ["date"],
    }),
  },
  {
    name: "book_appointment",
    description:
      "Book an appointment for the caller. Use this after confirming the date, time, service, and caller name.",
    parameters: JSON.stringify({
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format",
        },
        time: {
          type: "string",
          description: "Appointment time in HH:MM 24-hour format",
        },
        service: {
          type: "string",
          description: "The service being booked",
        },
        caller_name: {
          type: "string",
          description: "The caller's name",
        },
      },
      required: ["date", "time", "service"],
    }),
  },
  {
    name: "take_message",
    description:
      "Take a message from the caller for the business owner. Use this when the caller wants to leave a message or when you can't help with their specific request.",
    parameters: JSON.stringify({
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message from the caller",
        },
        caller_name: {
          type: "string",
          description: "The caller's name (if provided)",
        },
      },
      required: ["message"],
    }),
  },
  {
    name: "transfer_to_human",
    description:
      "Transfer the caller to a human. Use this when the caller specifically asks to speak to a person, or when you cannot handle their request.",
    parameters: JSON.stringify({
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Why the caller wants to be transferred",
        },
      },
      required: [],
    }),
  },
];

async function setupTools() {
  console.log("Registering tools with Hume API...\n");

  for (const tool of tools) {
    try {
      const created = await hume.empathicVoice.tools.createTool({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
      console.log(`Created tool: ${tool.name} (ID: ${created?.id ?? "unknown"})`);
    } catch (error: unknown) {
      const err = error as { message?: string; body?: string };
      if (err.message?.includes("already exists") || err.body?.includes("already exists")) {
        console.log(`Tool ${tool.name} already exists, skipping.`);
      } else {
        console.error(`Failed to create tool ${tool.name}:`, error);
      }
    }
  }

  console.log("\nDone! Save the tool IDs for your EVI config.");
}

setupTools().catch(console.error);
