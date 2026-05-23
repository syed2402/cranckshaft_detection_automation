const variants = {
  default: { bg: "#f9fafb", color: "#111827" },
  success: { bg: "#E1F5EE", color: "#085041" },
  warning: { bg: "#FAEEDA", color: "#854F0B" },
  danger: { bg: "#FCEBEB", color: "#A32D2D" },
};

export default function MetricCard({ label, value, subtext, colorVariant = "default" }) {
  const style = variants[colorVariant] || variants.default;
  return (
    <article className="rounded-[10px] border border-[#e5e7eb] p-4 transition hover:border-gray-300" style={{ backgroundColor: style.bg }}>
      <div className="text-[12px] font-medium text-[#6b7280]">{label}</div>
      <div className="mt-2 text-[28px] font-medium leading-none" style={{ color: style.color }}>{value}</div>
      {subtext ? <div className="mt-2 text-[12px] text-[#6b7280]">{subtext}</div> : null}
    </article>
  );
}
