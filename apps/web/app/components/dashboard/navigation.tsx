export type DashboardTab = "overview" | "agents" | "policies" | "audit";

const tabs: Array<{ id: DashboardTab; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "agents", label: "Agents", icon: "◌" },
  { id: "policies", label: "Policies", icon: "⌁" },
  { id: "audit", label: "Audit log", icon: "≡" },
];

export function Navigation({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  return (
    <nav
      className="mt-2 flex flex-col gap-1 max-lg:mt-4 max-lg:flex-row max-lg:overflow-x-auto"
      aria-label="Dashboard navigation"
    >
      {tabs.map((tab) => (
        <button
          className={`flex items-center gap-3 whitespace-nowrap rounded-lg border-l-2 px-3 py-3 text-[13px] font-medium transition-colors max-lg:border-b-2 max-lg:border-l-0 ${activeTab === tab.id ? "border-orange-500 bg-orange-500/[0.08] text-zinc-100" : "border-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          <span
            className={
              activeTab === tab.id ? "text-amber-400" : "text-zinc-600"
            }
          >
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
