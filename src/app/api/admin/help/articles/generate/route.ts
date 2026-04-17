import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getAnthropic, isAnthropicConfigured, SONNET_MODEL } from "@/lib/ai/client";

const generateSchema = z.object({
  title: z.string().min(1).max(300),
  titleEs: z.string().max(300).optional(),
  category: z.string().max(100).optional(),
  keyPoints: z.array(z.string().max(500)).max(20).optional(),
  audience: z.string().max(50).optional(),
});

const ARTICLE_SYSTEM_PROMPT = `You are a bilingual help center content writer for Capta, a bilingual AI receptionist service for Hispanic home service businesses in Texas.

Company context:
- Capta provides an AI receptionist named Maria that answers calls in English and Spanish 24/7
- Service costs $497/month
- Target audience: plumbers, HVAC techs, electricians, landscapers, and other home service businesses
- Maria books appointments, sends SMS confirmations, and handles after-hours calls
- Clients access a dashboard to view calls, appointments, SMS logs, and referrals

Write a help center article in BOTH English and Spanish. The article should be:
- Clear, concise, and helpful
- Written at a 6th-grade reading level
- Include step-by-step instructions where applicable
- Use markdown formatting (headings, lists, bold for emphasis)
- Practical and actionable

Return a JSON object with these exact fields:
{
  "title": "English title",
  "titleEs": "Spanish title",
  "excerpt": "One-sentence English summary",
  "excerptEs": "One-sentence Spanish summary",
  "content": "Full English markdown content",
  "contentEs": "Full Spanish markdown content",
  "metaTitle": "SEO title (English, max 60 chars)",
  "metaTitleEs": "SEO title (Spanish, max 60 chars)",
  "metaDescription": "SEO description (English, max 155 chars)",
  "metaDescriptionEs": "SEO description (Spanish, max 155 chars)",
  "searchKeywords": "comma,separated,english,keywords",
  "searchKeywordsEs": "comma,separated,spanish,keywords"
}

Return ONLY valid JSON, no extra text.`;

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = generateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }
  const { title, titleEs, category, keyPoints, audience } = parsed.data;

  if (!isAnthropicConfigured()) {
    return NextResponse.json({ error: "Article generation is temporarily unavailable." }, { status: 503 });
  }

  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model: env.CLAUDE_MODEL ?? SONNET_MODEL,
    max_tokens: 4096,
    system: ARTICLE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          title,
          titleEs: titleEs || undefined,
          category,
          keyPoints: keyPoints || undefined,
          audience: audience || "existing_clients",
        }),
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const article = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Failed to parse generated article" }, { status: 500 });
  }
}
