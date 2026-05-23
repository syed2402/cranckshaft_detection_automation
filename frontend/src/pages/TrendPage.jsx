import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ShieldCheck } from "lucide-react";
import MetricCard from "../components/MetricCard";
import DecisionBadge from "../components/DecisionBadge";
import { getTrendData } from "../utils/api";
import { drawLineChart } from "../utils/canvasCharts";
import { useAppStore } from "../store/useAppStore";

function Chart({ title, data, color, yMin, yMax }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const draw = () => drawLineChart(ref.current, { data: data.map((y, i) => ({ x: `P${i + 1}`, y })), lineColor: color, dotColor: color, yMin, yMax, yTicks: [yMin, (yMin + yMax) / 2, yMax] });
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [data, color, yMin, yMax]);
  return <section className="rounded-[10px] border bg-white p-4"><h3 className="mb-3 text-[14px] font-semibold">{title}</h3><canvas ref={ref} className="h-[220px] w-full" /></section>;
}

export default function TrendPage() {
  const navigate = useNavigate();
  const { trendData, setTrendData } = useAppStore();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    getTrendData()
      .then((d) => {
        setTrendData(d);
        setSelected(d.at(-1)?.profile_id);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [setTrendData]);
  const selectedProfile = trendData.find((p) => p.profile_id === selected) || trendData.at(-1);
  const risk = useMemo(() => {
    if (selectedProfile?.risk_level) return selectedProfile.risk_level;
    return trendData.at(-1)?.risk_level || "stable";
  }, [selectedProfile, trendData]);
  if (loading) return <div className="grid gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-[10px] bg-gray-100" />)}</div>;
  return <div className="space-y-6"><div><h1 className="text-[24px] font-semibold">Trend analysis & historical comparison</h1><p className="mt-1 text-[13px] text-[#6b7280]">Last 24 profiles · Drift and stability assessment</p></div>
    {error ? <div className="rounded-[10px] border border-[#E24B4A] bg-[#FCEBEB] p-4 text-[13px] text-[#A32D2D]">{error}</div> : null}
    <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Overall trend status" value={risk.toUpperCase()} colorVariant={risk === "stable" ? "success" : "warning"} /><MetricCard label="Profiles reviewed" value={trendData.length} /><MetricCard label="Drift score" value={selectedProfile?.drift_score ?? 0} colorVariant={risk === "stable" ? "success" : "warning"} /><MetricCard label="Flagged profiles" value={trendData.filter((p) => p.decision !== "HIGH CONFIDENCE OK").length} colorVariant="warning" /></div>
    <section className="rounded-[10px] border bg-white p-4"><h2 className="text-[18px] font-semibold">Decision history - last 24 profiles</h2><div className="mt-4 flex gap-3 overflow-x-auto pb-2">{trendData.map((p, i) => <button key={p.profile_id} onClick={() => setSelected(p.profile_id)} className={`h-[100px] w-20 shrink-0 rounded-[10px] border bg-white p-3 text-left transition hover:scale-[1.02] ${selected === p.profile_id ? "border-2 border-[#1D9E75]" : "border-[#e5e7eb]"}`}><div className="text-[12px] font-semibold">P{i + 1}</div><div className="mt-3"><DecisionBadge decision={p.decision?.includes("OK") ? "OK" : p.decision?.includes("NOK") ? "NOK" : "REVIEW"} /></div><div className="mt-3 text-[11px] text-[#6b7280]">{new Date(p.timestamp).toLocaleDateString()}</div></button>)}</div>{selectedProfile ? <div className="mt-4 rounded bg-[#f9fafb] px-4 py-3 text-[13px]">Profile {selectedProfile.profile_name} · Decision: {selectedProfile.decision} · Crown integrity: {selectedProfile.crown_integrity} · Peak offset: {selectedProfile.peak_offset}mm</div> : null}</section>
    <div className="grid gap-6 xl:grid-cols-2"><Chart title="Crown integrity score" data={trendData.map((p) => p.crown_integrity)} color="#1D9E75" yMin={0} yMax={100} /><Chart title="Peak offset from center" data={trendData.map((p) => p.peak_offset)} color="#BA7517" yMin={-1.5} yMax={1.5} /><Chart title="Symmetry score trend" data={trendData.map((p) => p.symmetry_score)} color="#185FA5" yMin={60} yMax={100} /><Chart title="Plateau oscillation trend" data={trendData.map((p) => p.oscillation_score)} color="#534AB7" yMin={0} yMax={100} /></div>
    <section className="rounded-[10px] border bg-white p-5"><div className="grid gap-5 xl:grid-cols-3"><div className="rounded bg-[#E1F5EE] p-4"><ShieldCheck className="text-[#085041]" /><div className="mt-3 text-[12px] text-[#6b7280]">Process status</div><div className="text-[28px] font-medium text-[#085041]">{risk.toUpperCase()}</div></div><div><h3 className="font-semibold">Risk factors</h3><p className="mt-2 text-[13px] text-[#6b7280]">Computed from crown integrity trend, symmetry drift, oscillation trend, and peak offset trend.</p></div><div className="rounded bg-[#E1F5EE] p-4 text-[13px] text-[#085041]">Crown: {selectedProfile?.crown_integrity_trend || "stable"} · Symmetry drift: {selectedProfile?.symmetry_drift ?? 0} · Oscillation: {selectedProfile?.oscillation_trend || "stable"} · Peak offset: {selectedProfile?.peak_offset_trend || "stable"}</div></div></section>
    <div className="sticky bottom-0 flex justify-between border-t bg-[#f8f9fa]/95 py-4"><button onClick={() => navigate("/decision")} className="rounded-md border bg-white px-4 py-2">← Back to decision</button><button onClick={() => alert("Exporting trend report as PDF...")} className="rounded-md border bg-white px-4 py-2"><Download size={16} className="mr-2 inline" />Export trend report</button><button onClick={() => navigate("/overrides")} className="rounded-md bg-[#1D9E75] px-4 py-2 text-white">Continue to overrides →</button></div>
  </div>;
}
