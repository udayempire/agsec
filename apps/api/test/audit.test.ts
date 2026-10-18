import { describe, expect, it } from "bun:test";
import { auditStore, MemoryAuditStore } from "../src/audit/memory-store";
import { handleToolCall } from "../src/gateway/handle";

describe("audit store", () => {
  it("keeps only the configured number of recent events", async () => {
    const store = new MemoryAuditStore(2);
    const base = {
      timestamp: new Date().toISOString(),
      sessionId: "session-test",
      seq: 1,
      idempotencyKey: "key-test",
      tool: "read_file" as const,
      decision: "BLOCK" as const,
      severity: "high" as const,
      matchedRules: ["TEST"],
      reason: "test",
      executed: false,
    };

    await store.append({ ...base, eventId: "1" });
    await store.append({ ...base, eventId: "2" });
    await store.append({ ...base, eventId: "3" });

    expect((await store.listRecent()).map((event) => event.eventId)).toEqual([
      "3",
      "2",
    ]);

    const stats = await store.getStats();
    expect(stats.totalEvents).toBe(2);
    expect(stats.byDecision.BLOCK).toBe(2);
    expect(stats.byTool.read_file).toBe(2);
  });

  it("audits both allowed and blocked gateway decisions without content", async () => {
    const sessionId = `audit-test-${crypto.randomUUID()}`;
    await handleToolCall({
      sessionId,
      seq: 1,
      idempotencyKey: "public-read",
      tool: "read_file",
      args: { path: "public/readme.txt" },
    });
    await handleToolCall({
      sessionId,
      seq: 2,
      idempotencyKey: "secret-read",
      tool: "read_file",
      args: { path: "secrets/.env.fake" },
    });

    const events = (await auditStore.listRecent(100)).filter(
      (event) => event.sessionId === sessionId,
    );

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      seq: 2,
      decision: "BLOCK",
      matchedRules: ["FILE-001"],
      executed: false,
      resourcePath: "secrets/.env.fake",
      resourceClass: "secret",
    });
    expect(events[1]).toMatchObject({
      seq: 1,
      decision: "ALLOW",
      matchedRules: ["FILE-ALLOW-001"],
      executed: true,
      resourcePath: "public/readme.txt",
      resourceClass: "public",
    });
    expect(JSON.stringify(events)).not.toContain("content");
  });

  it("simulates safe commands and allowlisted HTTP without performing either action", async () => {
    const sessionId = `simulation-test-${crypto.randomUUID()}`;

    const command = await handleToolCall({
      sessionId,
      seq: 1,
      idempotencyKey: "safe-command",
      tool: "run_command",
      args: { argv: ["echo", "hello"] },
    });
    const http = await handleToolCall({
      sessionId,
      seq: 2,
      idempotencyKey: "safe-http",
      tool: "http_send",
      args: { url: "http://localhost/health", method: "GET" },
    });

    expect(command).toMatchObject({
      executed: true,
      verdict: { decision: "ALLOW", matchedRules: ["CMD-ALLOW-001"] },
    });
    expect(command.result).toEqual({
      simulated: true,
      argv: ["echo", "hello"],
      command: "echo hello",
      exitCode: 0,
    });
    expect(http).toMatchObject({
      executed: true,
      verdict: { decision: "ALLOW", matchedRules: ["NET-ALLOW-001"] },
    });
    expect(http.result).toEqual({
      simulated: true,
      method: "GET",
      host: "localhost",
      status: 202,
      payloadBytes: 0,
    });
  });

  it("blocks dangerous commands and secret-read followed by allowlisted egress", async () => {
    const dangerous = await handleToolCall({
      sessionId: `dangerous-test-${crypto.randomUUID()}`,
      seq: 1,
      idempotencyKey: "dangerous-command",
      tool: "run_command",
      args: { argv: ["rm", "-rf", "/"] },
    });

    const sessionId = `exfil-test-${crypto.randomUUID()}`;
    await handleToolCall({
      sessionId,
      seq: 1,
      idempotencyKey: "secret-read",
      tool: "read_file",
      args: { path: "secrets/.env.fake" },
    });
    const exfiltration = await handleToolCall({
      sessionId,
      seq: 2,
      idempotencyKey: "egress",
      tool: "http_send",
      args: {
        url: "http://localhost/collect",
        method: "POST",
        body: "sensitive-looking payload",
      },
    });

    expect(dangerous).toMatchObject({
      executed: false,
      verdict: { decision: "BLOCK", matchedRules: ["CMD-001"] },
    });
    expect(exfiltration).toMatchObject({
      executed: false,
      verdict: { decision: "BLOCK" },
    });
    expect(exfiltration.verdict.matchedRules).toEqual(
      expect.arrayContaining(["SEQ-001", "NET-ALLOW-001"]),
    );
  });
});
