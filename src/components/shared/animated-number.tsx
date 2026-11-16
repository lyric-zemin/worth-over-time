"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export const centsFormatter = (value: number) => formatCents(Math.round(value));
export const integerFormatter = (value: number) => String(Math.round(value));

export interface AnimatedNumberProps {
  value: number;
  from?: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
  label?: string;
}

/** 逐帧直接写文本节点，避免每帧触发 React 重渲染 */
export function AnimatedNumber({
  value,
  from,
  format = centsFormatter,
  duration = 1.15,
  className,
  label,
}: AnimatedNumberProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format);
  const previousRef = useRef(from ?? value);
  const reduced = useReducedMotion();
  formatRef.current = format;

  useEffect(() => {
    const node = textRef.current;
    if (!node) return;
    const start = from ?? previousRef.current;
    const render = (latest: number) => {
      node.textContent = formatRef.current(Math.round(latest));
    };
    if (reduced || start === value) {
      render(value);
      previousRef.current = value;
      return;
    }
    previousRef.current = value;
    const controls = animate(start, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: render,
      onComplete: () => render(value),
    });
    return () => controls.stop();
  }, [value, from, reduced, duration]);

  const initial = format(from ?? value);
  const accessible = label ?? format(value);

  return (
    <span className={cn("inline-flex items-baseline tabular", className)}>
      <span ref={textRef} aria-hidden="true">
        {initial}
      </span>
      <span className="sr-only">{accessible}</span>
    </span>
  );
}
