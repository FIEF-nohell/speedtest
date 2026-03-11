"use client";

import { useSpeedTest } from "@/lib/useSpeedTest";
import { StatusLine } from "./StatusLine";
import { AnimatedNumber } from "./AnimatedNumber";
import { LiveGraph } from "./LiveGraph";
import { MetricCard } from "./MetricCard";
import { StartButton } from "./StartButton";
import { motion, AnimatePresence } from "framer-motion";

const phaseUnit: Record<string, string> = {
  latency: "ms",
  download: "Mbps",
  upload: "Mbps",
};

const phaseLabel: Record<string, string> = {
  latency: "Ping",
  download: "Download",
  upload: "Upload",
};

export function SpeedTest() {
  const { result, start } = useSpeedTest();
  const { phase, status, ping, jitter, download, upload, downloadData, uploadData, server } = result;

  const isActive = phase !== "idle";
  const showGraph = phase === "download" || phase === "upload" || phase === "complete";
  const showMetrics = phase === "complete" || (phase === "upload" && ping > 0);

  // Determine primary display value
  let primaryValue = result.currentValue;
  let primaryUnit = "Mbps";
  let primaryLabel = "";

  if (phase === "latency") {
    primaryUnit = "ms";
    primaryLabel = "Ping";
  } else if (phase === "download") {
    primaryLabel = "Download";
  } else if (phase === "upload") {
    primaryLabel = "Upload";
  } else if (phase === "complete") {
    primaryValue = download;
    primaryLabel = "Download";
  }

  return (
    <div className="w-full max-w-[640px] mx-auto px-6">
      {/* Status line */}
      <StatusLine phase={phase} status={status} />

      {/* Primary metric */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-2"
          >
            {primaryLabel && (
              <div className="text-sm font-sans text-label uppercase tracking-widest mb-2">
                {primaryLabel}
              </div>
            )}
            <div className="flex items-baseline justify-center gap-3">
              <AnimatedNumber
                value={primaryValue}
                decimals={phase === "latency" ? 0 : 2}
                className="text-7xl sm:text-8xl font-mono text-white font-bold tabular-nums"
              />
              <span className="text-xl font-sans text-label">{primaryUnit}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live graph */}
      {showGraph && (
        <LiveGraph
          downloadData={downloadData}
          uploadData={uploadData}
          phase={phase}
        />
      )}

      {/* Secondary metrics */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4"
          >
            <MetricCard label="Ping" value={ping} unit="ms" decimals={0} visible delay={0} />
            <MetricCard label="Jitter" value={jitter} unit="ms" decimals={1} visible delay={0.1} />
            <MetricCard label="Upload" value={upload} unit="Mbps" decimals={2} visible delay={0.2} />
            <MetricCard label="Server" value={server || "—"} visible delay={0.3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start / Test Again button */}
      <StartButton phase={phase} onStart={start} />
    </div>
  );
}
