"use client";

import { useState, useCallback, useRef } from "react";

export type TestPhase = "idle" | "latency" | "download" | "upload" | "complete";

export interface DataPoint {
  time: number; // seconds elapsed
  value: number; // Mbps
}

export interface SpeedTestResult {
  phase: TestPhase;
  status: string;
  ping: number;
  jitter: number;
  download: number;
  upload: number;
  downloadData: DataPoint[];
  uploadData: DataPoint[];
  currentValue: number;
  isp: string;
  server: string;
}

const INITIAL: SpeedTestResult = {
  phase: "idle",
  status: "Ready",
  ping: 0,
  jitter: 0,
  download: 0,
  upload: 0,
  downloadData: [],
  uploadData: [],
  currentValue: 0,
  isp: "",
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

    for (let i = 0; i < 10; i++) {
      if (signal.aborted) throw new Error("Aborted");
      const start = performance.now();
      await fetch("/api/ping?r=" + Math.random(), { signal, cache: "no-store" });
      const rtt = performance.now() - start;
      pings.push(rtt);
      const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
      update({ ping: Math.round(avg), currentValue: Math.round(avg) });
    }

    const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
    const variance = pings.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / pings.length;
    const jitter = Math.round(Math.sqrt(variance) * 10) / 10;
    const ping = Math.round(avg);

    update({ ping, jitter });
    return { ping, jitter };
  };

  const runDownload = async (signal: AbortSignal): Promise<number> => {
    update({ phase: "download", status: "Testing download...", downloadData: [], currentValue: 0 });

    const startTime = performance.now();
    const response = await fetch("/api/download?r=" + Math.random(), { signal, cache: "no-store" });
    const reader = response.body!.getReader();
    let totalBytes = 0;
    const dataPoints: DataPoint[] = [];

    while (true) {
      if (signal.aborted) throw new Error("Aborted");
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      const elapsed = (performance.now() - startTime) / 1000;
      const mbps = Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100;
      dataPoints.push({ time: Math.round(elapsed * 100) / 100, value: mbps });
      update({ download: mbps, currentValue: mbps, downloadData: [...dataPoints] });
    }

    const elapsed = (performance.now() - startTime) / 1000;
    const finalMbps = Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100;
    update({ download: finalMbps, downloadData: dataPoints });
    return finalMbps;
  };

  const runUpload = async (signal: AbortSignal): Promise<number> => {
    update({ phase: "upload", status: "Testing upload...", uploadData: [], currentValue: 0 });

    const chunkSize = 2 * 1024 * 1024; // 2MB per request
    const totalRounds = 5;
    const dataPoints: DataPoint[] = [];
    const payload = new Uint8Array(chunkSize);
    for (let i = 0; i < chunkSize; i++) payload[i] = (i * 11 + 7) & 0xff;

    let totalBytes = 0;
    const startTime = performance.now();

    for (let i = 0; i < totalRounds; i++) {
      if (signal.aborted) throw new Error("Aborted");

      await fetch("/api/upload", {
        method: "POST",
        body: payload,
        signal,
        cache: "no-store",
      });

      totalBytes += chunkSize;
      const elapsed = (performance.now() - startTime) / 1000;
      const mbps = Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100;
      dataPoints.push({ time: Math.round(elapsed * 100) / 100, value: mbps });
      update({ upload: mbps, currentValue: mbps, uploadData: [...dataPoints] });
    }

    const elapsed = (performance.now() - startTime) / 1000;
    const finalMbps = Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100;
    update({ upload: finalMbps, uploadData: dataPoints });
    return finalMbps;
  };

  const start = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResult({ ...INITIAL, phase: "latency", status: "Connecting..." });

    try {
      await runLatency(controller.signal);
      await runDownload(controller.signal);
      await runUpload(controller.signal);
      update({
        phase: "complete",
        status: "Complete",
        server: window.location.host,
        isp: "Your ISP",
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
