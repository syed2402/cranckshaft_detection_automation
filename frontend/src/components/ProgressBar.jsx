import { useEffect, useState } from "react";

export default function ProgressBar({ value = 0, animated = true }) {
  const [ready, setReady] = useState(!animated);
  useEffect(() => {
    if (!animated) return undefined;
    const id = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(id);
  }, [animated]);
  const color = value >= 80 ? "#1D9E75" : value >= 60 ? "#BA7517" : "#E24B4A";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: ready ? `${value}%` : "0%", backgroundColor: color }} />
    </div>
  );
}
