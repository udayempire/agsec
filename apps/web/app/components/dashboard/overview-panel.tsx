import type { AuditEvent } from "./types";
import { Card, CardHeader, CardTitle } from "../ui/card";

export function OverviewPanel({ events }: { events: AuditEvent[] }) {
  const today = new Date().toDateString();
  const todayEvents = events.filter(
    (event) => new Date(event.timestamp).toDateString() === today,
  );
  const blocks = todayEvents.filter(
    (event) => event.decision === "BLOCK",
  ).length;
  const approvals = todayEvents.filter(
    (event) => event.decision === "REQUIRE_APPROVAL",
  ).length;

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-3">
        <Metric
          label="Decisions today"
          value={todayEvents.length}
          detail="audited tool calls"
          accent="orange"
        />
        <Metric
          label="Blocks"
          value={blocks}
          detail="unsafe actions stopped"
          accent="red"
        />
        <Metric
          label="Approvals"
          value={approvals}
          detail="awaiting human review"
          accent="yellow"
        />
      </section>
      <Card className="overflow-hidden">
        <CardHeader className="items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Runtime activity
            </p>
            <CardTitle className="mt-1">Recent history</CardTitle>
          </div>
          <span className="rounded-md bg-zinc-900 px-2 py-1 font-mono text-[10px] text-zinc-400">
            LIVE AUDIT
          </span>
        </CardHeader>
        <HistoryTable events={events.slice(0, 8)} />
      </Card>
    </div>
  );
}

export function HistoryTable({ events }: { events: AuditEvent[] }) {
  if (events.length === 0)
    return <EmptyTable label="No audit events have been recorded yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-zinc-900/70 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <tr>
            <th className="px-6 py-3.5">Time</th>
            <th className="px-6 py-3.5">Action</th>
            <th className="px-6 py-3.5">Resource</th>
            <th className="px-6 py-3.5">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              className="border-t border-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-900/40"
              key={event.eventId}
            >
              <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                {formatTime(event.timestamp)}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-amber-300">
                {event.tool}
              </td>
              <td className="max-w-[260px] truncate px-6 py-4 text-xs text-zinc-400">
                {event.resourcePath ?? event.resourceClass ?? "—"}
              </td>
              <td className="px-6 py-4">
                <VerdictBadge decision={event.decision} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VerdictBadge({
  decision,
}: {
  decision: AuditEvent["decision"];
}) {
  const tone =
    decision === "ALLOW"
      ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-300"
      : decision === "BLOCK"
        ? "border-orange-900/70 bg-orange-950/40 text-orange-300"
        : "border-yellow-900/70 bg-yellow-950/40 text-yellow-200";
  return (
    <span
      className={`inline-flex min-w-[72px] justify-center rounded-md border px-2 py-1 font-mono text-[10px] font-semibold ${tone}`}
    >
      {decision}
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  accent: "orange" | "red" | "yellow";
}) {
  const accentColor = {
    orange: "bg-orange-500",
    red: "bg-orange-700",
    yellow: "bg-yellow-300",
  }[accent];
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        {label}
        <span className={`h-2 w-2 rounded-full ${accentColor}`} />
      </div>
      <strong className="mt-6 block text-4xl font-semibold tracking-[-0.06em] text-zinc-100">
        {value}
      </strong>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </Card>
  );
}

export function EmptyTable({ label }: { label: string }) {
  return (
    <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-zinc-500">
      {label}
    </div>
  );
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
