"use client";

import { useEffect, useRef, useState } from "react";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { decodable, NIKUD_SYLLABLE_BY_ID, NIKUD_WORD_BY_ID, type NikudWorld } from "@/content/nikud";
import { rightSound, say, sayAt } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { Glyph, markAlone } from "./Glyph";

type Phase = "apart" | "slow" | "joined" | "fastApart" | "fast" | "done";

/**
 * 🐢 → 🐇 Blending: the letter and its vowel stand apart. 🐢 slides them together slowly while the syllable is
 * stretched; 🐇 snaps them together at normal speed, then a word that starts with it. One syllable at a time.
 */
export function BlendGame({ world, syllableIds, onDone }: { world: NikudWorld; syllableIds: string[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <BlendOne
        key={syllableIds[i]}
        id={syllableIds[i]}
        world={world}
        first={i === 0}
        last={i === syllableIds.length - 1}
        onNext={() => (i + 1 < syllableIds.length ? setI(i + 1) : onDone())}
      />
      <div className="flex justify-center gap-2" aria-label={`צירוף ${i + 1} מתוך ${syllableIds.length}`}>
        {syllableIds.map((_, j) => (
          <span key={j} className={`h-3 rounded-full transition-all ${j === i ? "w-8 bg-accent" : j < i ? "w-3 bg-accent" : "w-3 bg-white"}`} />
        ))}
      </div>
    </div>
  );
}

function BlendOne({
  id,
  world,
  first,
  last,
  onNext,
}: {
  id: string;
  world: NikudWorld;
  first: boolean;
  last: boolean;
  onNext: () => void;
}) {
  const s = NIKUD_SYLLABLE_BY_ID[id];
  const word = NIKUD_WORD_BY_ID[s.word];
  const sign = world.marks.find((m) => m.id === s.mark)!.sign;
  const [phase, setPhase] = useState<Phase>("apart");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const slow = () => {
    if (phase === "slow" || phase === "fast" || phase === "fastApart") return;
    setPhase("slow");
    sayAt(0.55, s.audio);
    later(1700, () => setPhase("joined"));
  };
  const fast = () => {
    if (phase === "apart" || phase === "slow") return;
    setPhase("fastApart");
    later(60, () => setPhase("fast"));
    later(380, () => {
      setPhase("done");
      rightSound();
      cheer("happy");
      say(s.audio, "like", word.audio);
    });
  };

  const together = phase === "slow" || phase === "joined" || phase === "fast" || phase === "done";
  const merged = phase === "joined" || phase === "done";
  const duration = phase === "slow" ? "1600ms" : "300ms";
  const gap = s.pre ? 150 : 110;

  return (
    <>
      <Guide compact lines={first ? ["slow-fast"] : []} />
      <div
        data-phase={phase}
        className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-6 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl"
      >
        <div className="relative flex h-56 w-full items-center justify-center">
          {/* The letter (right) and its vowel (left) slide into each other. */}
          {!merged && (
            <>
              <span
                className="nikud absolute flex h-44 items-center justify-center rounded-[2rem] bg-white px-6 pb-4 text-[7.5rem] font-extrabold shadow-lg transition-transform ease-in-out"
                style={{ transform: `translateX(${together ? 0 : gap}px)`, transitionDuration: duration }}
                aria-hidden
              >
                {(s.pre ?? "") + s.base}
              </span>
              <span
                className="nikud absolute flex h-44 min-w-32 items-center justify-center rounded-[2rem] bg-accent px-4 pb-4 text-[7rem] font-extrabold text-white shadow-lg transition-[transform,opacity] ease-in-out"
                style={{
                  transform: `translateX(${together ? 0 : -gap}px)`,
                  opacity: together ? 0.15 : 1,
                  transitionDuration: duration,
                }}
                aria-hidden
              >
                {markAlone(sign)}
              </span>
            </>
          )}
          {merged && (
            <button
              onClick={() => say(s.audio)}
              aria-label="לשמוע שוב"
              className="btn-3d anim-sticker flex h-48 items-center justify-center rounded-[2rem] bg-white px-8 pb-6 text-[8.5rem] font-extrabold"
            >
              <Glyph s={s} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={slow}
            aria-label="לאט"
            className={`btn-3d relative flex h-24 w-28 flex-col items-center justify-center bg-white ${phase === "apart" ? "anim-glow" : ""}`}
          >
            <span className="text-5xl">🐢</span>
            <span className="nikud text-base font-bold">לְאַט</span>
            {phase === "apart" && <PointHand className="-bottom-6 -left-4" />}
          </button>
          <button
            onClick={fast}
            disabled={phase === "apart" || phase === "slow"}
            aria-label="מהר"
            className={`btn-3d relative flex h-24 w-28 flex-col items-center justify-center bg-white transition-opacity disabled:opacity-40 ${
              phase === "joined" ? "anim-glow" : ""
            }`}
          >
            <span className="text-5xl">🐇</span>
            <span className="nikud text-base font-bold">מַהֵר</span>
            {phase === "joined" && <PointHand className="-bottom-6 -left-4" />}
          </button>
        </div>

        {phase === "done" && (
          <div className="anim-rise flex items-center gap-4">
            <button
              onClick={() => say(s.audio, "like", word.audio)}
              aria-label={`כמו ${word.word}`}
              className="btn-3d flex items-center gap-3 bg-white px-5 py-2"
            >
              <span className="text-6xl">{word.emoji}</span>
              {decodable(word.word, world.id) && <span className="nikud text-4xl font-bold">{word.word}</span>}
            </button>
            <button
              onClick={onNext}
              aria-label={last ? "סיימנו" : "הבא"}
              className="btn-3d relative flex h-20 w-20 items-center justify-center bg-accent text-4xl text-white"
            >
              {last ? "✓" : "←"}
              <PointHand className="-bottom-6 -left-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
