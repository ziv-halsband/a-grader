"use client";

import { Guide } from "@/components/Guide";
import { BUDDIES } from "@/content/buddies";
import { line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { sparkleSound } from "@/lib/audio";

/** The child picks the buddy (the child, not the parent: it's theirs). */
export function BuddyPicker({ gender, onPick }: { gender: Gender; onPick: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/30 p-4 backdrop-blur-sm">
      <div className="anim-rise flex w-full max-w-lg flex-col items-center gap-5 rounded-[2.5rem] bg-[var(--card)] p-6 shadow-2xl">
        <Guide compact lines={[line("pick-buddy", gender)]} />
        <div className="grid grid-cols-3 gap-4">
          {BUDDIES.map((b, i) => (
            <button
              key={b.id}
              onClick={() => {
                sparkleSound();
                onPick(b.id);
              }}
              aria-label={b.name}
              className="btn-3d anim-rise flex aspect-square w-24 items-center justify-center bg-white text-6xl sm:w-28 sm:text-7xl"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="anim-bob inline-block" style={{ animationDelay: `${i * 300}ms` }}>
                {b.emoji}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
