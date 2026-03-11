"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({ value, decimals = 2, className = "" }: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));
  const [displayValue, setDisplayValue] = useState(value.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setDisplayValue(v));
    return unsub;
  }, [display]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}
