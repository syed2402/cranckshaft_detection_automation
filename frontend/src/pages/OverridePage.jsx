import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import DecisionBadge from "../components/DecisionBadge";
import MetricCard from "../components/MetricCard";
import { getAllProfiles, getStats, submitOverride } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

function featureFindings(profile) {
  const f = profile.features || {};
  const findings = [];
  if (typeof f.peak_offset === "number") findings.push(`Peak offset ${f.peak_offset > 0 ? "+" : ""}${f.peak_offset}mm`);
  if (typeof f.symmetry_score === "number") findings.push(`Symmetry ${f.symmetry_score}/100`);
  if (typeof f.concavity_depth === "number" && f.concavity_depth > 0) findings.push(`Concavity depth ${f.concavity_depth}`);
  if (typeof f.oscillation_score === "number") findings.push(`Oscillation ${f.oscillation_score}/100`);
  if (typeof f.multi_peak_score === "number" && f.multi_peak_score > 0) findings.push("Multi-peak instability");
  return findings.slice(0, 3);
}

function Table({ rows }) {
  return (
    <div className="overflow-hidden rounded-[10px] border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead className="bg-[#f3f4f6] text-[10px] uppercase text-[#6b7280]">
            <tr>{["ID", "File name", "Timestamp", "Decision", "Confidence", "Crown", "Peak offset", "Override", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{p.id}</td>
                <td className="font-medium">{p.profile_name}</td>
                <td>{new Date(p.timestamp).toLocaleString()}</td>
                <td><DecisionBadge decision={p.decision || "UNANALYZED"} /></td>
                <td>{p.confidence ? `${p.confidence}%` : "-"}</td>
                <td>{p.features?.crown_integrity_score ?? "-"}</td>
                <td>{p.features?.peak_offset ?? "-"}</td>
                <td>{p.operator_override ? <span className="rounded-full bg-[#FAEEDA] px-2 py-1 text-[10px] text-[#854F0B]">Overridden</span> : "-"}</td>
                <td><button onClick={() => alert(`Viewing profile ID ${p.id} - ${p.profile_name}`)} className="rounded border px-3 py-1">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OverridePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { allProfiles, setAllProfiles } = useAppStore();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "database" ? "database" : "overrides");
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [overrideNotes, setOverrideNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "database" ? "database" : "overrides");
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllProfiles(), getStats()])
      .then(([profiles, nextStats]) => {
        setAllProfiles(profiles);
        setStats(nextStats);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [setAllProfiles]);

  const pending = allProfiles.filter((p) => ["REVIEW REQUIRED", "HIGH CONFIDENCE NOK"].includes(p.decision) && !p.operator_override);
  const resolved = allProfiles.filter((p) => p.operator_override);
  const filtered = useMemo(
    () => allProfiles.filter((p) => p.profile_name?.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || p.decision?.toLowerCase().includes(filter))),
    [allProfiles, query, filter]
  );

  const resolve = async (profile, decision) => {
    await submitOverride(profile.id, decision, overrideNotes[profile.id] || "", "Operator");
    setAllProfiles(await getAllProfiles());
  };

  const exportCsv = () => {
    const csv = ["id,file,timestamp,decision,confidence,override", ...allProfiles.map((p) => [p.id, p.profile_name, p.timestamp, p.decision, p.confidence, p.operator_override ? "yes" : "no"].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "crankshaft_profiles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="border-b">
        <button onClick={() => setSearchParams({})} className={`mr-6 pb-3 font-semibold ${activeTab === "overrides" ? "border-b-2 border-[#1D9E75] text-[#1D9E75]" : "text-[#6b7280]"}`}>Operator overrides</button>
        <button onClick={() => setSearchParams({ tab: "database" })} className={`pb-3 font-semibold ${activeTab === "database" ? "border-b-2 border-[#1D9E75] text-[#1D9E75]" : "text-[#6b7280]"}`}>Profile database</button>
      </div>
      {error ? <div className="rounded-[10px] border border-[#E24B4A] bg-[#FCEBEB] p-4 text-[13px] text-[#A32D2D]">{error}</div> : null}
      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-[10px] bg-gray-100" />)}</div>
      ) : activeTab === "overrides" ? (
        <>
          <div>
            <h1 className="text-[24px] font-semibold">Operator override workflow</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Review and manage operator decisions. All overrides stored for auditability and future learning.</p>
          </div>
          <section>
            <h2 className="mb-3 text-[18px] font-semibold">Pending review <span className="rounded-full bg-[#FAEEDA] px-2 py-1 text-[11px] text-[#854F0B]">{pending.length} pending</span></h2>
            <div className="space-y-4">
              {pending.map((p) => (
                <article key={p.id} className="rounded-xl border bg-white p-5" style={{ borderLeft: `4px solid ${p.decision?.includes("NOK") ? "#E24B4A" : "#BA7517"}` }}>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{p.profile_name}</div>
                      <div className="text-[12px] text-[#6b7280]">{new Date(p.timestamp).toLocaleString()} - {p.point_count ?? "-"} points</div>
                    </div>
                    <DecisionBadge decision={p.decision} />
                  </div>
                  <div className="mt-4 text-[12px]">System confidence: {p.confidence}%</div>
                  <div className="mt-3 flex flex-wrap gap-2">{featureFindings(p).map((x) => <span key={x} className="rounded-full bg-gray-100 px-2 py-1 text-[11px]">{x}</span>)}</div>
                  <textarea rows={2} value={overrideNotes[p.id] || ""} onChange={(e) => setOverrideNotes({ ...overrideNotes, [p.id]: e.target.value })} className="mt-4 w-full rounded border p-3 text-[13px]" placeholder="Override reason or review comments" />
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <button onClick={() => resolve(p, "review")} className="rounded border border-[#BA7517] py-2 text-[#854F0B]">Confirm Review</button>
                    <button onClick={() => resolve(p, "ok")} className="rounded border border-[#1D9E75] py-2 text-[#085041]">Mark as OK</button>
                    <button onClick={() => resolve(p, "nok")} className="rounded border border-[#E24B4A] py-2 text-[#A32D2D]">Mark as NOK</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section><h2 className="mb-3 text-[18px] font-semibold">Recently resolved</h2><Table rows={resolved} /></section>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total overrides" value={resolved.length} />
            <MetricCard label="Override rate" value={`${stats?.override_rate ?? 0}%`} />
            <MetricCard label="Agreement rate" value={`${stats?.agreement_rate ?? 0}%`} colorVariant="success" />
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-[24px] font-semibold">Profile database</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">All ingested profiles with features, decisions and metadata. SQLite backend - PRD Section 18.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Total profiles" value={stats?.total_profiles ?? allProfiles.length} />
            <MetricCard label="Storage used" value={`${(((stats?.storage_used ?? 0) / 1024 / 1024).toFixed(1))} MB`} />
            <MetricCard label="Date range" value={stats?.date_range?.length ? "available" : "-"} />
            <MetricCard label="Last updated" value={allProfiles[0] ? new Date(allProfiles[0].timestamp).toLocaleDateString() : "-"} />
          </div>
          <section className="flex gap-3 rounded-[10px] border bg-white p-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by filename..." className="flex-1 rounded border px-3 text-[13px]" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded border px-3 text-[13px]"><option value="all">All decisions</option><option value="ok">OK</option><option value="review">Review</option><option value="nok">NOK</option></select>
            <button onClick={exportCsv} className="rounded border px-4 text-[13px]"><Download size={16} className="mr-2 inline" />Export CSV</button>
          </section>
          <Table rows={filtered} />
          <div className="text-[13px] text-[#6b7280]">Showing {filtered.length} of {allProfiles.length} profiles</div>
          <section className="rounded-[10px] border border-[#B5D4F4] bg-[#E6F1FB] p-4">
            <h2 className="font-semibold text-[#0C447C]">Features table (PRD Section 18)</h2>
            <pre className="mt-3 rounded bg-white/70 p-4 text-[12px]">{`features {
  profile_id       -> FK to profiles.id
  crown_integrity  -> float
  symmetry_score   -> float
  peak_offset      -> float (mm)
  peak_dominance   -> float
  concavity_length -> float (mm)
  concavity_depth  -> float (um)
  oscillation_score-> float
  multi_peak_score -> float
}`}</pre>
          </section>
        </>
      )}
      <div className="sticky bottom-0 flex justify-between border-t bg-[#f8f9fa]/95 py-4">
        <button onClick={() => navigate("/trend")} className="rounded-md border bg-white px-4 py-2">Back to trend analysis</button>
        <button onClick={exportCsv} className="rounded-md border bg-white px-4 py-2">Export full report</button>
        <button onClick={() => navigate("/upload")} className="rounded-md bg-[#1D9E75] px-4 py-2 text-white">Upload new profile</button>
      </div>
    </div>
  );
}
