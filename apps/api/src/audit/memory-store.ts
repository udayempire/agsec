import type { AuditEvent, AuditStore } from "./store";

const DEFAULT_MAX_EVENTS = 1_000;

export class MemoryAuditStore implements AuditStore {
  private readonly events: AuditEvent[] = [];

  constructor(private readonly maxEvents = DEFAULT_MAX_EVENTS) {
    if (!Number.isInteger(maxEvents) || maxEvents < 1) {
      throw new Error("maxEvents must be a positive integer");
    }
  }

  async append(event: AuditEvent): Promise<void> {
    // Copy mutable fields so callers cannot change an event after it is stored.
    this.events.push({
      ...event,
      matchedRules: [...event.matchedRules],
    });

    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
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
}

export const auditStore = new MemoryAuditStore();
