import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Banner from "../components/Banner";
import DecisionBadge from "../components/DecisionBadge";
import { submitOverride } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

function Ring({ score }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOn(true), 100); return () => clearTimeout(id); }, []);
  const c = 339.3; const filled = c * score / 100;
  return <svg width="120" height="120"><circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" /><circle cx="60" cy="60" r="54" fill="none" stroke="#BA7517" strokeWidth="10" strokeLinecap="round" strokeDasharray={on ? `${filled} ${c}` : `0 ${c}`} transform="rotate(-90 60 60)" className="transition-all duration-1000" /><text x="60" y="66" textAnchor="middle" fontSize="24" fontWeight="500">{score}%</text></svg>;
}

export default function DecisionPage() {
  const navigate = useNavigate();
  const { currentDecision, currentProfile } = useAppStore();
  const [operatorDecision, setOperatorDecision] = useState("review");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  if (!currentDecision) return <div className="rounded-[10px] border bg-white p-8">No decision available. <Link className="text-[#1D9E75]" to="/upload">Upload a profile</Link>.</div>;
  const decision = currentDecision.decision;
  const Icon = decision.includes("NOK") ? XCircle : decision.includes("OK") ? CheckCircle2 : AlertTriangle;
  const save = async () => { await submitOverride(currentProfile.profile_id, operatorDecision, notes, "Operator"); setSaved(true); setTimeout(() => setSaved(false), 4000); };
  return <div className="space-y-6"><div><h1 className="text-[24px] font-semibold">Decision engine output</h1><p className="mt-1 text-[13px] text-[#6b7280]">{currentProfile?.filename} · Geometric reasoning complete · Confidence scored</p></div>
    <section className="grid gap-6 rounded-xl border border-[#BA7517] bg-[#FAEEDA] p-6 lg:grid-cols-[1fr_360px]"><div className="flex gap-5"><Icon size={48} className="mt-8 text-[#BA7517]" /><div><div className="text-[12px] text-[#6b7280]">System decision</div><h2 className="mt-2 text-[32px] font-medium text-[#854F0B]">{decision}</h2><p className="mt-3 text-[14px] text-[#6b7280]">Decision produced by deterministic PRD geometry, concavity, confidence and explainability logic.</p></div></div><div className="rounded-[10px] bg-white/60 p-4 text-center"><div className="text-[12px] text-[#6b7280]">Confidence score</div><Ring score={Math.round(currentDecision.confidence)} /></div></section>
    <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-[10px] border bg-white p-4"><h2 className="font-semibold text-[#085041]">Positive factors</h2><div className="mt-3 space-y-2">{currentDecision.positive_factors.map((f) => <div key={f.factor} className="flex justify-between rounded border px-3 py-2 text-[13px]"><span>{f.factor}</span><span className="text-[#085041]">+{f.points}</span></div>)}</div></div><div className="rounded-[10px] border bg-white p-4"><h2 className="font-semibold text-[#A32D2D]">Negative factors</h2><div className="mt-3 space-y-2">{currentDecision.negative_factors.map((f) => <div key={f.factor} className="flex justify-between rounded border px-3 py-2 text-[13px]"><span>{f.factor}</span><span className="text-[#A32D2D]">{f.points}</span></div>)}</div></div></section>
    <section className="rounded-[10px] border bg-white p-5"><h2 className="text-[18px] font-semibold">Engineering reasoning</h2><div className="mt-4 space-y-3">{currentDecision.reasoning.map((r) => <article key={r.title} className="rounded border-l-4 bg-[#f9fafb] p-4" style={{ borderLeftColor: r.type === "nok" ? "#E24B4A" : r.type === "review" ? "#BA7517" : "#1D9E75" }}><div className="flex justify-between"><h3 className="font-semibold">{r.title}</h3><DecisionBadge decision={r.type === "nok" ? "NOK" : r.type === "review" ? "REVIEW" : "OK"} /></div><p className="mt-2 text-[13px] leading-6 text-[#6b7280]">{r.body}</p></article>)}</div></section>
    <section className="rounded-[10px] border bg-white p-5"><h2 className="text-[18px] font-semibold">Operator decision</h2>{saved ? <div className="mt-3"><Banner variant="success" message="Decision saved for auditability." /></div> : null}<div className="mt-4 grid gap-3 md:grid-cols-3">{["review", "ok", "nok"].map((d) => <button key={d} onClick={() => setOperatorDecision(d)} className={`h-10 rounded-md border font-semibold ${operatorDecision === d ? "bg-[#1D9E75] text-white" : "bg-white"}`}>{d.toUpperCase()}</button>)}</div><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-4 w-full rounded border p-3 text-[13px]" placeholder="Operator notes" /><div className="mt-3 text-right"><button onClick={save} className="rounded-md bg-[#1D9E75] px-4 py-2 text-white">Save decision</button></div></section>
    <div className="sticky bottom-0 flex justify-between border-t bg-[#f8f9fa]/95 py-4"><button onClick={() => navigate("/features")} className="rounded-md border bg-white px-4 py-2">← Back to feature extraction</button><button onClick={() => navigate("/trend")} className="rounded-md bg-[#1D9E75] px-4 py-2 text-white">Proceed to trend analysis →</button></div>
  </div>;
}
