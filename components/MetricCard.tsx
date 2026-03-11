"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  decimals?: number;
  visible: boolean;
  delay?: number;
}

export function MetricCard({ label, value, unit, decimals = 1, visible, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="bg-surface rounded-xl px-5 py-4 flex flex-col items-center gap-1 min-w-[120px] flex-1"
    >
      <span className="text-xs font-sans text-label uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        {typeof value === "number" ? (
          <AnimatedNumber value={value} decimals={decimals} className="text-xl font-mono text-white font-semibold" />
        ) : (
          <span className="text-sm font-sans text-white/80 truncate max-w-[120px]">{value}</span>
        )}
        {unit && <span className="text-xs text-label font-sans">{unit}</span>}
      </div>
    </motion.div>
  );
}
