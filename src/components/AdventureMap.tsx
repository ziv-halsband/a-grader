"use client";

import Link from "next/link";
import { say } from "@/lib/audio";

export type MapStation = {
  key: string;
  label: string;
  icon: string;
  /** Big symbol on the station (a letter, nikud...). Falls back to the icon. */
  badge?: string;
  state: "done" | "open" | "locked";
  href?: string;
  sticker?: string;
};

// Horizontal position of each station along the winding path (percent from the right).
const XS = [50, 22, 50, 78];

/** A winding path from top to bottom; stations alternate sides. */
export function AdventureMap({ stations }: { stations: MapStation[] }) {
  return (
    <ol className="relative mx-auto w-full max-w-md px-4 pb-16">
      {stations.map((s, i) => {
        const x = XS[i % XS.length];
        const nextX = XS[(i + 1) % XS.length];
        return (
          <li key={s.key} className="relative h-36">
            {i < stations.length - 1 && (
              <svg
                aria-hidden
                className="absolute inset-x-0 top-12 h-36 w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d={`M ${100 - x} 0 C ${100 - x} 55, ${100 - nextX} 45, ${100 - nextX} 100`}
                  fill="none"
                  stroke="var(--path)"
                  strokeWidth="5"
                  strokeDasharray="2 9"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
            <div className="absolute top-0 -translate-x-1/2" style={{ left: `${100 - x}%` }}>
              <StationButton station={s} index={i} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StationButton({ station: s, index }: { station: MapStation; index: number }) {
  const body = (
    <>
      <span
        className={`btn-3d relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-5xl ${
          s.state === "locked" ? "bg-white/50 grayscale" : s.state === "open" ? "anim-glow bg-[var(--card)]" : "bg-[var(--card)]"
        }`}
      >
        <span className={s.badge ? "nikud text-4xl font-extrabold" : ""}>{s.badge ?? s.icon}</span>
        {s.state === "locked" && <span className="absolute -top-2 -left-2 text-2xl">🔒</span>}
        {s.state === "done" && <span className="absolute -top-2 -left-2 text-3xl">{s.sticker ?? "⭐"}</span>}
        {s.state === "open" && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl anim-bob" aria-hidden>
            {s.icon === s.badge ? "📍" : s.icon}
          </span>
        )}
      </span>
      <span className="nikud mt-1 max-w-36 rounded-full bg-white/80 px-3 text-center text-sm font-bold">
        {s.label}
      </span>
    </>
  );

  if (s.state === "locked" || !s.href) {
    return (
      <button
        onClick={() => say("locked")}
        className="flex flex-col items-center"
        aria-label={`${s.label} (עוד סגור)`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {body}
      </button>
    );
  }
  return (
    <Link href={s.href} className="anim-rise flex flex-col items-center" style={{ animationDelay: `${index * 60}ms` }}>
      {body}
    </Link>
  );
}
