import { CheckCircle2, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function BreadCrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProfile, currentFeatures, currentDecision } = useAppStore();
  const steps = [
    { label: "Upload", route: "/upload", done: !!currentProfile },
    { label: "Graph", route: "/graph", done: !!currentProfile },
    { label: "Features", route: "/features", done: !!currentFeatures },
    { label: "Decision", route: "/decision", done: !!currentDecision },
    { label: "Trend", route: "/trend", done: true },
    { label: "Overrides", route: "/overrides", done: true },
  ];
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#e5e7eb] text-[13px]">
      {steps.map((step, index) => {
        const current = location.pathname === step.route;
        const clickable = step.done || current;
        return (
          <span key={step.route} className="flex items-center gap-3">
            <button
              disabled={!clickable}
              onClick={() => clickable && navigate(step.route)}
              className={`relative flex items-center gap-1 pb-3 font-medium ${current ? "text-[#085041]" : clickable ? "text-[#1D9E75] hover:text-[#085041]" : "text-[#6b7280]"}`}
            >
              {step.done && !current ? <CheckCircle2 size={13} /> : null}
              {step.label}
              {current ? <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#1D9E75]" /> : null}
            </button>
            {index < steps.length - 1 ? <ChevronRight size={14} className="mb-3 text-gray-300" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
