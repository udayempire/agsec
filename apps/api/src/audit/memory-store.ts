import type {
  AuditEvent,
  AuditEventListener,
  AuditStats,
  AuditStore,
} from "./store";

const DEFAULT_MAX_EVENTS = 1_000;

export class MemoryAuditStore implements AuditStore {
  events: AuditEvent[] = [];
  maxEvents: number;
  listeners: Set<AuditEventListener> = new Set();

  constructor(maxEvents = DEFAULT_MAX_EVENTS) {
    if (!Number.isInteger(maxEvents) || maxEvents < 1) {
      throw new Error("maxEvents must be a positive integer");
    }

    this.maxEvents = maxEvents;
  }

  async append(event: AuditEvent): Promise<void> {
    // Copy mutable fields so callers cannot change an event after it is stored.
    const storedEvent = {
      ...event,
      matchedRules: [...event.matchedRules],
    };

    this.events.push(storedEvent);

    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }

    for (const listener of this.listeners) {
      listener({
        ...storedEvent,
        matchedRules: [...storedEvent.matchedRules],
      });
    }
  }

  async listRecent(limit = 100): Promise<AuditEvent[]> {
    const safeLimit = Math.max(0, Math.min(Math.floor(limit), this.maxEvents));

    return this.events
      .slice(-safeLimit)
      .reverse()
      .map((event) => ({
        ...event,
        matchedRules: [...event.matchedRules],
      }));
  }

  async getStats(): Promise<AuditStats> {
    const stats: AuditStats = {
      totalEvents: this.events.length,
      executedEvents: 0,
      byDecision: {
        ALLOW: 0,
        BLOCK: 0,
        REQUIRE_APPROVAL: 0,
      },
      bySeverity: {
        info: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byTool: {},
    };

    for (const event of this.events) {
      if (event.executed) stats.executedEvents += 1;
      stats.byDecision[event.decision] += 1;
      stats.bySeverity[event.severity] += 1;
      stats.byTool[event.tool] = (stats.byTool[event.tool] ?? 0) + 1;
    }

    return stats;
  }

  subscribe(listener: AuditEventListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const auditStore = new MemoryAuditStore();
