"use client";

import { useState, useCallback, useRef } from "react";

export type TestPhase = "idle" | "latency" | "download" | "complete";

export interface DataPoint {
  time: number; // seconds elapsed
  value: number; // MB/s
}

export interface SpeedTestResult {
  phase: TestPhase;
  status: string;
  ping: number;
  jitter: number;
  download: number;
  downloadData: DataPoint[];
  currentValue: number;
  server: string;
}

const INITIAL: SpeedTestResult = {
  phase: "idle",
  status: "Ready",
  ping: 0,
  jitter: 0,
  download: 0,
  downloadData: [],
  currentValue: 0,
  server: "",
};

export function useSpeedTest() {
  const [result, setResult] = useState<SpeedTestResult>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const update = (patch: Partial<SpeedTestResult>) =>
    setResult((prev) => ({ ...prev, ...patch }));

  const runLatency = async (signal: AbortSignal): Promise<{ ping: number; jitter: number }> => {
    update({ phase: "latency", status: "Testing latency..." });
    const pings: number[] = [];

    for (let i = 0; i < 20; i++) {
      if (signal.aborted) throw new Error("Aborted");
      const start = performance.now();
      await fetch("/api/ping?r=" + Math.random(), { signal, cache: "no-store" });
      const rtt = performance.now() - start;
      pings.push(rtt);

      const relevant = i >= 2 ? pings.slice(2) : pings;
      const avg = relevant.reduce((a, b) => a + b, 0) / relevant.length;
      update({ ping: Math.round(avg), currentValue: Math.round(avg) });
    }

    const measured = pings.slice(2);
    const avg = measured.reduce((a, b) => a + b, 0) / measured.length;
    const variance = measured.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / measured.length;
    const jitter = Math.round(Math.sqrt(variance) * 10) / 10;
    const ping = Math.round(avg);

    update({ ping, jitter });
    return { ping, jitter };
  };

  const runDownload = async (signal: AbortSignal): Promise<number> => {
    update({ phase: "download", status: "Testing download...", downloadData: [], currentValue: 0 });

    // Each payload downloaded 3 times: 10MB×3, 50MB×3, 250MB×3 = 930MB total
    const passes: Array<{ file: string; label: string }> = [
      ...Array(3).fill({ file: "/payload-10mb.bin", label: "10 MB" }),
      ...Array(3).fill({ file: "/payload-50mb.bin", label: "50 MB" }),
      ...Array(3).fill({ file: "/payload-250mb.bin", label: "250 MB" }),
    ];
    const total = passes.length;

    let totalBytes = 0;
    const allDataPoints: DataPoint[] = [];
    const globalStart = performance.now();

    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw new Error("Aborted");
      const { file, label } = passes[i];
      update({ status: `Downloading ${label} (${i + 1}/${total})` });

      const response = await fetch(file + "?r=" + Math.random(), { signal, cache: "no-store" });
      const reader = response.body!.getReader();

      while (true) {
        if (signal.aborted) throw new Error("Aborted");
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        const elapsed = (performance.now() - globalStart) / 1000;
        const mbs = Math.round((totalBytes / elapsed / 1_000_000) * 100) / 100;
        allDataPoints.push({ time: Math.round(elapsed * 100) / 100, value: mbs });
        update({ download: mbs, currentValue: mbs, downloadData: [...allDataPoints] });
      }
    }

    const elapsed = (performance.now() - globalStart) / 1000;
    const finalMbs = Math.round((totalBytes / elapsed / 1_000_000) * 100) / 100;
    update({ download: finalMbs, downloadData: allDataPoints });
    return finalMbs;
  };

  const start = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResult({ ...INITIAL, phase: "latency", status: "Connecting..." });

    try {
      await runLatency(controller.signal);
      await runDownload(controller.signal);
      update({
        phase: "complete",
        status: "Complete",
        server: window.location.host,
      });
    } catch (e) {
      if ((e as Error).message !== "Aborted") {
        update({ phase: "idle", status: "Error — try again" });
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult(INITIAL);
  }, []);

  return { result, start, reset };
}
