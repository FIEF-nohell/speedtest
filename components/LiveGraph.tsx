"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import type { DataPoint, TestPhase } from "@/lib/useSpeedTest";

interface LiveGraphProps {
  downloadData: DataPoint[];
  uploadData: DataPoint[];
  phase: TestPhase;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value} Mbps
        </div>
      ))}
    </div>
  );
}

export function LiveGraph({ downloadData, uploadData, phase }: LiveGraphProps) {
  const showBoth = phase === "complete" || phase === "upload";

  const mergedData = useMemo(() => {
    if (phase === "download" || (phase !== "complete" && phase !== "upload")) {
      return downloadData.map((d) => ({ time: d.time, download: d.value }));
    }

    if (phase === "upload" && uploadData.length > 0 && downloadData.length === 0) {
      return uploadData.map((d) => ({ time: d.time, upload: d.value }));
    }

    const map = new Map<number, any>();
    downloadData.forEach((d) => {
      map.set(d.time, { time: d.time, download: d.value });
    });
    uploadData.forEach((d) => {
      const existing = map.get(d.time) || { time: d.time };
      map.set(d.time, { ...existing, upload: d.value });
    });

    return Array.from(map.values()).sort((a, b) => a.time - b.time);
  }, [downloadData, uploadData, phase]);

  const hasData = mergedData.length > 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase === "complete" ? "complete" : phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="w-full h-48 mt-6 mb-8"
      >
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mergedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="dlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ulGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickFormatter={(v) => `${v}s`}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                width={40}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="download"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#dlGradient)"
                dot={false}
                isAnimationActive={false}
                name="Download"
              />
              {showBoth && (
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#ulGradient)"
                  dot={false}
                  isAnimationActive={false}
                  name="Upload"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-px bg-white/5" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
