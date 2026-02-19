import { HumeClient, Hume } from "hume";
import "dotenv/config";

const hume = new HumeClient({
  apiKey: process.env.HUME_API_KEY!,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://calltide.vercel.app";

async function setupConfig() {
  console.log("Creating EVI config...\n");

  // List existing tools to get their IDs
  const toolsPage = await hume.empathicVoice.tools.listTools({ pageSize: 100 });
  const tools: (Hume.empathicVoice.ReturnUserDefinedTool | undefined)[] = [];
  for await (const tool of toolsPage) {
    tools.push(tool);
  }

  const toolNames = ["check_availability", "book_appointment", "take_message", "transfer_to_human"];
  const toolIds = toolNames
    .map((name) => {
      const found = tools.find((t) => t?.name === name);
      if (!found) {
        console.warn(`Tool "${name}" not found. Run setup-hume-tools.ts first.`);
        return null;
      }
      return { id: found.id };
    })
    .filter((t): t is { id: string } => t !== null);

  console.log(`Found ${toolIds.length} tools.`);

  try {
    const config = await hume.empathicVoice.configs.createConfig({
      name: "calltide-voice-agent",
      eviVersion: "3",
      voice: {
        name: "KORA",
      },
      tools: toolIds,
      eventMessages: {
        onNewChat: {
          enabled: true,
          text: "",
        },
        onInactivityTimeout: {
          enabled: true,
          text: "Are you still there? I'm here to help if you need anything.",
        },
        onMaxDurationTimeout: {
          enabled: true,
          text: "I've reached the maximum call duration. Please call back if you need more help. Goodbye!",
        },
      },
      languageModel: {
        modelProvider: "CUSTOM_LANGUAGE_MODEL",
        modelResource: `${APP_URL}/api/clm/chat/completions` as Hume.empathicVoice.LanguageModelType,
      },
      webhooks: [
        {
          url: `${APP_URL}/api/webhooks/hume`,
          events: ["chat_started", "chat_ended", "tool_call"],
        },
      ],
    });

    console.log(`\nEVI Config created!`);
    console.log(`Config ID: ${config?.id}`);
    console.log(`\nAdd this to your .env.local:`);
    console.log(`HUME_CONFIG_ID=${config?.id}`);
    console.log(`\nTwilio webhook URL:`);
    console.log(`https://api.hume.ai/v0/evi/twilio?config_id=${config?.id}&api_key=${process.env.HUME_API_KEY}`);
  } catch (error) {
    console.error("Failed to create config:", error);
  }
}

setupConfig().catch(console.error);
