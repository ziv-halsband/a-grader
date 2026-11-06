"use client";

import Link from "next/link";
import { say, wrongSound } from "@/lib/audio";
import { BuddyAvatar } from "./BuddyAvatar";
import { PointHand } from "./PointHand";

export type MapStation = {
  key: string;
  label: string;
  icon: string;
  /** Big symbol on the station (a letter, nikud...). Falls back to the icon. */
  badge?: string;
  state: "done" | "open" | "locked";
  href?: string;
  /** What the station gives: shown when done, and faintly before, so the child sees what's coming. */
  sticker?: string;
  /** A milestone station brings a new hero: its silhouette until earned, then the hero itself. */
  hero?: { emoji: string; owned: boolean };
};

// Horizontal position of each station along the winding path (percent from the right).
const XS = [50, 24, 50, 76];

/**
 * A winding road from top to bottom; stations alternate sides (Duolingo / Reading Eggs path).
 * Exactly one thing calls the child: the next station to play (the first open, not-done one). It is bigger,
 * glows, has a pointing hand, and the child's own buddy stands next to it ("you are here").
 */
export function AdventureMap({
  stations,
  here,
  hand = true,
}: {
  stations: MapStation[];
  here?: { buddy?: string; wearing?: string[] };
  /** False when the page's one big next step is somewhere else (e.g. the daily practice): the halo stays, the 👆 goes. */
  hand?: boolean;
}) {
  const next = stations.find((s) => s.state === "open")?.key;
  return (
    <ol className="relative mx-auto w-full max-w-lg px-4 pb-28">
      {stations.map((s, i) => {
        const x = XS[i % XS.length];
        const nextX = XS[(i + 1) % XS.length];
        const d = `M ${100 - x} 0 C ${100 - x} 55, ${100 - nextX} 45, ${100 - nextX} 100`;
        // The road behind a finished station is "walked": it turns solid.
        const walked = s.state === "done";
        return (
          <li key={s.key} className="relative h-44">
            {i < stations.length - 1 && (
              <svg
                aria-hidden
                className="absolute inset-x-0 top-14 h-44 w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path d={d} fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="26" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path
                  d={d}
                  fill="none"
                  stroke="var(--path)"
                  strokeWidth="9"
                  strokeDasharray={walked ? undefined : "1 16"}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
            <div className="absolute top-0 -translate-x-1/2" style={{ left: `${100 - x}%` }}>
              <StationButton station={s} index={i} pointed={s.key === next} hand={hand} here={s.key === next ? here : undefined} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StationButton({
  station: s,
  index,
  pointed,
  hand,
  here,
}: {
  station: MapStation;
  index: number;
  pointed: boolean;
  hand: boolean;
  here?: { buddy?: string; wearing?: string[] };
}) {
  const size = pointed ? "h-32 w-32" : "h-28 w-28";
  const body = (
    <>
      <span className="relative flex items-center justify-center">
        {pointed && (
          <span aria-hidden className="anim-halo absolute -inset-4 rounded-full bg-[var(--sun)]" />
        )}
        <span
          className={`btn-3d relative flex ${size} items-center justify-center rounded-full border-[6px] text-5xl ${
            s.state === "locked"
              ? "border-white/80 bg-white/45 text-[var(--ink)]/50 grayscale"
              : pointed
                ? "border-white bg-[var(--accent)] text-white"
                : s.state === "done"
                  ? "border-white bg-[var(--card)]"
                  : "border-white bg-[var(--card)]"
          }`}
        >
          <span className={s.badge ? "nikud text-5xl font-extrabold" : ""}>{s.badge ?? s.icon}</span>
          {s.state === "locked" && (
            <span className="absolute -top-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow">🔒</span>
          )}
          {s.state === "done" && (
            <span className="absolute -top-3 -left-3 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-amber-300 text-2xl shadow">
              {s.sticker ?? "⭐"}
            </span>
          )}
          {s.state !== "done" && s.sticker && (
            <span aria-hidden className="absolute -bottom-1 -right-1 text-2xl opacity-40 grayscale">
              {s.sticker}
            </span>
          )}
          {s.hero && (
            <span
              aria-hidden
              className="absolute -top-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-white/90 text-3xl shadow"
            >
              <span className={s.hero.owned ? "" : "brightness-0 opacity-40"}>{s.hero.emoji}</span>
            </span>
          )}
          {s.state !== "locked" && s.icon !== s.badge && (
            <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-3xl ${pointed ? "anim-bob" : ""}`} aria-hidden>
              {s.icon}
            </span>
          )}
          {pointed && hand && <PointHand className="-bottom-6 -left-7" />}
        </span>
        {/* You are here: the child's buddy waits next to the next station. */}
        {here?.buddy && (
          <span aria-hidden className="anim-bob absolute -right-16 bottom-0 inline-block origin-bottom">
            <BuddyAvatar buddy={here.buddy} wearing={here.wearing} size={56} />
          </span>
        )}
      </span>
      <span
        className={`chip nikud mt-2 max-w-40 px-3 py-0.5 text-center font-extrabold ${
          pointed ? "text-xl text-[var(--accent)]" : "text-lg"
        } ${s.state === "locked" ? "opacity-70" : ""}`}
      >
        {s.label}
      </span>
    </>
  );

  if (s.state === "locked" || !s.href) {
    return (
      <button
        onClick={() => {
          wrongSound();
          say("locked");
        }}
        className="flex flex-col items-center rounded-3xl"
        aria-label={`${s.label} (עוד סגור)`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {body}
      </button>
    );
  }
  return (
    <Link
      href={s.href}
      className="anim-rise flex flex-col items-center rounded-3xl"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {body}
    </Link>
  );
}
