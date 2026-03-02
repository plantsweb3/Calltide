import { db } from "@/db";
import { receptionistCustomResponses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** Strip prompt-injection patterns from user-provided custom response text */
function sanitize(text: string, max = 256): string {
  return text
    .slice(0, max)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^(you are|ignore|disregard|forget|override|system:|assistant:|user:).*/gim, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

interface GroupedResponses {
  faq: Array<{ trigger: string; response: string }>;
  off_limits: Array<{ trigger: string; response: string | null }>;
  phrase: Array<{ trigger: string }>;
  emergency_keyword: Array<{ trigger: string }>;
}

export async function getCustomResponsesForPrompt(businessId: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(receptionistCustomResponses)
    .where(
      and(
        eq(receptionistCustomResponses.businessId, businessId),
        eq(receptionistCustomResponses.active, true),
      )
    )
    .orderBy(receptionistCustomResponses.sortOrder);

  if (rows.length === 0) return null;

  const grouped: GroupedResponses = {
    faq: [],
    off_limits: [],
    phrase: [],
    emergency_keyword: [],
  };

  for (const row of rows) {
    switch (row.category) {
      case "faq":
        grouped.faq.push({ trigger: sanitize(row.triggerText), response: sanitize(row.responseText || "", 2048) });
        break;
      case "off_limits":
        grouped.off_limits.push({ trigger: sanitize(row.triggerText), response: row.responseText ? sanitize(row.responseText) : null });
        break;
      case "phrase":
        grouped.phrase.push({ trigger: sanitize(row.triggerText) });
        break;
      case "emergency_keyword":
        grouped.emergency_keyword.push({ trigger: sanitize(row.triggerText, 100) });
        break;
    }
  }

  const blocks: string[] = [];

  if (grouped.faq.length > 0) {
    blocks.push(
      "## Custom FAQ Responses\nWhen the caller asks about these topics, use the provided response:\n" +
      grouped.faq.map((f) => `- **"${f.trigger}"** → "${f.response}"`).join("\n")
    );
  }

  if (grouped.off_limits.length > 0) {
    blocks.push(
      "## Off-Limits Topics\nDo NOT discuss these topics. If asked, politely redirect:\n" +
      grouped.off_limits
        .map((o) => `- "${o.trigger}"${o.response ? ` → Redirect: "${o.response}"` : ""}`)
        .join("\n")
    );
  }

  if (grouped.phrase.length > 0) {
    blocks.push(
      "## Preferred Phrases\nNaturally weave these phrases into your responses when appropriate:\n" +
      grouped.phrase.map((p) => `- "${p.trigger}"`).join("\n")
    );
  }

  if (grouped.emergency_keyword.length > 0) {
    blocks.push(
      "## Additional Emergency Keywords\nThese are ADDITIONAL triggers that should be treated as emergencies (follow Emergency Protocol):\n" +
      grouped.emergency_keyword.map((e) => `- "${e.trigger}"`).join("\n")
    );
  }

  return blocks.join("\n\n");
}
