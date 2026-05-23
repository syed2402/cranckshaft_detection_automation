import { Bell, Settings, UserCircle, Waves } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export default function TopBar() {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const buttonClass = "flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800";
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-white px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1D9E75] text-white"><Waves size={20} /></div>
        <div className="leading-tight">
          <div className="text-[13px] font-medium text-gray-900">Crankshaft Profile DIS</div>
          <div className="text-[11px] text-[#6b7280]">{currentProfile?.filename || "Decision Intelligence System"}</div>
        </div>
        <div className="mx-1 h-7 w-px bg-[#e5e7eb]" />
        <span className="rounded-full bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-semibold text-[#085041]">Pilot V1</span>
      </div>
      <div className="flex items-center gap-1">
        <button className={buttonClass} aria-label="Notifications"><Bell size={18} /></button>
        <button className={buttonClass} aria-label="Settings"><Settings size={18} /></button>
        <button className={buttonClass} aria-label="User"><UserCircle size={20} /></button>
      </div>
    </header>
  );
}
