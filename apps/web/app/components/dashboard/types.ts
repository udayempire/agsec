export type Decision = "ALLOW" | "BLOCK" | "REQUIRE_APPROVAL";
export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type AuditEvent = {
  eventId: string;
  timestamp: string;
  sessionId: string;
  seq: number;
  tool: string;
  decision: Decision;
  severity: Severity;
  matchedRules: string[];
  reason: string;
  executed: boolean;
  resourcePath?: string;
  resourceClass?: string;
  payloadBytes?: number;
};

export type Stats = {
  totalEvents: number;
  executedEvents: number;
  byDecision: Record<Decision, number>;
  bySeverity: Record<Severity, number>;
  byTool: Record<string, number>;
};
