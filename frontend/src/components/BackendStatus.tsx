import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { getPipelineHealth, getTutorHealth } from "@/lib/api";

type ServiceStatus = "loading" | "online" | "offline";

export function BackendStatus() {
  const [pipelineStatus, setPipelineStatus] = useState<ServiceStatus>("loading");
  const [tutorStatus, setTutorStatus] = useState<ServiceStatus>("loading");
  const [errorText, setErrorText] = useState("");

  const checkHealth = async () => {
    setErrorText("");
    setPipelineStatus("loading");
    setTutorStatus("loading");

    const [pipelineResult, tutorResult] = await Promise.allSettled([getPipelineHealth(), getTutorHealth()]);

    if (pipelineResult.status === "fulfilled" && pipelineResult.value.status === "ok") {
      setPipelineStatus("online");
    } else {
      setPipelineStatus("offline");
    }

    if (tutorResult.status === "fulfilled" && tutorResult.value.status === "ok") {
      setTutorStatus("online");
    } else {
      setTutorStatus("offline");
    }

    if (pipelineResult.status === "rejected" || tutorResult.status === "rejected") {
      setErrorText("One or more backend services are unreachable.");
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const statusPill = (label: string, status: ServiceStatus) => {
    const isOnline = status === "online";
    const isLoading = status === "loading";
    return (
      <div
        className={`px-2 py-1 rounded-sm text-[10px] uppercase tracking-[0.2em] font-mono border ${
          isLoading
            ? "text-neutral-500 border-white/10 bg-white/5"
            : isOnline
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              : "text-red-400 border-red-500/30 bg-red-500/10"
        }`}
      >
        {label}: {isLoading ? "checking" : isOnline ? "online" : "offline"}
      </div>
    );
  };

  return (
    <div className="px-5 py-4 border-b border-white/5 bg-black/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Backend Status</p>
        <button
          onClick={checkHealth}
          className="text-neutral-500 hover:text-white transition-colors"
          title="Refresh backend status"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusPill("Pipeline", pipelineStatus)}
        {statusPill("Tutor", tutorStatus)}
      </div>

      {errorText && (
        <div className="text-xs text-red-300 flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{errorText}</span>
        </div>
      )}

      {!errorText && pipelineStatus === "online" && tutorStatus === "online" && (
        <div className="text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <span>All core services are healthy.</span>
        </div>
      )}
    </div>
  );
}
