import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import MetricCard from "../components/MetricCard";
import ProgressBar from "../components/ProgressBar";
import DecisionBadge from "../components/DecisionBadge";
import { useAppStore } from "../store/useAppStore";

function Tier({ title, sub, children }) {
  const [open, setOpen] = useState(true);
  return <section><button onClick={() => setOpen(!open)} className="flex w-full items-center rounded-[10px] border bg-white p-4 text-left"><span className="mr-4 h-12 w-[3px] bg-[#1D9E75]" /><span className="flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="text-[12px] text-[#6b7280]">{sub}</span></span><ChevronDown className={`transition ${open ? "" : "rotate-180"}`} /></button>{open ? <div className="mt-3">{children}</div> : null}</section>;
}

export default function FeaturePage() {
  const navigate = useNavigate();
  const f = useAppStore((s) => s.currentFeatures);
  if (!f) return <div className="rounded-[10px] border bg-white p-8">No features available. <Link className="text-[#1D9E75]" to="/upload">Upload a profile</Link>.</div>;
  const tier1 = [["Z1", f.z1, "≤ 0.500", f.z1_pass], ["Z2", f.z2, "≤ 0.500", f.z2_pass], ["Rk", f.rk, "≤ 1.200", f.rk_pass], ["Rpk", f.rpk, "≤ 0.400", f.rpk_pass], ["Crown height", f.crown_height, "0.020-0.060", f.crown_height_pass]];
  const scores = [["Crown integrity score", f.crown_integrity_score], ["Global convexity continuity", f.convexity_continuity], ["Center dominance", f.center_dominance], ["Symmetry score", f.symmetry_score], ["Envelope smoothness", f.envelope_smoothness], ["Edge transition smoothness", f.edge_smoothness]];
  return (
    <div className="space-y-5">
      <div><h1 className="text-[24px] font-semibold">Feature extraction report</h1><p className="mt-1 text-[13px] text-[#6b7280]">Smoothed macro geometry · All 4 tiers complete</p></div>
      <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Features extracted" value="18" /><MetricCard label="Tiers completed" value="4 / 4" /><MetricCard label="Anomalies detected" value={f.concavity_detected ? "1" : "0"} colorVariant="warning" /><MetricCard label="Threshold violations" value={[f.z1_pass, f.z2_pass, f.rk_pass, f.rpk_pass, f.crown_height_pass].filter(Boolean).length === 5 ? "0" : "1+"} colorVariant="success" /></div>
      <Tier title="Tier 1 - SOP threshold parameters" sub="Deterministic checks from SOP and roughness tester report"><div className="overflow-hidden rounded-[10px] border bg-white"><table className="w-full text-left text-[13px]"><thead className="bg-[#f3f4f6] text-[10px] uppercase text-[#6b7280]"><tr><th className="px-4 py-3">Parameter</th><th>Measured</th><th>Threshold</th><th>Status</th></tr></thead><tbody>{tier1.map((r) => <tr key={r[0]} className="border-t"><td className="px-4 py-3 font-medium">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td><DecisionBadge decision={r[3] ? "OK" : "NOK"} /></td></tr>)}</tbody></table></div></Tier>
      <Tier title="Tier 2 - Global crown geometry features" sub="Macro-envelope quality and continuity assessment"><div className="grid gap-4 md:grid-cols-3">{scores.map(([label, value]) => <article key={label} className="rounded-[10px] border bg-white p-4"><div className="text-[13px] font-medium">{label}</div><div className="mt-3 text-[24px] font-medium">{value}</div><div className="mt-4"><ProgressBar value={value} /></div></article>)}</div></Tier>
      <Tier title="Tier 3 - Peak structure features" sub="Dominant peak geometry and offset analysis"><div className="rounded-[10px] border bg-white p-4 grid gap-4 md:grid-cols-2 text-[13px]">{[["Peak X position", `${f.peak_x} mm`], ["Peak Y value", `${f.peak_y} μm`], ["Peak offset from center", `${f.peak_offset} mm`], ["Peak width", `${f.peak_width} mm`], ["Peak dominance score", `${f.peak_dominance}/100`], ["Multi-peak detected", f.multi_peak_detected ? "Yes" : "No"], ["Secondary peaks", f.secondary_peak_count]].map(([a, b]) => <div key={a} className="flex justify-between rounded bg-[#f9fafb] px-3 py-2"><span className="text-[#6b7280]">{a}</span><span className="font-medium">{b}</span></div>)}</div></Tier>
      <Tier title="Tier 4 - Local geometry features" sub="Concavity detection, classification and reasoning"><div className="rounded-[10px] border bg-white p-4 text-[13px] grid gap-3 md:grid-cols-2">{[["Concavity detected", f.concavity_detected ? "Yes" : "No"], ["Location range", `${f.concavity_start} - ${f.concavity_end} mm`], ["Horizontal span", `${f.concavity_length} mm`], ["Depth below envelope", `${f.concavity_depth} μm`], ["Location class", f.concavity_location], ["Isolated anomaly", f.concavity_isolated ? "Yes" : "No"], ["Plateau oscillation", `${f.plateau_oscillation}/100`]].map(([a, b]) => <div key={a} className="flex justify-between rounded bg-[#f9fafb] px-3 py-2"><span className="text-[#6b7280]">{a}</span><span className="font-medium">{b}</span></div>)}</div></Tier>
      <div className="sticky bottom-0 flex justify-between border-t bg-[#f8f9fa]/95 py-4"><button onClick={() => navigate("/graph")} className="rounded-md border bg-white px-4 py-2">← Back to graph</button><button onClick={() => navigate("/decision")} className="rounded-md bg-[#1D9E75] px-4 py-2 font-semibold text-white">Proceed to decision engine →</button></div>
    </div>
  );
}
