"use client";

import { useState, useCallback, useRef } from "react";

export type TestPhase = "idle" | "latency" | "download" | "complete";

export interface DataPoint {
  time: number; // seconds elapsed
  value: number; // MB/s
}

export interface DiagnosticData {
  probeMbs: number;
  probeFile: string;
  warmupMbs: number;
  warmupFile: string;
  measureFile: string;
  measureDurationSecs: number;
  measurePasses: number;
  oneSecAverages: number[];
  rampDiscarded: number;
  trimmedValues: number[];
  finalMethod: string;
  finalMbs: number;
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
  diagnostics: DiagnosticData | null;
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
  diagnostics: null,
};

// ── Tuning constants ──
const PROBE_FILE = "/payload-10mb.bin";
const SMALL_FILE = "/payload-10mb.bin";   // 10 MB
const MEDIUM_FILE = "/payload-50mb.bin";  // 50 MB
const LARGE_FILE = "/payload-250mb.bin";  // 250 MB

const ROLLING_WINDOW_MS = 1500;           // rolling window for instantaneous speed
const MIN_MEASURE_SECS = 12;              // minimum measurement duration
const MAX_MEASURE_SECS = 30;              // hard cap
const STABILITY_WINDOW_SECS = 5;          // window to check speed stability
const STABILITY_CV_THRESHOLD = 0.08;      // coefficient of variation threshold (8%)
const STABLE_AFTER_MIN_SECS = 15;         // can stop early for stability after this
const GRAPH_THROTTLE_MS = 80;             // graph update interval (~12fps)
const TRIM_FRACTION = 0.1;               // trim top/bottom 10% for final mean
const RAMP_DISCARD_FRACTION = 0.15;       // discard first 15% of measurement as ramp-up

export function useSpeedTest() {
  const [result, setResult] = useState<SpeedTestResult>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const update = (patch: Partial<SpeedTestResult>) =>
    setResult((prev) => ({ ...prev, ...patch }));

  // ── Latency ──
  const runLatency = async (signal: AbortSignal): Promise<{ ping: number; jitter: number }> => {
    update({ phase: "latency", status: "Testing latency..." });
    const pings: number[] = [];

    for (let i = 0; i < 20; i++) {
      if (signal.aborted) throw new Error("Aborted");
      if (i > 0) await new Promise((r) => setTimeout(r, 100));
      const start = performance.now();
      await fetch("/api/ping?r=" + Math.random() + "&t=" + Date.now(), {
        signal,
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
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

  // ── Helper: fetch a file and stream-read it, calling onChunk for each chunk ──
  const streamDownload = async (
    url: string,
    signal: AbortSignal,
    onChunk: (bytes: number, now: number) => void
  ) => {
    const response = await fetch(url + "?r=" + Math.random() + "&t=" + Date.now(), {
      signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Accept-Encoding": "identity",
      },
    });
    const reader = response.body!.getReader();
    while (true) {
      if (signal.aborted) throw new Error("Aborted");
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(value.byteLength, performance.now());
    }
  };

  // ── Pick file size based on estimated speed ──
  const pickFile = (estimatedMbs: number): string => {
    if (estimatedMbs < 3) return SMALL_FILE;      // slow: 10MB chunks
    if (estimatedMbs < 25) return MEDIUM_FILE;     // medium: 50MB chunks
    return LARGE_FILE;                              // fast: 250MB chunks
  };

  const fileLabel = (file: string): string =>
    file === SMALL_FILE ? "10 MB" :
    file === MEDIUM_FILE ? "50 MB" : "250 MB";

  // ── Trimmed mean: discard top/bottom fraction, average the rest ──
  const trimmedMean = (values: number[], fraction: number): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * fraction);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
    if (trimmed.length === 0) return sorted[Math.floor(sorted.length / 2)];
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  };

  // ── Download test ──
  const runDownload = async (signal: AbortSignal): Promise<number> => {
    update({ phase: "download", status: "Probing connection...", downloadData: [], currentValue: 0 });

    const diag: DiagnosticData = {
      probeMbs: 0, probeFile: PROBE_FILE,
      warmupMbs: 0, warmupFile: "",
      measureFile: "", measureDurationSecs: 0, measurePasses: 0,
      oneSecAverages: [], rampDiscarded: 0,
      trimmedValues: [], finalMethod: "", finalMbs: 0,
    };

    // ═══ Phase 1: Probe — quick 10MB download to estimate speed ═══
    let probeBytes = 0;
    const probeStart = performance.now();
    await streamDownload(PROBE_FILE, signal, (bytes) => { probeBytes += bytes; });
    const probeElapsed = (performance.now() - probeStart) / 1000;
    const probeMbs = probeBytes / probeElapsed / 1_000_000;
    diag.probeMbs = Math.round(probeMbs * 100) / 100;

    let testFile = pickFile(probeMbs);
    diag.warmupFile = testFile;

    // ═══ Phase 2: Warmup — 1 pass, not counted, but used to refine file selection ═══
    update({ status: "Warming up...", currentValue: Math.round(probeMbs * 100) / 100 });
    let warmupBytes = 0;
    const warmupStart = performance.now();
    await streamDownload(testFile, signal, (bytes) => { warmupBytes += bytes; });
    const warmupElapsed = (performance.now() - warmupStart) / 1000;
    const warmupMbs = warmupBytes / warmupElapsed / 1_000_000;
    diag.warmupMbs = Math.round(warmupMbs * 100) / 100;

    // Re-evaluate file size based on warmup (more accurate than probe)
    const betterFile = pickFile(warmupMbs);
    if (betterFile !== testFile) {
      testFile = betterFile;
    }
    diag.measureFile = testFile;

    // ═══ Phase 3: Sustained measurement ═══
    update({ status: `Measuring speed (${fileLabel(testFile)})...` });

    const samples: Array<{ time: number; bytes: number }> = [];
    const allDataPoints: DataPoint[] = [];
    const oneSecAverages: Array<{ time: number; mbs: number }> = [];
    const measureStart = performance.now();
    let lastGraphTime = 0;
    let bucketBytes = 0;
    let bucketStart = measureStart;
    let passCount = 0;

    const processChunk = (bytes: number, now: number) => {
      samples.push({ time: now, bytes });

      // Trim samples outside rolling window
      const cutoff = now - ROLLING_WINDOW_MS;
      while (samples.length > 0 && samples[0].time < cutoff) samples.shift();

      // Instantaneous speed from rolling window
      const windowBytes = samples.reduce((sum, s) => sum + s.bytes, 0);
      const windowDuration = samples.length > 1
        ? (samples[samples.length - 1].time - samples[0].time) / 1000
        : ROLLING_WINDOW_MS / 1000;
      const instantMbs = windowDuration > 0
        ? Math.round((windowBytes / windowDuration / 1_000_000) * 100) / 100
        : 0;

      const elapsed = (now - measureStart) / 1000;

      // Collect 1-second bucket averages for final calculation
      bucketBytes += bytes;
      const bucketElapsed = (now - bucketStart) / 1000;
      if (bucketElapsed >= 1) {
        const bucketMbs = bucketBytes / bucketElapsed / 1_000_000;
        oneSecAverages.push({ time: elapsed, mbs: bucketMbs });
        bucketBytes = 0;
        bucketStart = now;
      }

      // Throttle graph updates
      if (elapsed - lastGraphTime > GRAPH_THROTTLE_MS / 1000) {
        lastGraphTime = elapsed;
        allDataPoints.push({ time: Math.round(elapsed * 100) / 100, value: instantMbs });
        update({ download: instantMbs, currentValue: instantMbs, downloadData: [...allDataPoints] });
      }
    };

    // Keep downloading until we have enough stable data
    while (true) {
      if (signal.aborted) throw new Error("Aborted");

      const elapsed = (performance.now() - measureStart) / 1000;

      // Hard cap
      if (elapsed >= MAX_MEASURE_SECS) break;

      // Check if we can stop: minimum time met
      if (elapsed >= MIN_MEASURE_SECS) break;

      // Check early stop for stability after STABLE_AFTER_MIN_SECS
      if (elapsed >= STABLE_AFTER_MIN_SECS && oneSecAverages.length >= STABILITY_WINDOW_SECS) {
        const recent = oneSecAverages.slice(-STABILITY_WINDOW_SECS);
        const mean = recent.reduce((s, r) => s + r.mbs, 0) / recent.length;
        if (mean > 0) {
          const stddev = Math.sqrt(
            recent.reduce((s, r) => s + Math.pow(r.mbs - mean, 2), 0) / recent.length
          );
          const cv = stddev / mean;
          if (cv < STABILITY_CV_THRESHOLD) break;
        }
      }

      passCount++;
      update({ status: `Measuring speed (${fileLabel(testFile)}, pass ${passCount})...` });
      await streamDownload(testFile, signal, processChunk);
    }

    diag.measurePasses = passCount;
    diag.measureDurationSecs = Math.round((performance.now() - measureStart) / 100) / 10;

    // Flush any remaining bucket
    if (bucketBytes > 0) {
      const now = performance.now();
      const bucketElapsed = (now - bucketStart) / 1000;
      if (bucketElapsed > 0.1) {
        const elapsed = (now - measureStart) / 1000;
        oneSecAverages.push({ time: elapsed, mbs: bucketBytes / bucketElapsed / 1_000_000 });
      }
    }

    diag.oneSecAverages = oneSecAverages.map((s) => Math.round(s.mbs * 100) / 100);

    // ═══ Phase 4: Calculate final speed ═══
    // Discard ramp-up portion
    const discardCount = Math.floor(oneSecAverages.length * RAMP_DISCARD_FRACTION);
    const measured = oneSecAverages.slice(discardCount).map((s) => s.mbs);
    diag.rampDiscarded = discardCount;

    // Trimmed mean for robustness
    let finalMbs: number;
    if (measured.length >= 3) {
      finalMbs = trimmedMean(measured, TRIM_FRACTION);
      diag.finalMethod = `trimmedMean(${measured.length} samples, trim=${TRIM_FRACTION})`;
    } else if (measured.length > 0) {
      finalMbs = measured.reduce((a, b) => a + b, 0) / measured.length;
      diag.finalMethod = `simpleMean(${measured.length} samples)`;
    } else {
      const totalBytes = oneSecAverages.reduce((s, x) => s + x.mbs, 0);
      const totalTime = (performance.now() - measureStart) / 1000;
      finalMbs = totalBytes / totalTime / 1_000_000;
      diag.finalMethod = "fallback(totalBytes/totalTime)";
    }

    finalMbs = Math.round(finalMbs * 100) / 100;
    diag.finalMbs = finalMbs;

    // Store which values went into the trimmed mean
    if (measured.length >= 3) {
      const sorted = [...measured].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * TRIM_FRACTION);
      diag.trimmedValues = sorted.slice(trimCount, sorted.length - trimCount).map((v) => Math.round(v * 100) / 100);
    } else {
      diag.trimmedValues = measured.map((v) => Math.round(v * 100) / 100);
    }

    update({ download: finalMbs, downloadData: allDataPoints, diagnostics: diag });
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
