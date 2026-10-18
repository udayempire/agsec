import type { PolicyVerdict, ToolCallRequest } from "@repo/shared";

const authorizedActionBrand: unique symbol = Symbol("AuthorizedAction");

export type AuthorizedAction = Pick<ToolCallRequest, "tool" | "args"> & {
  readonly [authorizedActionBrand]: true;
};

export function authorizeAction(
  request: ToolCallRequest,
  verdict: PolicyVerdict,
): AuthorizedAction {
  if (verdict.decision !== "ALLOW") {
    throw new Error(`Action not authorized: ${verdict.decision}`);
  }

  return {
    tool: request.tool,
    args: request.args,
    [authorizedActionBrand]: true,
  };
}
