"use client";

import { useEffect, useRef, useState } from "react";
import { Guide } from "@/components/Guide";
import { buildBubbleRounds } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { popSound, say, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";

/** Pop every bubble with the target letter. No timer; a wrong bubble just wobbles. Not scored. */
export function BubblesGame({ stationId, gender, onDone }: { stationId: string; gender: Gender; onDone: () => void }) {
  const [rounds] = useState(() => buildBubbleRounds(stationId));
  const [r, setR] = useState(0);
  const [popped, setPopped] = useState<string[]>([]);
  const [wobble, setWobble] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const round = rounds[r];
  const targets = round.bubbles.filter((b) => b.isTarget).length;

  const tap = async (key: string, isTarget: boolean) => {
    if (popped.includes(key)) return;
    if (!isTarget) {
      setWobble(key);
      setTimeout(() => alive.current && setWobble(null), 420);
      wrongSound();
      cheer("oops");
      return;
    }
    popSound();
    const next = [...popped, key];
    setPopped(next);
    if (next.length === targets) {
      cheer("happy");
      await say(line("champ", gender));
      if (!alive.current) return;
      if (r + 1 >= rounds.length) return onDone();
      setR(r + 1);
      setPopped([]);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <Guide compact lines={[line("bubbles-intro", gender), `letter-${round.target}`]} cue={r} />

      <div className="flex items-center justify-center gap-3">
        <span className="rounded-2xl bg-white px-5 py-1 text-6xl font-extrabold text-accent-2 shadow">
          {LETTER_BY_ID[round.target].char}
        </span>
        <span className="text-2xl font-bold" aria-label={`${popped.length} מתוך ${targets}`}>
          {"🫧".repeat(targets - popped.length)}
          {"✨".repeat(popped.length)}
        </span>
      </div>

      <div key={r} className="mx-auto grid w-full max-w-md flex-1 grid-cols-3 place-items-center gap-3 px-4">
        {round.bubbles.map((b, i) => {
          const gone = popped.includes(b.key);
          return (
            <button
              key={b.key}
              onClick={() => tap(b.key, b.isTarget)}
              disabled={gone}
              aria-label={`בועה עם האות ${LETTER_BY_ID[b.letterId].name}`}
              className={`flex aspect-square w-24 items-center justify-center rounded-full text-6xl font-extrabold text-[var(--ink)] sm:w-28 ${
                gone ? "anim-pop" : wobble === b.key ? "anim-shake" : "anim-bob"
              }`}
              style={{
                animationDelay: gone || wobble === b.key ? "0ms" : `${(i * 370) % 1500}ms`,
                animationDuration: gone || wobble === b.key ? undefined : `${2.6 + (i % 4) * 0.4}s`,
                background:
                  "radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.55) 35%, color-mix(in srgb, var(--accent-2) 30%, transparent) 75%)",
                boxShadow: "inset -6px -8px 16px rgb(255 255 255 / 0.6), 0 6px 14px rgb(0 0 0 / 0.12)",
                border: "2px solid rgb(255 255 255 / 0.9)",
              }}
            >
              {LETTER_BY_ID[b.letterId].char}
            </button>
          );
        })}
      </div>
    </div>
  );
}
