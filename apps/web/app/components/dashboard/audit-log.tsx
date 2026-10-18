import { useMemo, useState } from "react";
import { EmptyTable, formatTime, VerdictBadge } from "./overview-panel";
import type { AuditEvent, Decision, Severity } from "./types";
import { Button } from "../ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

export function AuditLog({ events }: { events: AuditEvent[] }) {
  const [decision, setDecision] = useState<"all" | Decision>("all");
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (decision === "all" || event.decision === decision) &&
          (severity === "all" || event.severity === severity) &&
          `${event.tool} ${event.reason} ${event.sessionId} ${event.resourcePath ?? ""} ${event.matchedRules.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [decision, events, query, severity],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            Compliance trail
          </p>
          <CardTitle className="mt-1">Audit log</CardTitle>
          <CardDescription>
            {filtered.length} of {events.length} retained audit events
          </CardDescription>
        </div>
        <Button
          className="text-xs"
          onClick={() => exportAudit(filtered)}
          variant="outline"
          size="sm"
        >
          Export CSV
        </Button>
      </CardHeader>
      <div className="grid gap-3 border-b border-zinc-800 bg-zinc-900/50 p-5 md:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <Input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search action, rule, or reason"
          value={query}
        />
        <Filter
          label="Verdict"
          onChange={(value) => setDecision(value as "all" | Decision)}
          options={["all", "ALLOW", "BLOCK", "REQUIRE_APPROVAL"]}
          value={decision}
        />
        <Filter
          label="Severity"
          onChange={(value) => setSeverity(value as "all" | Severity)}
          options={["all", "info", "low", "medium", "high", "critical"]}
          value={severity}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyTable label="No audit events match these filters." />
      ) : (
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="sticky top-0 bg-zinc-950 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Policy</th>
                <th className="px-5 py-4">Severity</th>
                <th className="px-5 py-4">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr
                  className="border-t border-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-900/50"
                  key={event.eventId}
                >
                  <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                    {formatTime(event.timestamp)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-amber-300">
                      {event.tool}
                    </p>
                    <p className="mt-1 max-w-60 truncate text-[11px] text-zinc-500">
                      {event.reason}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-yellow-300">
                    {event.matchedRules.join(", ")}
                  </td>
                  <td className="px-5 py-4 text-xs capitalize text-zinc-400">
                    {event.severity}
                  </td>
                  <td className="px-5 py-4">
                    <VerdictBadge decision={event.decision} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Filter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
      {label}
      <Select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? `All ${label.toLowerCase()}s` : option}
          </option>
        ))}
      </Select>
    </label>
  );
}

function exportAudit(events: AuditEvent[]) {
  const header = [
    "timestamp",
    "session_id",
    "sequence",
    "action",
    "verdict",
    "severity",
    "rules",
    "executed",
  ];
  const rows = events.map((event) => [
    event.timestamp,
    event.sessionId,
    event.seq,
    event.tool,
    event.decision,
    event.severity,
    event.matchedRules.join(";"),
    event.executed,
  ]);
  const csv = [header, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agsec-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
