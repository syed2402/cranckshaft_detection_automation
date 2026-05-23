import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ToggleSwitch from "../components/ToggleSwitch";
import { useAppStore } from "../store/useAppStore";
import { drawProfileGraph } from "../utils/canvasCharts";

export default function GraphPage() {
  const canvasRef = useRef(null);
  const [deviationMode, setDeviationMode] = useState(false);
  const navigate = useNavigate();
  const { currentProfile, currentFeatures, currentDecision, layerVisibility, setLayerVisibility } = useAppStore();
  useEffect(() => {
    if (!currentProfile || !canvasRef.current) return;
    const draw = () => drawProfileGraph(canvasRef.current, {
      rawPoints: currentProfile.raw_points,
      smoothedPoints: currentProfile.smoothed_points,
      profile: currentProfile,
      layerVisibility,
      anomalyZones: currentDecision?.anomaly_zones || [],
      peakX: currentFeatures?.peak_x,
      peakY: currentFeatures?.peak_y,
      rk: currentFeatures?.rk,
      rpk: currentFeatures?.rpk,
      deviationMode,
      centerX: (currentProfile.x_range[0] + currentProfile.x_range[1]) / 2,
      xRange: currentProfile.x_range,
      yRange: currentProfile.y_range,
    });
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [currentProfile, currentFeatures, currentDecision, layerVisibility, deviationMode]);
  if (!currentProfile) return <div className="rounded-[10px] border bg-white p-8">No profile loaded. <Link className="text-[#1D9E75]" to="/upload">Upload a profile</Link>.</div>;
  const layers = [["l1", "Raw X,Y trace", "#111827"], ["l2", "Smoothed reference", "#1D9E75"], ["l3", "Center reference", "#6b7280"], ["l4", "Dominant peak", "#185FA5"], ["l5", "Peak offset", "#BA7517"], ["l6", "Detected concavity", "#E24B4A"], ["l7", "End points", "#B4B2A9"]];
  return (
    <div className="grid gap-6">
      <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
        <h1 className="text-[18px] font-semibold">Crowning profile graph</h1>
        <p className="mt-1 text-[12px] text-[#6b7280]">{currentProfile.filename} · {currentProfile.point_count} points · Reconstructed</p>
        <canvas ref={canvasRef} className="mt-4 aspect-[2.08/1] w-full min-h-[520px] max-h-[680px]" />
      </section>
      <aside className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-[10px] border bg-white p-4">
          <h2 className="text-[15px] font-semibold">Graph layers</h2>
          <div className="mt-4 flex items-center justify-between border-b border-[#e5e7eb] pb-3">
            <span className="text-[13px]">Deviation zoom</span>
            <ToggleSwitch checked={deviationMode} colorDot="#185FA5" onChange={setDeviationMode} />
          </div>
          <div className="mt-4 space-y-3">{layers.map(([key, name, color], i) => <div key={key} className="flex items-center justify-between"><span className="text-[13px]"><span className="mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">L{i + 1}</span>{name}</span><ToggleSwitch checked={layerVisibility[key]} colorDot={color} onChange={(v) => setLayerVisibility(key, v)} /></div>)}</div>
        </section>
        <section className="rounded-[10px] border bg-white p-4 text-[13px]"><h2 className="mb-3 text-[15px] font-semibold">File metadata</h2>{[["File", currentProfile.filename], ["Data points", currentProfile.point_count], ["X range", currentProfile.x_range.join(" - ")], ["Y range", currentProfile.y_range.map((v) => v.toFixed(4)).join(" - ")], ["Interval", currentProfile.sampling_interval.toFixed(3)]].map(([a, b]) => <div key={a} className="flex justify-between py-1"><span className="text-[#6b7280]">{a}</span><span>{b}</span></div>)}</section>
        <section className="rounded-[10px] border bg-white p-4 text-[13px]"><h2 className="mb-3 text-[15px] font-semibold">Graph stats</h2>{currentFeatures ? [["Peak X", `${currentFeatures.peak_x} mm`], ["Peak Y", `${currentFeatures.peak_y} μm`], ["Offset", `${currentFeatures.peak_offset} mm`], ["Concavities", currentFeatures.concavity_detected ? "1" : "0"]].map(([a, b]) => <div key={a} className="flex justify-between py-1"><span className="text-[#6b7280]">{a}</span><span>{b}</span></div>) : null}</section>
        <button onClick={() => navigate("/features")} className="h-11 w-full rounded-md bg-[#1D9E75] text-[13px] font-semibold text-white">Proceed to feature extraction →</button>
      </aside>
    </div>
  );
}
