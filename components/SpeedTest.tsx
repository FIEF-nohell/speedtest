"use client";

import { useSpeedTest } from "@/lib/useSpeedTest";
import { StatusLine } from "./StatusLine";
import { AnimatedNumber } from "./AnimatedNumber";
import { LiveGraph } from "./LiveGraph";
import { StartButton } from "./StartButton";
import { ResultScreen } from "./ResultScreen";
import { motion, AnimatePresence } from "framer-motion";

export function SpeedTest() {
  const { result, start } = useSpeedTest();
  const { phase, status, downloadData, uploadData } = result;

  const isRunning = phase !== "idle" && phase !== "complete";
  const showGraph = phase === "download" || phase === "upload" || phase === "complete";

  // Determine primary display value during test
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
  }

  return (
    <div className="w-full max-w-[640px] mx-auto px-6">
      {/* Status line */}
      <StatusLine phase={phase} status={status} />

      <AnimatePresence mode="wait">
        {phase === "complete" ? (
          /* ── Completion screen ── */
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ResultScreen result={result} />

            <LiveGraph
              downloadData={downloadData}
              uploadData={uploadData}
              phase={phase}
            />

            <StartButton phase={phase} onStart={start} />
          </motion.div>
        ) : (
          /* ── Active test / idle screen ── */
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Primary metric */}
            <AnimatePresence mode="wait">
              {isRunning && (
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

            {/* Start button (idle) */}
            <StartButton phase={phase} onStart={start} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
