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

      {/* Secondary metrics — flat inline row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-baseline gap-8 mb-6"
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
        <div className="flex items-baseline gap-1.5">
          <span className="text-label uppercase tracking-wider text-[11px]">Server</span>
          <span className="font-mono text-white/70 font-medium">{server || "—"}</span>
        </div>
      </motion.div>

      {/* Copy result button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-label hover:text-white hover:border-white/20 transition-all cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {copied ? (
              <path d="M20 6L9 17l-5-5" />
            ) : (
              <>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </>
            )}
          </svg>
          {copied ? "Copied" : "Copy result"}
        </button>
      </motion.div>
    </motion.div>
  );
}
