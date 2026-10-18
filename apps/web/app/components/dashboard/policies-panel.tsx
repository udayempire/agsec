import type { AuditEvent } from "./types";
import { EmptyTable, VerdictBadge } from "./overview-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function PoliciesPanel({ events }: { events: AuditEvent[] }) {
  const policiesByRule = new Map();
  for (const event of events) {
    for (const rule of event.matchedRules) {
      if (!policiesByRule.has(rule)) {
        policiesByRule.set(rule, {
          rule,
          decision: event.decision,
          severity: event.severity,
          reason: event.reason,
          timestamp: event.timestamp,
        });
      }
    }
  }
  const policies = [...policiesByRule.values()];
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          User policy decisions
        </p>
        <CardTitle className="mt-1">Applied policies</CardTitle>
        <CardDescription className="mt-2 max-w-2xl">
          Latest decisions observed for each policy rule in the audit stream.
          User managed policy configuration is not exposed by the API yet.
        </CardDescription>
      </CardHeader>
      {policies.length === 0 ? (
        <EmptyTable label="Policies will appear after the first audited decision." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-900/60 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-6 py-3.5">Policy rule</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Latest decision</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr
                  className="border-t border-zinc-900 transition-colors hover:bg-zinc-900/50"
                  key={policy.rule}
                >
                  <td className="px-6 py-4 font-mono text-xs text-yellow-300">
                    {policy.rule}
                  </td>
                  <td className="max-w-[420px] truncate px-6 py-4 text-xs text-zinc-400">
                    {policy.reason}
                  </td>
                  <td className="px-6 py-4 text-xs capitalize text-zinc-400">
                    {policy.severity}
                  </td>
                  <td className="px-6 py-4">
                    <VerdictBadge decision={policy.decision} />
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
