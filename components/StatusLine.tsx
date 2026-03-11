"use client";

import { motion } from "framer-motion";
import type { TestPhase } from "@/lib/useSpeedTest";

const phaseColors: Record<TestPhase, string> = {
  idle: "#6b7280",
  latency: "#facc15",
  download: "#00d4ff",
  complete: "#4ade80",
};

export function StatusLine({ phase, status }: { phase: TestPhase; status: string }) {
  const color = phaseColors[phase];
  const isActive = phase !== "idle" && phase !== "complete";

  return (
    <div className="flex items-center gap-3 justify-center mb-8">
      <motion.div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
        animate={isActive ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={isActive ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
      />
      <span className="text-sm font-sans text-label tracking-wide">{status}</span>
    </div>
  );
}
