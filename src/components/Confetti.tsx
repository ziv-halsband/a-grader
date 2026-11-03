"use client";

import { useMemo, type CSSProperties } from "react";

const COLORS = ["#f97316", "#facc15", "#22c55e", "#3b82f6", "#ec4899", "#a855f7"];

/** One burst of confetti. Re-mount (change `key`) to fire again. */
export function Confetti({ count = 40 }: { count?: number }) {
  // Random layout is fixed per mount.
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97) % 100}%`,
        dx: `${((i * 53) % 120) - 60}px`,
        delay: `${(i % 10) * 60}ms`,
        duration: `${1400 + ((i * 37) % 900)}ms`,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2"
          style={
            {
              left: p.left,
              background: p.color,
              borderRadius: p.round ? "999px" : "2px",
              "--dx": p.dx,
              animation: `confetti-fall ${p.duration} ease-in ${p.delay} both`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
