"use client";

import { motion } from "framer-motion";
import type { TestPhase } from "@/lib/useSpeedTest";

interface StartButtonProps {
  phase: TestPhase;
  onStart: () => void;
}

export function StartButton({ phase, onStart }: StartButtonProps) {
  const isRunning = phase !== "idle" && phase !== "complete";
  const label = phase === "complete" ? "Test Again" : "Start";

  if (isRunning) return null;

  return (
    <div className="flex justify-center mt-8">
      <motion.button
        onClick={onStart}
        className="relative w-28 h-28 rounded-full bg-surface border-2 border-accent/30 text-white font-sans font-medium text-lg tracking-wide cursor-pointer transition-colors hover:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {label}
      </motion.button>
    </div>
  );
}
