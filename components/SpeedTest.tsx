"use client";

import { useState, useEffect } from "react";
import { useSpeedTest } from "@/lib/useSpeedTest";
import { StatusLine } from "./StatusLine";
import { AnimatedNumber } from "./AnimatedNumber";
import { LiveGraph } from "./LiveGraph";
import { ResultScreen } from "./ResultScreen";
import { motion, AnimatePresence } from "framer-motion";

export function SpeedTest() {
  const { result, start } = useSpeedTest();
  const [host, setHost] = useState("");
  useEffect(() => { setHost(window.location.host); }, []);
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
            <div className="flex justify-center mt-4">
              <motion.span
                onClick={start}
                className="text-[11px] font-mono text-label/40 hover:text-label/70 transition-colors cursor-pointer select-none tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                test again
              </motion.span>
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
          /* ── Idle / landing ── */
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center"
            style={{ paddingTop: "8vh", paddingBottom: "4vh" }}
          >
            {/* Title block */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 sm:mb-20"
            >
              <h1 className="text-base sm:text-lg font-mono text-white/70 tracking-[0.2em] uppercase">
                Speed Test
              </h1>
              <p className="text-[10px] font-mono text-label/25 tracking-[0.3em] uppercase mt-1.5">
                latency &middot; download
              </p>
            </motion.div>

            {/* GO button — rings contained in fixed-size box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative flex items-center justify-center w-56 h-56 mb-16 sm:mb-20"
            >
              {/* Pulse rings — stay inside the container */}
              {[0.95, 0.78, 0.62].map((scale, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-accent/6"
                  style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
                  animate={{ opacity: [0.25, 0.05, 0.25], scale: [1, 1.03, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.7,
                  }}
                />
              ))}

              <motion.button
                onClick={start}
                className="relative z-10 w-28 h-28 rounded-full bg-surface border border-accent/20 text-white font-mono font-medium text-lg tracking-[0.25em] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30"
                whileHover={{ scale: 1.06, borderColor: "rgba(0,212,255,0.45)" }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ boxShadow: "0 0 0 0 rgba(0,212,255,0)" }}
                  whileHover={{ boxShadow: "0 0 40px 6px rgba(0,212,255,0.1)" }}
                  transition={{ duration: 0.25 }}
                />
                GO
              </motion.button>
            </motion.div>

            {/* Server hostname */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-[10px] font-mono text-label/15 tracking-wider"
            >
              {host}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
