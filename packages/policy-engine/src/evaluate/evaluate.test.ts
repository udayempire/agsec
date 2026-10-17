import { describe, expect, test } from "bun:test";
import { defaultPolicy } from "../default-policy";
import { evaluatePolicy } from "./evaluate";
import type { ToolCallRequest } from "@repo/shared";

function readFileRequest(path: string): ToolCallRequest {
  return {
    sessionId: "session-1",
    seq: 1,
    idempotencyKey: `idem-${path}`,
    tool: "read_file",
    args: {
      path,
    },
  };
}

describe("evaluatePolicy", () => {
  // test-case: allows reads from public files
  test("allows reads from public files", () => {
    const verdict = evaluatePolicy(readFileRequest("public/readme.txt"), defaultPolicy, {
      resource: {
        pathClass: "public",
      },
    });

    expect(verdict.decision).toBe("ALLOW");
    expect(verdict.matchedRules).toContain("FILE-ALLOW-001");
  });

  // test-case: blocks reads from secret files
  test("blocks reads from secret files", () => {
    const verdict = evaluatePolicy(readFileRequest("secrets/.env.fake"), defaultPolicy, {
      resource: {
        pathClass: "secret",
      },
    });

    expect(verdict.decision).toBe("BLOCK");
    expect(verdict.matchedRules).toContain("FILE-001");
  });

  // test-case: blocks unknown path classes by default
  test("blocks unknown path classes by default", () => {
    const verdict = evaluatePolicy(readFileRequest("unknown/file.txt"), defaultPolicy, {
      resource: {
        pathClass: "unknown",
      },
    });

    expect(verdict.decision).toBe("BLOCK");
    expect(verdict.matchedRules).toContain("DEFAULT-DENY");
  });
});
