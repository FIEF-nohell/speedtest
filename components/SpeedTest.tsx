"use client";

import { useRef } from "react";
import { useSpeedTest } from "@/lib/useSpeedTest";
import { StatusLine } from "./StatusLine";
import { AnimatedNumber } from "./AnimatedNumber";
import { LiveGraph } from "./LiveGraph";
import { ResultScreen } from "./ResultScreen";
import { motion, AnimatePresence } from "framer-motion";

export function SpeedTest() {
  const { result, start } = useSpeedTest();
  const { phase, status, downloadData } = result;

  const isRunning = phase !== "idle" && phase !== "complete";
  const showGraph = phase === "download" || phase === "complete";

  const primaryUnit = phase === "latency" ? "ms" : "Mbps";
  const primaryLabel = phase === "latency" ? "Ping" : phase === "download" ? "Download" : "";
  const liveMbps = phase === "download" ? Math.round(result.currentValue * 8 * 100) / 100 : result.currentValue;

  return (
    <div className="w-full max-w-[640px] mx-auto px-6">
      {phase !== "idle" && phase !== "complete" && (
        <StatusLine phase={phase} status={status} />
      )}

      <AnimatePresence mode="wait">
        {phase === "complete" ? (
          /* ── Results ── */
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ResultScreen result={result} />
            <LiveGraph downloadData={downloadData} phase={phase} />
            <div className="flex justify-center mt-2">
              <motion.button
                onClick={start}
                className="px-6 py-2.5 rounded-full bg-surface border border-white/10 text-white/60 font-sans text-sm tracking-wide cursor-pointer transition-all hover:text-white hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-accent/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                Test Again
              </motion.button>
            </div>
          </motion.div>
        ) : isRunning ? (
          /* ── Active test ── */
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                  value={liveMbps}
                  decimals={phase === "latency" ? 0 : 0}
                  className="text-7xl sm:text-8xl font-mono text-white font-bold tabular-nums"
                />
                <span className="text-xl font-sans text-label">{primaryUnit}</span>
              </div>
              {phase === "download" && result.currentValue > 0 && (
                <div className="text-sm font-mono text-label/50 mt-1">
                  {result.currentValue.toFixed(2)} MB/s
                </div>
              )}
            </motion.div>

            {showGraph && (
              <LiveGraph downloadData={downloadData} phase={phase} />
            )}
          </motion.div>
        ) : (
          /* ── Idle / start screen ── */
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-8"
          >
            {/* Ambient rings + button */}
            <div className="relative flex items-center justify-center mb-10">
              {/* Outer pulse rings */}
              {[1.9, 1.55, 1.25].map((scale, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-accent/10"
                  style={{ width: 112 * scale, height: 112 * scale }}
                  animate={{ opacity: [0.4, 0.08, 0.4], scale: [1, 1.04, 1] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}

              {/* Button */}
              <motion.button
                onClick={start}
                className="relative z-10 w-28 h-28 rounded-full bg-surface border border-accent/30 text-white font-sans font-medium text-lg tracking-widest cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
                whileHover={{ scale: 1.06, borderColor: "rgba(0,212,255,0.6)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Inner glow on hover via box-shadow is handled by Tailwind ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 0 0 rgba(0,212,255,0)" }}
                  whileHover={{ boxShadow: "0 0 32px 4px rgba(0,212,255,0.15)" }}
                  transition={{ duration: 0.2 }}
                />
                GO
              </motion.button>
            </div>

            {/* Hint */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-2 text-[11px] font-mono text-label/50 uppercase tracking-widest"
            >
              <span>latency</span>
              <span className="text-label/20">·</span>
              <span>download</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
