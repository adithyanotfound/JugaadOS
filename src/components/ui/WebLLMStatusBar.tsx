"use client";

import type { WebLLMStatus, WebLLMProgress } from "@/lib/useWebLLM";
import { Cpu, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  status: WebLLMStatus;
  progress: WebLLMProgress;
  error: string | null;
  /** Compact mode hides the descriptive footer text */
  compact?: boolean;
}

export default function WebLLMStatusBar({ status, progress, error, compact }: Props) {
  if (status === "idle") return null;

  const pct = Math.round((progress.progress ?? 0) * 100);

  const statusConfig = {
    downloading: {
      icon: <Loader2 size={13} className="animate-spin text-yellow-500" />,
      label: "Downloading Gemma 2B",
      barColor: "bg-yellow-400",
    },
    loading: {
      icon: <Loader2 size={13} className="animate-spin text-blue-500" />,
      label: "Loading model into GPU",
      barColor: "bg-blue-400",
    },
    ready: {
      icon: <CheckCircle size={13} className="text-green-500" />,
      label: "Gemma 2B ready",
      barColor: "bg-green-400",
    },
    generating: {
      icon: <Loader2 size={13} className="animate-spin text-purple-500" />,
      label: "Generating with Gemma 2B…",
      barColor: "bg-purple-400",
    },
    error: {
      icon: <AlertCircle size={13} className="text-red-500" />,
      label: error ?? "Model error",
      barColor: "bg-red-400",
    },
  };

  const cfg = statusConfig[status] ?? statusConfig.ready;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
          <Cpu size={13} className="text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {cfg.icon}
            <span className="text-xs font-semibold text-black truncate">{cfg.label}</span>
            {(status === "downloading" || status === "loading") && (
              <span className="text-xs text-gray-400 ml-auto shrink-0">{pct}%</span>
            )}
          </div>
          {progress.text && status !== "ready" && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{progress.text}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(status === "downloading" || status === "loading" || status === "generating") && (
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${cfg.barColor}`}
            style={{
              width:
                status === "generating"
                  ? "100%"
                  : `${pct}%`,
              animation: status === "generating" ? "pulse 1.5s ease-in-out infinite" : undefined,
            }}
          />
        </div>
      )}

      {/* First-time download notice */}
      {status === "downloading" && !compact && (
        <p className="text-xs text-gray-400 leading-snug">
          ⬇️ First use: downloading ~1.5 GB model to your browser cache. Subsequent loads are instant.
        </p>
      )}
    </div>
  );
}
