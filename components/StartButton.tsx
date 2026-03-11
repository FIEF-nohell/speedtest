"use client";

import { motion } from "framer-motion";
import type { TestPhase } from "@/lib/useSpeedTest";

interface StartButtonProps {
  phase: TestPhase;
  onStart: () => void;
}

export function StartButton({ phase, onStart }: StartButtonProps) {
  const isRunning = phase !== "idle" && phase !== "complete";
  const isComplete = phase === "complete";

  if (isRunning) return null;

  if (isComplete) {
    return (
      <div className="flex justify-center mt-6">
        <motion.button
          onClick={onStart}
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
    );
  }

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
        Start
      </motion.button>
    </div>
  );
}
