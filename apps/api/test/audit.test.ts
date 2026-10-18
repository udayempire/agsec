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
});
