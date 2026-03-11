"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import type { SpeedTestResult } from "@/lib/useSpeedTest";

function buildCopyText(result: SpeedTestResult): string {
  const { download, ping, jitter, server, diagnostics: d } = result;
  const mbps = Math.round(download * 8 * 100) / 100;
  const lines = [
    `=== Speed Test Result ===`,
    `Download: ${mbps} Mbps (${download} MB/s)`,
    `Ping: ${ping} ms | Jitter: ${jitter} ms`,
    `Server: ${server}`,
  ];

  if (d) {
    lines.push(
      ``,
      `--- Diagnostics ---`,
      `Probe: ${d.probeMbs} MB/s (${d.probeFile})`,
      `Warmup: ${d.warmupMbs} MB/s (${d.warmupFile})`,
      `Measure file: ${d.measureFile}`,
      `Measure duration: ${d.measureDurationSecs}s, ${d.measurePasses} passes`,
      ``,
      `1-sec averages (${d.oneSecAverages.length}): [${d.oneSecAverages.join(", ")}]`,
      `Ramp-up discarded: first ${d.rampDiscarded} samples`,
      `Trimmed values (${d.trimmedValues.length}): [${d.trimmedValues.join(", ")}]`,
      `Final method: ${d.finalMethod}`,
      `Final: ${d.finalMbs} MB/s`,
    );
  }

  return lines.join("\n");
}

export function ResultScreen({ result }: { result: SpeedTestResult }) {
  const { download, ping, jitter, server } = result;
  const downloadMbps = Math.round(download * 8 * 100) / 100;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = buildCopyText(result);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Download — hero number */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10"
      >
        <div className="text-xs font-sans text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
          Download
        </div>
        <div className="flex items-baseline gap-3">
          <AnimatedNumber
            value={downloadMbps}
            decimals={0}
            className="text-7xl sm:text-8xl font-mono text-white font-bold tabular-nums"
          />
          <span className="text-lg font-sans text-label">Mbps</span>
        </div>
        <div className="text-sm font-mono text-label/50 mt-1">
          {download.toFixed(2)} MB/s
        </div>
      </motion.div>

      {/* Secondary metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-6"
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-label uppercase tracking-wider text-[11px]">Ping</span>
          <span className="font-mono text-white font-medium">{ping}</span>
          <span className="text-label text-[11px]">ms</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-label uppercase tracking-wider text-[11px]">Jitter</span>
          <span className="font-mono text-white font-medium">{jitter}</span>
          <span className="text-label text-[11px]">ms</span>
        </div>
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-label uppercase tracking-wider text-[11px] shrink-0">Server</span>
          <span className="font-mono text-white/70 font-medium truncate max-w-[180px] sm:max-w-none">{server || "—"}</span>
        </div>
      </motion.div>

      {/* Copy result — subtle inline text */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        onClick={handleCopy}
        className="inline-flex items-center gap-1 text-[11px] font-mono text-label/40 hover:text-label/70 transition-colors cursor-pointer select-none"
      >
        {copied ? "copied to clipboard" : "copy result"}
      </motion.span>
    </motion.div>
  );
}
