"use client";

import Link from "next/link";
import { GARDEN, plantFor, type GardenLook } from "@/content/garden";
import { LETTERS } from "@/content/letters";
import { daysThisWeek, letterMastery, type Mastery } from "@/lib/mastery";
import type { Child } from "@/lib/store";

export type GardenPlant = {
  id: string;
  char: string;
  final: boolean;
  index: number;
  mastery: Mastery;
  plant: string;
};

/** Every letter as a plant at its stage, in alphabet order. */
export function gardenPlants(child: Child): GardenPlant[] {
  const look = GARDEN[child.worldId];
  return LETTERS.map((l, index) => {
    const mastery = letterMastery(child.letters[l.id]);
    return { id: l.id, char: l.char, final: !!l.final, index, mastery, plant: plantFor(look, mastery, index) };
  });
}

/** Letters that bloomed but whose bloom wasn't celebrated yet. */
export function unseenBlooms(child: Child): string[] {
  const seen = child.bloomSeen ?? [];
  return gardenPlants(child)
    .filter((p) => p.mastery === "knows" && !seen.includes(p.id))
    .map((p) => p.id);
}

/** This week's 💧/☀️: one per day played. Only what was earned is shown, so a missed day takes nothing away. */
export function WeekDays({ child, look, now }: { child: Child; look: GardenLook; now: number }) {
  const days = daysThisWeek(child.playDays, now);
  if (!days.length) return null;
  return (
    <div
      aria-label={`ימים ששיחקנו השבוע: ${days.length}`}
      className="flex items-center gap-1 rounded-full bg-white/80 px-4 py-2 text-3xl shadow"
    >
      {days.map((d, i) => (
        <span key={d} className="anim-rise inline-block" style={{ animationDelay: `${i * 90}ms` }} aria-hidden>
          {look.dayIcon}
        </span>
      ))}
    </div>
  );
}

/**
 * The garden on the letters map: a small strip of what is growing, then a few seeds still waiting,
 * glowing and sparkling when something new bloomed (no second hand: the map's hand points at the next station).
 */
export function GardenPreview({ child }: { child: Child }) {
  const look = GARDEN[child.worldId];
  const plants = gardenPlants(child);
  const fresh = unseenBlooms(child).length > 0;
  const blooms = plants.filter((p) => p.mastery === "knows").length;
  // What is growing (flowers first), then a few seeds still waiting: the strip grows as the child plays.
  const growing = plants.filter((p) => p.mastery === "knows").concat(plants.filter((p) => p.mastery === "practicing")).slice(0, 12);
  const seeds = plants.filter((p) => p.mastery === "new").slice(0, Math.max(3, 8 - growing.length));
  return (
    <Link
      href="/play/letters/garden"
      aria-label={look.title}
      className={`btn-3d relative mx-auto flex w-full max-w-md flex-col items-center gap-1 bg-white/90 px-4 py-3 ${
        fresh ? "anim-glow" : ""
      }`}
    >
      <span className="nikud flex items-center gap-2 text-xl font-extrabold">
        {look.blooms[0]} {look.title}
        {blooms > 0 && (
          <span className="rounded-full bg-accent px-2 text-base text-white" aria-hidden>
            {blooms}
          </span>
        )}
      </span>
      <span aria-hidden className="flex flex-wrap items-end justify-center gap-x-1 text-3xl leading-tight">
        {[...growing, ...seeds].map((p) => (
          <span key={p.id} className={p.mastery === "new" ? "text-lg opacity-40" : ""}>
            {p.plant}
          </span>
        ))}
      </span>
      {fresh && (
        <>
          <span aria-hidden className="anim-twinkle absolute -top-3 right-4 text-3xl">
            ✨
          </span>
          <span aria-hidden className="anim-twinkle absolute -bottom-2 left-4 text-2xl" style={{ animationDelay: "0.6s" }}>
            ✨
          </span>
        </>
      )}
    </Link>
  );
}
