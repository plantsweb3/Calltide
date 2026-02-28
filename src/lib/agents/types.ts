import type Anthropic from "@anthropic-ai/sdk";

export type AgentName = "support" | "qualify" | "churn" | "onboard" | "health" | "qa" | "success";

export type ActionType =
  | "email_sent"
  | "sms_sent"
  | "escalated"
  | "resolved"
  | "qualified"
  | "nudged"
  | "health_check"
  | "demo_created"
  | "qa_scored"
  | "report_sent"
  | "nps_sent"
  | "milestone"
  | "health_score_updated"
  | "annual_nudge_sent"
  | "outbound_call_scheduled"
  | "outbound_call_completed"
  | "handoff_created"
  | "handoff_processed"
  | "churn_recovery_followup"
  | "qa_handoff_processed";

export type TargetType = "client" | "prospect" | "system";

export interface AgentContext {
  agentName: AgentName;
  targetId?: string;
  targetType?: TargetType;
  trigger: string;
}

export interface AgentResult {
  actions: string[];
  escalated: boolean;
  toolsCalled: string[];
  summary: string;
}

export type ToolDefinition = Anthropic.Tool;

export type ToolExecutor = (
  toolName: string,
  input: Record<string, unknown>,
) => Promise<string>;
