import type { AuditEvent, Stats } from "../components/dashboard/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getAuditEvents(limit = 1_000): Promise<AuditEvent[]> {
  const response = await fetch(`${API_URL}/admin/events?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Unable to load audit events");
  }

  const payload = (await response.json()) as { events: AuditEvent[] };
  return payload.events;
}

export async function getAuditStats(): Promise<Stats> {
  const response = await fetch(`${API_URL}/admin/stats`);

  if (!response.ok) {
    throw new Error("Unable to load audit statistics");
  }

  return (await response.json()) as Stats;
}

export function createAuditStream(): EventSource {
  return new EventSource(`${API_URL}/admin/stream`);
}
