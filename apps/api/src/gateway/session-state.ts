import type { HttpSendArgs, ToolCallRequest } from "@repo/shared";
import type { SessionHistoryEntry } from "@repo/policy-engine";

const MAX_ENTRIES_PER_SESSION = 100;

export class SessionStateStore {
  sessions: Map<string, SessionHistoryEntry[]> = new Map();

  getHistory(sessionId: string): readonly SessionHistoryEntry[] {
    return this.sessions.get(sessionId) ?? [];
  }

  record(request: ToolCallRequest, pathClass?: string): void {
    const history = this.sessions.get(request.sessionId) ?? [];
    const entry: SessionHistoryEntry = {
      tool: request.tool,
      pathClass,
      destination: getDestination(request),
      timestamp: Date.now(),
    };

    history.push(entry);

    if (history.length > MAX_ENTRIES_PER_SESSION) {
      history.splice(0, history.length - MAX_ENTRIES_PER_SESSION);
    }

    this.sessions.set(request.sessionId, history);
  }
}

function getDestination(request: ToolCallRequest): string | undefined {
  if (request.tool !== "http_send") return undefined;

  try {
    return new URL((request.args as HttpSendArgs).url).hostname;
  } catch {
    return undefined;
  }
}

export const sessionState = new SessionStateStore();
