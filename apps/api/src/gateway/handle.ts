import { defaultPolicy, evaluatePolicy } from "@repo/policy-engine";
import {
  HttpSendArgsSchema,
  ReadFileArgsSchema,
  ToolCallRequestSchema,
  type PolicyVerdict,
} from "@repo/shared";
import { resolveSandboxPath } from "../executor/sandbox";
import { runAuthorizedAction } from "../executor";
import { auditStore } from "../audit/memory-store";
import type { AuditEvent, AuditStore } from "../audit/store";
import { authorizeAction } from "./authorize";
import type { ToolCallRequest } from "@repo/shared";
import { sessionState } from "./session-state";

export type GatewayResult = {
  verdict: PolicyVerdict;
  executed: boolean;
  result?: unknown;
};

export async function handleToolCall(
  input: unknown,
  store: AuditStore = auditStore,
): Promise<GatewayResult> {
  let request: ToolCallRequest | undefined;
  let resourcePath: string | undefined;
  let resourceClass: string | undefined;
  let payloadBytes: number | undefined;

  const audit = async (
    verdict: PolicyVerdict,
    executed: boolean,
  ): Promise<void> => {
    if (!request) return;

    const event: AuditEvent = {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: request.sessionId,
      seq: request.seq,
      idempotencyKey: request.idempotencyKey,
      tool: request.tool,
      decision: verdict.decision,
      severity: verdict.severity,
      matchedRules: [...verdict.matchedRules],
      reason: verdict.reason,
      executed,
      ...(resourcePath ? { resourcePath } : {}),
      ...(resourceClass ? { resourceClass } : {}),
      ...(payloadBytes !== undefined ? { payloadBytes } : {}),
    };

    await store.append(event);
  };

  try {
    request = ToolCallRequestSchema.parse(input);
    const now = Date.now();

    if (request.tool === "read_file") {
      const args = ReadFileArgsSchema.parse(request.args);
      const resolved = await resolveSandboxPath(args.path);
      resourcePath = resolved.relativePath;
      resourceClass = resolved.pathClass;
    }

    if (request.tool === "http_send") {
      const args = HttpSendArgsSchema.parse(request.args);
      payloadBytes = new TextEncoder().encode(args.body ?? "").byteLength;
    }

    const verdict = evaluatePolicy(request, defaultPolicy, {
      resource: { pathClass: resourceClass },
      sessionHistory: sessionState.getHistory(request.sessionId),
      now,
    });

    if (verdict.decision !== "ALLOW") {
      await audit(verdict, false);
      sessionState.record(request, resourceClass);
      return {
        verdict,
        executed: false,
      };
    }

    const action = authorizeAction(request, verdict);
    const result = await runAuthorizedAction(action);

    await audit(verdict, true);
    sessionState.record(request, resourceClass);

    return {
      verdict,
      executed: true,
      result,
    };
  } catch (error) {
    const verdict: PolicyVerdict = {
      decision: "BLOCK",
      severity: "high",
      matchedRules: ["SYS-FAIL-CLOSED"],
      reason: error instanceof Error ? error.message : "Gateway failed closed",
    };

    if (request) {
      await audit(verdict, false);
      sessionState.record(request, resourceClass);
    }

    return {
      verdict,
      executed: false,
    };
  }
}
