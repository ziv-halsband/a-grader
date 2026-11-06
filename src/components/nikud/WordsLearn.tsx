"use client";

import { useEffect, useRef, useState } from "react";
import { Guide } from "@/components/Guide";
import { LearnNav } from "@/components/LearnNav";
import { PointHand } from "@/components/PointHand";
import { chipSound, NIKUD_WORD_BY_ID, readWord } from "@/content/nikud";
import { line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { boingSound, rightSound, say, sayAt } from "@/lib/audio";
import { cheer } from "@/lib/buddy";

/**
 * 📖 Reading together: a word in syllable chips. Tap each chip (it lights up and sounds), then 🐢 reads the whole
 * word slowly (the chips light one by one) and 🐇 reads it fast, and the picture pops out.
 */
export function WordsLearn({
  worldId,
  wordIds,
  gender,
  onDone,
}: {
  worldId: string;
  wordIds: string[];
  gender: Gender;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <WordSlide key={wordIds[i]} id={wordIds[i]} worldId={worldId} intro={i === 0 ? [line("tap-parts", gender)] : []} />
      <LearnNav
        i={i}
        count={wordIds.length}
        onPrev={() => setI(i - 1)}
        onNext={() => setI(i + 1)}
        onDone={onDone}
        doneLabel="לִקְרֹא לְבַד! 🔍"
      />
    </div>
  );
}

function WordSlide({ id, worldId, intro }: { id: string; worldId: string; intro: string[] }) {
  const w = NIKUD_WORD_BY_ID[id];
  const chips = readWord(w.word).chips;
  const [lit, setLit] = useState<number[]>([]);
  const [beat, setBeat] = useState<number | null>(null);
  const [read, setRead] = useState<"none" | "slow" | "fast">("none");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const allLit = lit.length === chips.length;

  const tapChip = (j: number) => {
    setLit((l) => (l.includes(j) ? l : [...l, j]));
    setBeat(j);
    const sound = chipSound(chips[j].text, worldId);
    if (sound) say(sound);
    else boingSound();
  };
  const slow = () => {
    setRead((r) => (r === "fast" ? r : "slow"));
    sayAt(0.6, w.audio);
    // The chips light one after another while the word is stretched.
    chips.forEach((_, j) => timers.current.push(setTimeout(() => setBeat(j), j * 450)));
  };
  const fast = () => {
    setRead("fast");
    setBeat(null);
    rightSound();
    cheer("happy");
    say(w.audio);
  };

  return (
    <>
      <Guide compact lines={intro} />
      <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-6 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
        <div className="flex justify-center gap-2" dir="rtl">
          {chips.map((c, j) => (
            <button
              key={`${j}-${beat === j ? "b" : ""}`}
              onClick={() => tapChip(j)}
              data-chip
              className={`btn-3d nikud relative px-4 pb-4 pt-1 text-6xl font-extrabold transition-colors sm:text-7xl ${
                lit.includes(j) ? "bg-accent text-white" : "bg-white"
              } ${beat === j ? "anim-chip-beat" : ""}`}
            >
              {c.text}
              {!lit.length && j === 0 && <PointHand className="-bottom-7 -left-4" />}
            </button>
          ))}
        </div>

        <div className={`flex items-center gap-5 transition-opacity ${allLit ? "opacity-100" : "pointer-events-none opacity-30"}`}>
          <button onClick={slow} aria-label="לקרוא לאט" className="btn-3d relative flex h-20 w-24 flex-col items-center justify-center bg-white">
            <span className="text-4xl">🐢</span>
            {allLit && read === "none" && <PointHand className="-bottom-6 -left-4" />}
          </button>
          <button
            onClick={fast}
            disabled={read === "none"}
            aria-label="לקרוא מהר"
            className="btn-3d relative flex h-20 w-24 flex-col items-center justify-center bg-white disabled:opacity-40"
          >
            <span className="text-4xl">🐇</span>
            {read === "slow" && <PointHand className="-bottom-6 -left-4" />}
          </button>
        </div>

        <button
          onClick={() => say(w.audio)}
          className={`btn-3d flex items-center gap-4 bg-white px-6 py-3 transition ${read === "fast" ? "anim-glow" : ""}`}
          aria-label={`לשמוע את המילה ${w.word}`}
        >
          <span className="text-2xl">🔊</span>
          <span className="nikud text-5xl font-extrabold">{w.word}</span>
          <span className={`text-6xl ${read === "fast" ? "anim-sticker" : "opacity-0"}`}>{w.emoji}</span>
        </button>
      </div>
    </>
  );
}
