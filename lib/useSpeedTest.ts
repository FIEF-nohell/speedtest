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
      // Small delay between pings to let each RTT settle cleanly
      if (i > 0) await new Promise((r) => setTimeout(r, 100));
      const start = performance.now();
      await fetch("/api/ping?r=" + Math.random() + "&t=" + Date.now(), {
        signal,
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
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

    // 50MB×3 warmup, then 250MB×3 sustained = 900MB total
    const passes: Array<{ file: string; label: string }> = [
      ...Array(3).fill({ file: "/payload-50mb.bin", label: "50 MB" }),
      ...Array(3).fill({ file: "/payload-250mb.bin", label: "250 MB" }),
    ];
    const total = passes.length;

    // Rolling window for instantaneous speed (1-second window)
    const samples: Array<{ time: number; bytes: number }> = [];
    const WINDOW_MS = 1000;

    let totalBytes = 0;
    const allDataPoints: DataPoint[] = [];
    const globalStart = performance.now();
    let lastGraphTime = 0;

    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw new Error("Aborted");
      const { file, label } = passes[i];
      update({ status: `Downloading ${label} (${i + 1}/${total})` });

      const response = await fetch(file + "?r=" + Math.random() + "&t=" + Date.now(), {
        signal,
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
      const reader = response.body!.getReader();

      while (true) {
        if (signal.aborted) throw new Error("Aborted");
        const { done, value } = await reader.read();
        if (done) break;

        const now = performance.now();
        totalBytes += value.byteLength;
        samples.push({ time: now, bytes: value.byteLength });

        // Trim samples outside the rolling window
        const cutoff = now - WINDOW_MS;
        while (samples.length > 0 && samples[0].time < cutoff) samples.shift();

        // Instantaneous speed = bytes in window / window duration
        const windowBytes = samples.reduce((sum, s) => sum + s.bytes, 0);
        const windowDuration = samples.length > 1
          ? (samples[samples.length - 1].time - samples[0].time) / 1000
          : WINDOW_MS / 1000;
        const instantMbs = windowDuration > 0
          ? Math.round((windowBytes / windowDuration / 1_000_000) * 100) / 100
          : 0;

        const elapsed = (now - globalStart) / 1000;

        // Throttle graph updates to ~20fps
        if (elapsed - lastGraphTime > 0.05) {
          lastGraphTime = elapsed;
          allDataPoints.push({ time: Math.round(elapsed * 100) / 100, value: instantMbs });
          update({ download: instantMbs, currentValue: instantMbs, downloadData: [...allDataPoints] });
        }
      }
    }

    // Final value: average of the last 3 seconds of samples for stability
    const finalCutoff = performance.now() - 3000;
    const finalSamples = allDataPoints.filter(
      (d) => d.time >= (performance.now() - globalStart) / 1000 - 3
    );
    const finalMbs = finalSamples.length > 0
      ? Math.round((finalSamples.reduce((s, d) => s + d.value, 0) / finalSamples.length) * 100) / 100
      : Math.round((totalBytes / ((performance.now() - globalStart) / 1000) / 1_000_000) * 100) / 100;

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
