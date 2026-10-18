"use client";

import { useEffect, useState } from "react";
import { AuditLog } from "./components/dashboard/audit-log";
import {
  Navigation,
  type DashboardTab,
} from "./components/dashboard/navigation";
import { OverviewPanel } from "./components/dashboard/overview-panel";
import { PoliciesPanel } from "./components/dashboard/policies-panel";
import { Card } from "./components/ui/card";
import type { AuditEvent, Stats } from "./components/dashboard/types";
import {
  createAuditStream,
  getAuditEvents,
  getAuditStats,
} from "./lib/agsec-client";

const emptyStats: Stats = {
  totalEvents: 0,
  executedEvents: 0,
  byDecision: { ALLOW: 0, BLOCK: 0, REQUIRE_APPROVAL: 0 },
  bySeverity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 },
  byTool: {},
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [connection, setConnection] = useState<
    "connecting" | "live" | "offline"
  >("connecting");
  const [error, setError] = useState<string | null>(null);
  const pageTitle: Record<DashboardTab, { title: string; subtitle: string }> = {
    overview: {
      title: "Overview",
      subtitle: "Runtime enforcement activity across your agent sessions.",
    },
    agents: {
      title: "Agents",
      subtitle: "Connected agents and their current security posture.",
    },
    policies: {
      title: "Policies",
      subtitle: "Policy rules observed in gateway decisions.",
    },
    audit: {
      title: "Audit log",
      subtitle: "Search and export recorded security decisions.",
    },
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [nextEvents, nextStats] = await Promise.all([
          getAuditEvents(),
          getAuditStats(),
        ]);
        if (!active) return;
        setEvents(nextEvents);
        setStats(nextStats);
        setError(null);
      } catch {
        if (active)
          setError(
            "Connect the API on port 3001 to load live security decisions.",
          );
      }
    };

    void load();
    const stream = createAuditStream();
    stream.addEventListener("ready", () => {
      if (active) setConnection("live");
    });
    stream.addEventListener("audit", (message) => {
      if (!active) return;
      const event = JSON.parse((message as MessageEvent).data) as AuditEvent;
      setEvents((current) =>
        [
          event,
          ...current.filter((item) => item.eventId !== event.eventId),
        ].slice(0, 1_000),
      );
      void getAuditStats().then((nextStats) => active && setStats(nextStats));
    });
    stream.onerror = () => active && setConnection("offline");

    return () => {
      active = false;
      stream.close();
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6 max-lg:min-h-0 max-lg:border-r-0 max-lg:border-b max-lg:px-5 max-lg:py-4">
          <div className="flex items-center gap-3 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-base font-black text-zinc-950 shadow-sm shadow-orange-950/30">
              A
            </span>
            <div>
              <div className="text-lg font-bold tracking-[-0.05em]">agsec</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Security gateway
              </div>
            </div>
          </div>
          <div className="mb-3 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600 max-lg:hidden">
            Workspace
          </div>
          <Navigation activeTab={activeTab} onChange={setActiveTab} />
          <div className="mt-auto pt-8 max-lg:hidden">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${connection === "live" ? "bg-emerald-500" : connection === "connecting" ? "bg-amber-400" : "bg-orange-500"}`}
                />
                <span className="text-xs font-medium text-zinc-200">
                  {connection === "live"
                    ? "Gateway connected"
                    : connection === "connecting"
                      ? "Connecting"
                      : "Gateway offline"}
                </span>
              </div>
              <p className="mt-2 pl-[18px] font-mono text-[10px] text-zinc-500">
                API · localhost:3001
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[10px] text-zinc-600">
              <span>AGSEC CONSOLE</span>
              <span>v0.1</span>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-[92px] items-center justify-between gap-4 border-b border-zinc-800 px-6 py-5 sm:px-8 lg:px-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Security operations /{" "}
                {activeTab === "audit" ? "audit log" : activeTab}
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-zinc-100">
                {pageTitle[activeTab].title}
              </h1>
              <p className="mt-1 text-xs text-zinc-500">
                {pageTitle[activeTab].subtitle}
              </p>
            </div>
            <div className="hidden items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${connection === "live" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.45)]" : connection === "connecting" ? "bg-amber-400" : "bg-orange-500"}`}
              />
              <span className="text-xs font-medium text-zinc-300">
                {connection === "live"
                  ? "Live"
                  : connection === "connecting"
                    ? "Connecting"
                    : "Offline"}
              </span>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1500px] px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            {error && (
              <div className="mb-6 rounded-lg border border-orange-900/70 bg-orange-950/30 px-4 py-3 text-sm text-orange-200">
                {error}
              </div>
            )}
            {activeTab === "overview" && <OverviewPanel events={events} />}
            {activeTab === "agents" && <AgentsPanel />}
            {activeTab === "policies" && <PoliciesPanel events={events} />}
            {activeTab === "audit" && <AuditLog events={events} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function AgentsPanel() {
  return (
    <Card className="grid min-h-[420px] place-items-center p-8 text-center">
      <div>
        <span className="text-4xl text-amber-400">◌</span>
        <h2 className="mt-4 text-lg font-semibold text-zinc-100">Agents</h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          No agent inventory is connected yet.
        </p>
      </div>
    </Card>
  );
}
