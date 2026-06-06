"use client";

import { useState, useCallback } from "react";

// Using `any` types for WebLLM to avoid static imports that crash Next.js Turbopack
type MLCEngine = any;
type ChatCompletionRequestNonStreaming = any;
type ChatCompletion = any;

export type WebLLMStatus =
  | "idle"
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface WebLLMProgress {
  text: string;
  progress: number; // 0–1
}

const MODEL_ID = "gemma-2-2b-it-q4f16_1-MLC";

// Module-level singleton so multiple components share the same engine instance
let engineSingleton: MLCEngine | null = null;
let engineLoadPromise: Promise<MLCEngine> | null = null;

export function useWebLLM() {
  const [status, setStatus] = useState<WebLLMStatus>("idle");
  const [loadProgress, setLoadProgress] = useState<WebLLMProgress>({
    text: "",
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const ensureEngine = useCallback(async (): Promise<MLCEngine> => {
    // Return existing singleton immediately if ready
    if (engineSingleton) return engineSingleton;

    // If another caller is already loading, wait for that promise
    if (engineLoadPromise) return engineLoadPromise;

    setStatus("downloading");
    setLoadProgress({ text: "Preparing to download Gemma 2B…", progress: 0 });

    engineLoadPromise = (async () => {
      // Dynamically import to avoid SSR issues (WebGPU is browser-only)
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

      const engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          // report.text and report.progress come from WebLLM
          const progressValue =
            typeof report.progress === "number" ? report.progress : 0;
          const isLoading =
            report.text?.toLowerCase().includes("load") ||
            report.text?.toLowerCase().includes("compil");

          setStatus(isLoading ? "loading" : "downloading");
          setLoadProgress({
            text: report.text ?? "",
            progress: progressValue,
          });
        },
      });

      engineSingleton = engine;
      setStatus("ready");
      setLoadProgress({ text: "Model ready!", progress: 1 });
      return engine;
    })().catch((err) => {
      engineLoadPromise = null;
      const msg =
        err instanceof Error ? err.message : "Failed to load model";
      setStatus("error");
      setError(msg);
      throw err;
    });

    return engineLoadPromise;
  }, []);

  const generate = useCallback(
    async (prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> => {
      setError(null);
      const engine = await ensureEngine();
      setStatus("generating");

      try {
        const request: ChatCompletionRequestNonStreaming = {
          model: MODEL_ID,
          messages: [{ role: "user", content: prompt }],
          max_tokens: options?.maxTokens ?? 2048,
          temperature: options?.temperature ?? 0.7,
          stream: false,
        };
        const completion = await engine.chatCompletion(request) as ChatCompletion;
        const text = completion.choices[0]?.message?.content ?? "";
        setStatus("ready");
        return text;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        setStatus("error");
        setError(msg);
        throw err;
      }
    },
    [ensureEngine]
  );

  const isWorking =
    status === "downloading" || status === "loading" || status === "generating";

  return {
    status,
    loadProgress,
    error,
    isWorking,
    isReady: status === "ready",
    generate,
    ensureEngine,
    modelId: MODEL_ID,
  };
}
