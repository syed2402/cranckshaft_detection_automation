import MetricCard from "../components/MetricCard";

const sopThresholds = [
  ["Z1", "<= 0.500", "SOP roughness threshold"],
  ["Z2", "<= 0.500", "SOP roughness threshold"],
  ["Rk", "<= 1.200", "Core roughness limit"],
  ["Rpk", "<= 0.400", "Reduced peak height limit"],
  ["Crown height", "0.020 to 0.060", "Required crown envelope height"],
];

const decisionBands = [
  ["Crown integrity", "Review < 72, NOK < 55"],
  ["Symmetry", "Review < 68, NOK < 55"],
  ["Peak offset", "Review > 0.600 mm, NOK > 0.900 mm"],
  ["Oscillation", "Review > 35, NOK > 60"],
  ["Concavity", "Review when sustained, NOK at >= 3.000 mm length or >= 0.015 depth"],
  ["Dominant crown region", "Review < 55, NOK when < 42 with weak integrity"],
];

export default function ThresholdPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold">Thresholds & Config</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">Read-only deterministic PRD logic currently used by the decision engine.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Decision mode" value="DETERMINISTIC" colorVariant="success" />
        <MetricCard label="AI/ML logic" value="OFF" />
        <MetricCard label="Storage" value="SQLite" />
      </div>

      <section className="rounded-[10px] border bg-white p-5">
        <h2 className="text-[18px] font-semibold">SOP Thresholds</h2>
        <div className="mt-4 overflow-hidden rounded-[10px] border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f3f4f6] text-[10px] uppercase text-[#6b7280]">
              <tr><th className="px-4 py-3">Parameter</th><th>Limit</th><th>Purpose</th></tr>
            </thead>
            <tbody className="divide-y">
              {sopThresholds.map(([name, limit, purpose]) => (
                <tr key={name}><td className="px-4 py-3 font-medium">{name}</td><td>{limit}</td><td>{purpose}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[10px] border bg-white p-5">
        <h2 className="text-[18px] font-semibold">Decision Fusion Bands</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {decisionBands.map(([name, rule]) => (
            <div key={name} className="rounded border bg-[#f9fafb] p-4">
              <div className="font-semibold">{name}</div>
              <div className="mt-1 text-[13px] text-[#6b7280]">{rule}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
