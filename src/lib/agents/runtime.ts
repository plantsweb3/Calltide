import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { db } from "@/db";
import { agentConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executeTool, logAgentActivity } from "./tools";
import { reportError } from "@/lib/error-reporting";
import type { AgentName, AgentResult, TargetType, ToolDefinition, ActionType } from "./types";

const CLAUDE_MODEL = env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";
const MAX_TOOL_ROUNDS = 5;

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// ── Core Agent Runner ──

export async function runAgent(params: {
  agentName: AgentName;
  systemPrompt: string;
  userMessage: string;
  tools: ToolDefinition[];
  targetId?: string;
  targetType?: TargetType;
  inputSummary?: string;
}): Promise<AgentResult> {
  const { agentName, systemPrompt, userMessage, tools, targetId, targetType, inputSummary } = params;

  // Check if agent is enabled
  const [config] = await db
    .select({ enabled: agentConfig.enabled })
    .from(agentConfig)
    .where(eq(agentConfig.agentName, agentName))
    .limit(1);

  if (config && !config.enabled) {
    return { actions: [], escalated: false, toolsCalled: [], summary: `Agent "${agentName}" is disabled` };
  }

  const anthropic = getAnthropic();
  const actions: string[] = [];
  const toolsCalled: string[] = [];
  let escalated = false;

  // Build initial messages
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  try {
    let round = 0;

    while (round < MAX_TOOL_ROUNDS) {
      round++;

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      });

      // Extract text blocks for summary
      const textBlocks = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text);

      // Extract tool use blocks
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      // No tool calls — agent is done
      if (toolUseBlocks.length === 0) {
        break;
      }

      // Execute each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          agentName,
        );

        toolsCalled.push(toolUse.name);
        actions.push(`${toolUse.name}: ${result}`);

        if (toolUse.name === "escalate_to_owner") {
          escalated = true;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Append assistant response + tool results for next round
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      // If the model indicated it's done (stop_reason is "end_turn"), break
      if (response.stop_reason === "end_turn") {
        break;
      }
    }

    // Build final summary from last text response
    const lastAssistant = messages
      .filter((m) => m.role === "assistant")
      .pop();

    let summary = "";
    if (lastAssistant && Array.isArray(lastAssistant.content)) {
      summary = (lastAssistant.content as Anthropic.ContentBlock[])
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    }

    if (!summary) {
      summary = actions.length > 0
        ? `Completed ${actions.length} action(s): ${toolsCalled.join(", ")}`
        : "No actions taken";
    }

    // Log activity
    const actionType = deriveActionType(toolsCalled, escalated);
    await logAgentActivity({
      agentName,
      actionType,
      targetId,
      targetType,
      inputSummary: inputSummary ?? userMessage.slice(0, 200),
      outputSummary: summary.slice(0, 500),
      toolsCalled: [...new Set(toolsCalled)],
      escalated,
      resolvedWithoutEscalation: !escalated && actions.length > 0,
    });

    // Update last run time
    await db
      .update(agentConfig)
      .set({ lastRunAt: new Date().toISOString() })
      .where(eq(agentConfig.agentName, agentName));

    return { actions, escalated, toolsCalled: [...new Set(toolsCalled)], summary };
  } catch (error) {
    reportError(`Agent ${agentName} runtime error`, error);

    // Record error in config
    await db
      .update(agentConfig)
      .set({
        lastErrorAt: new Date().toISOString(),
        lastErrorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(agentConfig.agentName, agentName));

    return {
      actions,
      escalated,
      toolsCalled: [...new Set(toolsCalled)],
      summary: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ── Helpers ──

function deriveActionType(toolsCalled: string[], escalated: boolean): ActionType {
  if (escalated) return "escalated";
  if (toolsCalled.includes("create_demo")) return "demo_created";
  if (toolsCalled.includes("update_prospect_status")) return "qualified";
  if (toolsCalled.includes("log_health_status")) return "health_check";
  if (toolsCalled.includes("send_email")) return "email_sent";
  if (toolsCalled.includes("send_sms")) return "sms_sent";
  if (toolsCalled.includes("update_churn_score")) return "nudged";
  return "resolved";
}
