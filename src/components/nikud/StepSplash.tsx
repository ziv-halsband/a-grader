"use client";

import { useEffect, useEffectEvent } from "react";
import { popSound } from "@/lib/audio";

/**
 * Before each step: a big splash with the step's icon, its name, and how far along the station is
 * (like lorinias' "שלב הכרת המילים"). It goes away by itself after a moment, or with a tap.
 */
export function StepSplash({
  icon,
  title,
  index,
  total,
  onDone,
}: {
  icon: string;
  title: string;
  /** Which step this is (0-based). */
  index: number;
  total: number;
  onDone: () => void;
}) {
  const done = useEffectEvent(onDone);
  useEffect(() => {
    popSound();
    const t = setTimeout(() => done(), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={onDone}
      data-splash
      aria-label={title}
      className="anim-fade fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[var(--sky-2)]/80 px-6 backdrop-blur-sm"
    >
      <span className="anim-splash flex h-44 w-44 items-center justify-center rounded-full border-8 border-white bg-accent text-[6.5rem] shadow-2xl">
        {icon}
      </span>
      <span className="nikud rounded-full bg-white px-8 py-2 text-4xl font-extrabold shadow-lg">{title}</span>
      <span className="flex items-center gap-3" aria-hidden>
        <span className="h-6 w-64 overflow-hidden rounded-full border-4 border-white bg-white/60 shadow-inner">
          <span
            className="anim-bar block h-full rounded-full bg-accent"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </span>
        <span className="text-xl font-extrabold">
          {index + 1}/{total}
        </span>
      </span>
    </button>
  );
}
