import { Clock3, Database, Gauge, History, LineChart, PanelLeft, SlidersHorizontal, Upload } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProfile, currentFeatures, currentDecision } = useAppStore();
  const items = [
    { id: "upload", label: "Upload Profile", icon: Upload, route: "/upload" },
    { id: "graph", label: "Graph Viewer", icon: LineChart, route: "/graph", disabled: !currentProfile },
    { id: "feature", label: "Feature Extraction", icon: SlidersHorizontal, route: "/features", disabled: !currentFeatures },
    { id: "decision", label: "Decision Details", icon: Gauge, route: "/decision", disabled: !currentDecision },
    { id: "historical", label: "Historical Profiles", icon: History, route: "/trend", badge: 24 },
    { id: "trend", label: "Trend Analysis", icon: Clock3, route: "/trend" },
    { id: "overrides", label: "Operator Overrides", icon: PanelLeft, route: "/overrides", badge: 3 },
    { id: "database", label: "Profile Database", icon: Database, route: "/overrides?tab=database" },
    { id: "thresholds", label: "Thresholds & Config", icon: SlidersHorizontal, route: "/thresholds" },
  ];
  const sections = [["Workspace", items.slice(0, 4)], ["History", items.slice(4, 7)], ["System", items.slice(7)]];
  return (
    <aside className="fixed bottom-0 left-0 top-16 z-20 w-[240px] overflow-y-auto border-r border-[#e5e7eb] bg-white px-3 py-5">
      {sections.map(([section, navItems]) => (
        <div key={section} className="mb-6">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">{section}</div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const [path, query] = item.route.split("?");
              const active =
                location.pathname === path &&
                (!query || location.search === `?${query}`) &&
                (item.id !== "overrides" || location.search !== "?tab=database");
              return (
                <button
                  key={item.id}
                  title={item.disabled ? "Complete previous step first" : item.label}
                  disabled={item.disabled}
                  onClick={() => navigate(item.route)}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13px] font-medium transition ${
                    active ? "bg-[#E1F5EE] text-[#085041]" : item.disabled ? "cursor-not-allowed text-gray-300" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={16} /><span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{item.badge}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
