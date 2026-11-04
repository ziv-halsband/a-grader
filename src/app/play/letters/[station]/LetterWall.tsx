"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { LETTER_BY_ID } from "@/content/letters";
import { boingSound, say } from "@/lib/audio";
import { cheer } from "@/lib/buddy";

/** "Learn" in a mixed station: every letter so far on one wall; tap one to hear it ("ב, like בַּיִת"). */
export function LetterWall({ letterIds, onDone }: { letterIds: string[]; onDone: () => void }) {
  const [tapped, setTapped] = useState<{ id: string; n: number } | null>(null);
  return (
    <div className="flex flex-1 flex-col items-center gap-5 py-4 pb-28">
      <Guide compact once lines={["mix-intro"]} />
      <div className="grid w-full max-w-2xl grid-cols-5 gap-2 px-4 sm:grid-cols-7">
        {letterIds.map((id, i) => {
          const l = LETTER_BY_ID[id];
          return (
            <button
              key={id}
              onClick={() => {
                boingSound();
                cheer("giggle");
                setTapped((t) => ({ id, n: (t?.n ?? 0) + 1 }));
                say(`letter-${id}`, "like", `word-${id}`);
              }}
              aria-label={l.name}
              className="btn-3d anim-rise flex aspect-square flex-col items-center justify-center bg-white text-4xl font-extrabold sm:text-5xl"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <span key={tapped?.id === id ? tapped.n : 0} className={tapped?.id === id ? "anim-wiggle inline-block" : "inline-block"}>
                {l.char}
              </span>
              <span className="text-base" aria-hidden>
                {l.emoji}
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={onDone} className="btn-3d bg-accent px-8 py-4 text-2xl font-extrabold text-white">
        לַמִּשְׂחָק! 🎯
      </button>
    </div>
  );
}
