import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Trash2, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Banner from "../components/Banner";
import DecisionBadge from "../components/DecisionBadge";
import { analyzeProfile, deleteProfile, getAllProfiles, getProfile, uploadProfile } from "../utils/api";
import { useAppStore } from "../store/useAppStore";

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [recent, setRecent] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const store = useAppStore();
  const file = store.uploadedFile;
  const loading = ["uploading", "analyzing"].includes(store.processingStatus);

  useEffect(() => {
    getAllProfiles().then(setRecent).catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    if (!toast || toast.sticky) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectFile = useCallback((nextFile) => {
    store.setUploadedFile(nextFile);
    store.setErrorMessage("");
  }, [store]);

  const process = async () => {
    if (!file) return;
    try {
      store.setProcessingStatus("uploading");
      const profile = await uploadProfile(file);
      store.setCurrentProfile(profile);
      store.setProcessingStatus("analyzing");
      const analyzed = await analyzeProfile(profile.profile_id);
      store.setCurrentFeatures(analyzed.features);
      store.setCurrentDecision(analyzed.decision);
      store.setProcessingStatus("complete");
      navigate("/graph");
    } catch (error) {
      store.setProcessingStatus("error");
      store.setErrorMessage(error.message);
    }
  };

  const viewProfile = async (id) => {
    const profile = await getProfile(id);
    store.setCurrentProfile({
      profile_id: profile.id,
      id: profile.id,
      timestamp: profile.timestamp,
      filename: profile.profile_name,
      point_count: profile.point_count,
      x_range: profile.x_range,
      y_range: profile.y_range,
      sampling_interval: profile.sampling_interval,
      raw_points: profile.raw_points,
      smoothed_points: profile.smoothed_points,
    });
    store.setCurrentFeatures(profile.features);
    store.setCurrentDecision(profile.decision_details);
    navigate("/graph");
  };

  const requestRemoveProfile = (profile) => {
    setPendingDelete(profile);
    setToast({
      type: "confirm",
      sticky: true,
      title: "Delete uploaded file?",
      message: `"${profile.profile_name}" will be removed from uploads and history.`,
    });
  };

  const removeProfile = async () => {
    if (!pendingDelete) return;
    try {
      setDeletingId(pendingDelete.id);
      await deleteProfile(pendingDelete.id);
      setRecent((items) => items.filter((item) => item.id !== pendingDelete.id));
      if (store.currentProfile?.profile_id === pendingDelete.id || store.currentProfile?.id === pendingDelete.id) {
        store.reset();
      }
      setToast({ type: "success", title: "Uploaded file deleted", message: pendingDelete.profile_name });
      setPendingDelete(null);
    } catch (error) {
      store.setErrorMessage(error.message);
      setToast({ type: "danger", title: "Delete failed", message: error.message });
    } finally {
      setDeletingId(null);
    }
  };

  const closeToast = () => {
    setToast(null);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-6 top-20 z-50 w-[360px] max-w-[calc(100vw-32px)] rounded-[10px] border border-[#d1d5db] bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toast.type === "danger" ? "bg-[#FCEBEB] text-[#A32D2D]" : toast.type === "confirm" ? "bg-[#FAEEDA] text-[#854F0B]" : "bg-[#E1F5EE] text-[#085041]"}`}>
              {toast.type === "confirm" ? <Trash2 size={16} /> : toast.type === "danger" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-gray-950">{toast.title}</div>
              <div className="mt-1 break-words text-[12px] leading-5 text-[#6b7280]">{toast.message}</div>
              {toast.type === "confirm" ? (
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={closeToast} className="h-9 rounded-md border bg-white px-3 text-[12px] font-semibold text-gray-700">Cancel</button>
                  <button disabled={Boolean(deletingId)} onClick={removeProfile} className="h-9 rounded-md bg-[#A32D2D] px-3 text-[12px] font-semibold text-white disabled:opacity-60">
                    {deletingId ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ) : null}
            </div>
            <button onClick={closeToast} className="rounded p-1 text-[#6b7280] hover:bg-gray-100 hover:text-gray-900" title="Close notification">
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}
      <div>
        <h1 className="text-[24px] font-semibold text-gray-950">Upload coordinate profile</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">Ingest TXT or CSV coordinate file exported from roughness tester system</p>
      </div>
      {store.errorMessage ? <Banner variant="danger" icon={AlertCircle} message={store.errorMessage} /> : null}
      <section
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); selectFile(e.dataTransfer.files?.[0]); }}
        className={`flex min-h-[300px] cursor-pointer items-center justify-center rounded-[10px] border-2 border-dashed bg-white p-8 transition ${dragOver ? "border-[#1D9E75] bg-[#f0fdf8]" : "border-[#d1d5db] hover:border-[#1D9E75] hover:bg-[#f0fdf8]"}`}
      >
        <input ref={inputRef} type="file" accept=".txt,.csv" className="hidden" onChange={(e) => selectFile(e.target.files?.[0])} />
        {file ? (
          <div className="w-full max-w-[420px] text-center">
            <CheckCircle2 size={52} className="mx-auto text-[#1D9E75]" />
            <div className="mt-4 font-semibold">{file.name}</div>
            <div className="mt-1 text-[12px] text-[#6b7280]">{(file.size / 1024).toFixed(1)} KB · point count detected after processing</div>
            <button disabled={loading} onClick={(e) => { e.stopPropagation(); process(); }} className="mt-6 h-11 w-full rounded-md bg-[#1D9E75] text-[13px] font-semibold text-white disabled:opacity-60">
              {loading ? `${store.processingStatus}...` : "Process Profile →"}
            </button>
            <button onClick={(e) => { e.stopPropagation(); selectFile(null); }} className="mt-3 text-[12px] text-[#6b7280] hover:text-gray-900">Remove file</button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#1D9E75] text-white"><Upload size={26} /></div>
            <h2 className="mt-5 text-[18px] font-semibold">Drop coordinate file here</h2>
            <p className="mt-1 text-[13px] text-[#6b7280]">or click to browse from your system</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">{["TXT", "CSV", "X, Y columns", "One profile per file"].map((p) => <span key={p} className="rounded-full border border-[#e5e7eb] px-3 py-1 text-[11px] text-gray-600">{p}</span>)}</div>
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-[15px] font-semibold">Recent profiles</h2>
        <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f3f4f6] text-[10px] uppercase text-[#6b7280]"><tr><th className="px-4 py-3">File</th><th>Timestamp</th><th>Decision</th><th className="text-right pr-4">Action</th></tr></thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {recent.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.profile_name}</td>
                  <td>{new Date(p.timestamp).toLocaleString()}</td>
                  <td>{p.decision ? <DecisionBadge decision={p.decision} /> : "Unanalyzed"}</td>
                  <td className="pr-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => viewProfile(p.id)} className="rounded-md border px-3 py-1.5 text-[12px]">View</button>
                      <button
                        disabled={deletingId === p.id}
                        onClick={() => requestRemoveProfile(p)}
                        title="Delete uploaded file"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#F3B6B6] text-[#A32D2D] hover:bg-[#FCEBEB] disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
