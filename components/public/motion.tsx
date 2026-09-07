"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";

export function MotionReveal({
  children,
  className,
  delay = 0,
  x = 0,
  y = 28,
}: PropsWithChildren<{ className?: string; delay?: number; x?: number; y?: number }>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, x, y }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const prefersReducedMotion = useReducedMotion();
  const match = value.match(/^(\D*)([\d.]+)(.*)$/);
  const prefix = match?.[1] ?? "";
  const target = match ? Number(match[2]) : null;
  const suffix = match?.[3] ?? "";
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isInView || target === null || prefersReducedMotion) return;

    const duration = 2400;
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * easedProgress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, prefersReducedMotion, target]);

  if (target === null) return <span ref={ref}>{value}</span>;
  const displayValue = prefersReducedMotion ? target : Math.round(current);

  return (
    <span ref={ref} aria-label={value}>
      {prefix}{displayValue.toLocaleString("en-US")}{suffix}
    </span>
  );
}

export function MotionListItem({
  children,
  className,
  delay = 0,
  x = 0,
  y = 28,
}: PropsWithChildren<{ className?: string; delay?: number; x?: number; y?: number }>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.li
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, x, y }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.li>
  );
}

export function MotionFade({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
