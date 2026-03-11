"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import type { SpeedTestResult } from "@/lib/useSpeedTest";

export function ResultScreen({ result }: { result: SpeedTestResult }) {
  const { download, upload, ping, jitter, server } = result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Hero speeds — download and upload side by side */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Download */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-surface rounded-2xl p-6 border border-white/[0.04] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
          <div className="text-xs font-sans text-label uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            Download
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={download}
              decimals={2}
              className="text-5xl sm:text-6xl font-mono text-white font-bold tabular-nums"
            />
            <span className="text-base font-sans text-label">Mbps</span>
          </div>
        </motion.div>

        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-surface rounded-2xl p-6 border border-white/[0.04] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-violet to-transparent opacity-60" />
          <div className="text-xs font-sans text-label uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Upload
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={upload}
              decimals={2}
              className="text-5xl sm:text-6xl font-mono text-white font-bold tabular-nums"
            />
            <span className="text-base font-sans text-label">Mbps</span>
          </div>
        </motion.div>
      </div>

      {/* Secondary metrics row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-surface/60 rounded-xl px-4 py-3 text-center border border-white/[0.03]">
          <div className="text-[10px] font-sans text-label uppercase tracking-widest mb-1">Ping</div>
          <div className="flex items-baseline justify-center gap-1">
            <AnimatedNumber value={ping} decimals={0} className="text-lg font-mono text-white font-semibold" />
            <span className="text-[10px] text-label">ms</span>
          </div>
        </div>
        <div className="bg-surface/60 rounded-xl px-4 py-3 text-center border border-white/[0.03]">
          <div className="text-[10px] font-sans text-label uppercase tracking-widest mb-1">Jitter</div>
          <div className="flex items-baseline justify-center gap-1">
            <AnimatedNumber value={jitter} decimals={1} className="text-lg font-mono text-white font-semibold" />
            <span className="text-[10px] text-label">ms</span>
          </div>
        </div>
        <div className="bg-surface/60 rounded-xl px-4 py-3 text-center border border-white/[0.03]">
          <div className="text-[10px] font-sans text-label uppercase tracking-widest mb-1">Server</div>
          <div className="text-sm font-sans text-white/80 truncate">{server || "—"}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
