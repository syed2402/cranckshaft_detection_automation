const styles = {
  "HIGH CONFIDENCE OK": "bg-[#E1F5EE] text-[#085041]",
  "REVIEW REQUIRED": "bg-[#FAEEDA] text-[#854F0B]",
  "HIGH CONFIDENCE NOK": "bg-[#FCEBEB] text-[#A32D2D]",
  OK: "bg-[#E1F5EE] text-[#085041]",
  REVIEW: "bg-[#FAEEDA] text-[#854F0B]",
  NOK: "bg-[#FCEBEB] text-[#A32D2D]",
};

export default function DecisionBadge({ decision = "REVIEW REQUIRED", size = "sm" }) {
  const key = String(decision).includes("NOK")
    ? String(decision).includes("HIGH") ? "HIGH CONFIDENCE NOK" : "NOK"
    : String(decision).includes("REVIEW")
      ? String(decision).includes("REQUIRED") ? "REVIEW REQUIRED" : "REVIEW"
      : String(decision).includes("OK")
        ? String(decision).includes("HIGH") ? "HIGH CONFIDENCE OK" : "OK"
        : decision;
  const padding = size === "lg" ? "px-4 py-2 text-[13px]" : size === "md" ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[10px]";
  return <span className={`rounded-full font-semibold ${padding} ${styles[key] || "bg-gray-100 text-gray-700"}`}>{decision}</span>;
}
