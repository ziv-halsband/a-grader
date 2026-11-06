"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { WORLDS, type World } from "@/content/worlds";
import type { Child } from "@/lib/store";
import { Buddy } from "./Buddy";
import { BuddyAvatar } from "./BuddyAvatar";

/** The world's sky, ground and decorations, plus the kid top bar. */
export function WorldShell({
  child,
  worldId,
  children,
  back,
}: {
  child?: Child | null;
  worldId?: World["id"];
  children: ReactNode;
  /** Where the top-right "back" button goes (RTL: right is the start). */
  back?: { href: string; label: string };
}) {
  const world = WORLDS[worldId ?? child?.worldId ?? "island"];
  return (
    <div
      style={world.theme as CSSProperties}
      className="relative flex min-h-dvh flex-col overflow-hidden text-ink"
    >
      <Backdrop />
      <Decor world={world} />
      {child && (
        <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4">
          {back ? (
            <Link
              href={back.href}
              aria-label={back.label}
              className="btn-3d flex h-16 w-16 items-center justify-center border-4 border-white bg-[var(--card)] text-3xl font-extrabold"
            >
              <span aria-hidden>{back.href === "/" ? "🏠" : "→"}</span>
            </Link>
          ) : (
            <span className="h-16 w-16" />
          )}
          <span className="chip nikud max-w-[40vw] truncate px-5 py-1.5 text-xl font-extrabold">{child.nickname}</span>
          {/* My room: the buddy + a ⭐ counter of everything collected (lorinias-style header counter). */}
          <Link
            href="/stickers"
            aria-label="החדר שלי"
            className="btn-3d flex h-16 items-center justify-center gap-2 border-4 border-white bg-[var(--card)] ps-2 pe-3"
          >
            {child.buddy ? <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={40} /> : <span className="text-3xl">{world.stickers[0]}</span>}
            <span aria-hidden className="flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-full bg-amber-300 px-2 text-lg font-extrabold text-amber-950">
              <span className="text-base">⭐</span>
              {child.stickers.length}
            </span>
          </Link>
        </header>
      )}
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
      {child && <Buddy child={child} />}
    </div>
  );
}

/** Sky, a warm sun glow, and the world's ground (sea + beach, or two green hills) along the bottom. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at calc(100% - 2.5rem) 34%, var(--sun) 0 2.6rem, color-mix(in srgb, var(--sun) 35%, transparent) 2.7rem 4.2rem, transparent 4.3rem), linear-gradient(180deg, var(--sky) 0%, var(--sky-2) 55%, var(--card) 100%)",
        }}
      />
      <svg className="absolute inset-x-0 bottom-0 h-[16vh] min-h-24 w-full" viewBox="0 0 1000 160" preserveAspectRatio="none">
        <path d="M0 70 C 160 20, 320 110, 500 60 S 820 10, 1000 60 V160 H0 Z" fill="var(--hill)" opacity="0.55" />
        <path d="M0 115 C 200 70, 380 140, 600 100 S 880 80, 1000 110 V160 H0 Z" fill="var(--hill-2)" opacity="0.7" />
      </svg>
    </div>
  );
}

/** A few floating friends of the world, at the edges only, so they never sit under a button. */
function Decor({ world }: { world: World }) {
  const spots = [
    { top: "13%", left: "3%", size: "2.25rem", delay: "0s" },
    { top: "24%", right: "3%", size: "1.9rem", delay: "1s" },
    { bottom: "9%", right: "6%", size: "2.5rem", delay: "1.5s" },
    { top: "52%", left: "2%", size: "1.7rem", delay: "2s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
      {spots.map((s, i) => (
        <span
          key={i}
          className="anim-bob absolute opacity-60"
          style={{ ...s, fontSize: s.size, animationDelay: s.delay }}
        >
          {world.decor[(i + 1) % world.decor.length]}
        </span>
      ))}
    </div>
  );
}
