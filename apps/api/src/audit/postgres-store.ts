import { prisma } from "@repo/database";
import type {
  AuditEvent,
  AuditEventListener,
  AuditStats,
  AuditStore,
} from "./store";

export class PostgresAuditStore implements AuditStore {
  private listeners = new Set<AuditEventListener>();

  async append(event: AuditEvent): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.agentSession.upsert({
        where: { sessionId: event.sessionId },
        create: { sessionId: event.sessionId },
        update: {},
      });

      await transaction.auditEvent.create({
        data: {
          ...event,
          timestamp: new Date(event.timestamp),
          matchedRules: event.matchedRules,
        },
      });
    });

    for (const listener of this.listeners) {
      listener({ ...event, matchedRules: [...event.matchedRules] });
    }
  }

  async listRecent(limit = 100): Promise<AuditEvent[]> {
    const events = await prisma.auditEvent.findMany({
      orderBy: [{ timestamp: "desc" }, { seq: "desc" }],
      take: Math.max(0, Math.floor(limit)),
    });

    return events.map((event) => {
      const {
        resourcePath,
        resourceClass,
        payloadBytes,
        matchedRules,
        timestamp,
        ...fields
      } = event;

      return {
        ...fields,
        timestamp: timestamp.toISOString(),
        matchedRules: Array.isArray(matchedRules)
          ? matchedRules.filter((rule): rule is string => typeof rule === "string")
          : [],
        ...(resourcePath !== null ? { resourcePath } : {}),
        ...(resourceClass !== null ? { resourceClass } : {}),
        ...(payloadBytes !== null ? { payloadBytes } : {}),
      };
    });
  }

  async getStats(): Promise<AuditStats> {
    const [totalEvents, executedEvents, decisions, severities, tools] =
      await Promise.all([
        prisma.auditEvent.count(),
        prisma.auditEvent.count({ where: { executed: true } }),
        prisma.auditEvent.groupBy({ by: ["decision"], _count: { _all: true } }),
        prisma.auditEvent.groupBy({ by: ["severity"], _count: { _all: true } }),
        prisma.auditEvent.groupBy({ by: ["tool"], _count: { _all: true } }),
      ]);

    const stats: AuditStats = {
      totalEvents,
      executedEvents,
      byDecision: { ALLOW: 0, BLOCK: 0, REQUIRE_APPROVAL: 0 },
      bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 },
      byTool: {},
    };

    for (const row of decisions) stats.byDecision[row.decision] = row._count._all;
    for (const row of severities) stats.bySeverity[row.severity] = row._count._all;
    for (const row of tools) stats.byTool[row.tool] = row._count._all;

    return stats;
  }

  subscribe(listener: AuditEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const auditStore = new PostgresAuditStore();
