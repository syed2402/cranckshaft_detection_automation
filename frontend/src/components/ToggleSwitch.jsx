export default function ToggleSwitch({ checked, onChange, label, colorDot }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="flex items-center gap-2">
      {colorDot ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorDot }} /> : null}
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#1D9E75]" : "bg-gray-300"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
