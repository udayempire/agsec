import { defaultPolicy, evaluatePolicy } from "@repo/policy-engine";
import {
  ReadFileArgsSchema,
  ToolCallRequestSchema,
  type PolicyVerdict,
} from "@repo/shared";
import { resolveSandboxPath } from "../executor/sandbox";
import { runAuthorizedAction } from "../executor";
import { authorizeAction } from "./authorize";

export type GatewayResult = {
  verdict: PolicyVerdict;
  executed: boolean;
  result?: unknown;
};

export async function handleToolCall(input: unknown): Promise<GatewayResult> {
  try {
    const request = ToolCallRequestSchema.parse(input);

    let pathClass: "public" | "secret" | "unknown" | undefined;

    if (request.tool === "read_file") {
      const args = ReadFileArgsSchema.parse(request.args);
      const resolved = await resolveSandboxPath(args.path);
      pathClass = resolved.pathClass;
    }

    const verdict = evaluatePolicy(request, defaultPolicy, {
      resource: { pathClass },
    });

    if (verdict.decision !== "ALLOW") {
      return {
        verdict,
        executed: false,
      };
    }

    const action = authorizeAction(request, verdict);
    const result = await runAuthorizedAction(action);

    return {
      verdict,
      executed: true,
      result,
    };
  } catch (error) {
    return {
      verdict: {
        decision: "BLOCK",
        severity: "high",
        matchedRules: ["SYS-FAIL-CLOSED"],
        reason: error instanceof Error ? error.message : "Gateway failed closed",
      },
      executed: false,
    };
  }
}
