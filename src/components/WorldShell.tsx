"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { WORLDS, type World } from "@/content/worlds";
import type { Child } from "@/lib/store";

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
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, var(--sky) 0%, var(--sky-2) 65%, var(--ground) 100%)" }}
      />
      <Decor world={world} />
      {child && (
        <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4">
          {back ? (
            <Link
              href={back.href}
              aria-label={back.label}
              className="btn-3d flex h-14 w-14 items-center justify-center bg-white text-3xl"
            >
              {back.href === "/" ? "🏠" : "→"}
            </Link>
          ) : (
            <span className="h-14 w-14" />
          )}
          <span className="rounded-full bg-white/70 px-4 py-1 text-lg font-bold">{child.nickname}</span>
          <Link
            href="/stickers"
            aria-label="המדבקות שלי"
            className="btn-3d flex h-14 min-w-14 items-center justify-center gap-1 bg-white px-3 text-2xl"
          >
            <span>{world.stickers[0]}</span>
            <span className="text-lg font-extrabold">{child.stickers.length}</span>
          </Link>
        </header>
      )}
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
    </div>
  );
}

function Decor({ world }: { world: World }) {
  const spots = [
    { top: "8%", left: "6%", size: "2.5rem", delay: "0s" },
    { top: "18%", right: "8%", size: "2rem", delay: "1s" },
    { bottom: "12%", left: "10%", size: "3rem", delay: "0.5s" },
    { bottom: "6%", right: "12%", size: "2.5rem", delay: "1.5s" },
    { top: "45%", left: "3%", size: "1.8rem", delay: "2s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
      {spots.map((s, i) => (
        <span
          key={i}
          className="anim-bob absolute opacity-70"
          style={{ ...s, fontSize: s.size, animationDelay: s.delay }}
        >
          {world.decor[i % world.decor.length]}
        </span>
      ))}
    </div>
  );
}
