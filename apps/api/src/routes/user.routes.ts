import { Router } from "express";
import { auditStore } from "../audit/postgres-store";
import { handleToolCall } from "../gateway/handle";

export const userRouter = Router();

userRouter.post("/v1/tool-calls", async (req, res) => {
  if (!req.is("application/json")) {
    res.status(400).json({
      verdict: {
        decision: "BLOCK",
        severity: "high",
        matchedRules: ["SYS-FAIL-CLOSED"],
        reason: "Content-Type must be application/json",
      },
      executed: false,
    });
    return;
  }

  try {
    const result = await handleToolCall(req.body as unknown, auditStore);
    const status = result.verdict.decision === "ALLOW" ? 200 : 403;
    res.status(status).json(result);
  } catch (error) {
    res.status(400).json({
      verdict: {
        decision: "BLOCK",
        severity: "high",
        matchedRules: ["SYS-FAIL-CLOSED"],
        reason:
          error instanceof Error ? error.message : "Request failed closed",
      },
      executed: false,
    });
  }
});
