const variants = {
  info: "border-[#B5D4F4] bg-[#E6F1FB] text-[#0C447C]",
  success: "border-[#1D9E75] bg-[#E1F5EE] text-[#085041]",
  warning: "border-[#BA7517] bg-[#FAEEDA] text-[#854F0B]",
  danger: "border-[#E24B4A] bg-[#FCEBEB] text-[#A32D2D]",
};

export default function Banner({ variant = "info", icon: Icon, title, message, children }) {
  return (
    <div className={`flex gap-3 rounded-[10px] border p-4 ${variants[variant]}`}>
      {Icon ? <Icon size={18} className="mt-0.5 shrink-0" /> : null}
      <div>
        {title ? <div className="text-[13px] font-semibold">{title}</div> : null}
        <p className="text-[13px] leading-6">{message || children}</p>
      </div>
    </div>
  );
}
