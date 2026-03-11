"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import type { SpeedTestResult } from "@/lib/useSpeedTest";

export function ResultScreen({ result }: { result: SpeedTestResult }) {
  const { download, ping, jitter, server } = result;

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
            value={download}
            decimals={2}
            className="text-7xl sm:text-8xl font-mono text-white font-bold tabular-nums"
          />
          <span className="text-lg font-sans text-label">MB/s</span>
        </div>
      </motion.div>

      {/* Secondary metrics — flat inline row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-baseline gap-8"
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
    </motion.div>
  );
}
