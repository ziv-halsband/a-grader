"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { ACCESSORY_BY_ID, HEROES } from "@/content/buddies";
import { rewardPath } from "@/content/rewards";
import { WORLDS } from "@/content/worlds";
import { boingSound, sparkleSound } from "@/lib/audio";
import type { Child } from "@/lib/store";
import { BuddyAvatar } from "./BuddyAvatar";

const CARDS = ["tour-friend", "tour-surprise", "tour-heroes", "tour-go"] as const;

/**
 * Right after the buddy is picked (once per child): four short, mostly visual cards.
 * The friend → every station has a surprise (sticker + a gift for the friend) → new heroes join → let's go.
 * One big tap moves on; the map's pointing hand then shows the first station.
 */
export function BuddyTour({ child, onDone }: { child: Child; onDone: () => void }) {
  const [card, setCard] = useState(0);
  const world = WORLDS[child.worldId];
  const first = rewardPath(world)[0];
  const last = card === CARDS.length - 1;
  const next = () => {
    if (last) {
      sparkleSound();
      onDone();
    } else {
      boingSound();
      setCard((c) => c + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="anim-rise flex w-full max-w-lg flex-col items-center gap-5 rounded-[2.5rem] bg-[var(--card)] p-6 shadow-2xl">
        <Guide compact lines={[CARDS[card]]} />

        <button
          key={card}
          onClick={next}
          aria-label="הלאה"
          className="anim-rise flex min-h-52 w-full items-center justify-center gap-4"
        >
          {card === 0 && child.buddy && (
            <span className="anim-dance inline-block origin-bottom">
              <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={150} />
            </span>
          )}
          {card === 1 && (
            <>
              <span className="anim-bob text-8xl">{world.surprise.closed}</span>
              <span className="text-4xl opacity-60">←</span>
              <span className="anim-fly flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white text-6xl shadow-lg">
                {first.sticker}
              </span>
              <span
                className="anim-fly flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/80 text-5xl shadow-lg"
                style={{ animationDelay: "250ms" }}
              >
                {ACCESSORY_BY_ID[first.gift].emoji}
              </span>
            </>
          )}
          {card === 2 &&
            HEROES.map((h, i) => (
              <span key={h.id} className="anim-rise flex flex-col items-center gap-2" style={{ animationDelay: `${i * 150}ms` }}>
                <span className="anim-bob inline-block text-7xl brightness-0 opacity-40" style={{ animationDelay: `${i * 400}ms` }}>
                  {h.emoji}
                </span>
                <span className="nikud flex h-10 min-w-10 items-center justify-center rounded-full bg-white px-2 text-2xl font-extrabold shadow">
                  {h.hint}
                </span>
              </span>
            ))}
          {card === 3 && (
            <>
              {child.buddy && (
                <span className="anim-jump inline-block origin-bottom">
                  <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={110} />
                </span>
              )}
              <span className="text-8xl">🗺️</span>
            </>
          )}
        </button>

        <div className="flex gap-2" aria-hidden>
          {CARDS.map((c, i) => (
            <span key={c} className={`h-3 w-3 rounded-full ${i === card ? "bg-accent" : "bg-black/15"}`} />
          ))}
        </div>

        <button
          onClick={next}
          className="btn-3d nikud relative w-full bg-accent px-6 py-4 text-3xl font-extrabold text-white"
        >
          {last ? "יוֹצְאִים! ←" : "←"}
          <PointHand className="-bottom-6 left-6" />
        </button>
      </div>
    </div>
  );
}
