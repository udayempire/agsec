import type {
  Decision,
  Severity,
  ToolName,
} from "@repo/shared";

export type AuditEvent = {
  eventId: string;
  timestamp: string;
  sessionId: string;
  seq: number;
  idempotencyKey: string;
  tool: ToolName;
  decision: Decision;
  severity: Severity;
  matchedRules: string[];
  reason: string;
  executed: boolean;
  resourcePath?: string;
  resourceClass?: string;
  payloadBytes?: number;
};

export type AuditStore = {
  append(event: AuditEvent): Promise<void>;
  listRecent(limit?: number): Promise<AuditEvent[]>;
  getStats(): Promise<AuditStats>;
};

export type AuditStats = {
  totalEvents: number;
  executedEvents: number;
  byDecision: Record<Decision, number>;
  bySeverity: Record<Severity, number>;
  byTool: Partial<Record<ToolName, number>>;
};
