"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { LearnNav } from "@/components/LearnNav";
import { READ_WORD_BY_ID } from "@/content/kamatz";
import { line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { say } from "@/lib/audio";

/** Reading a word part by part: tap each syllable chip (it lights up and sounds), then the whole word. */
export function WordsLearn({ wordIds, gender, onDone }: { wordIds: string[]; gender: Gender; onDone: () => void }) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <WordSlide key={wordIds[i]} id={wordIds[i]} intro={i === 0 ? [line("learn-words-intro", gender)] : []} />
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

function WordSlide({ id, intro }: { id: string; intro: string[] }) {
  const w = READ_WORD_BY_ID[id];
  const [lit, setLit] = useState<number[]>([]);
  const allLit = lit.length === w.parts.length;
  return (
    <>
      <Guide compact lines={intro} />
      <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-6 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
        <div className="flex justify-center gap-2">
          {w.parts.map((p, j) => (
            <button
              key={j}
              onClick={() => {
                setLit((l) => (l.includes(j) ? l : [...l, j]));
                if (p.syl) say(`syl-${p.syl}`);
              }}
              className={`btn-3d nikud px-4 pb-4 pt-2 text-7xl font-extrabold transition-colors sm:text-8xl ${
                lit.includes(j) ? "bg-accent text-white" : "bg-white"
              }`}
            >
              {p.text}
            </button>
          ))}
        </div>
        <button
          onClick={() => say(`rw-${id}`)}
          className={`btn-3d flex items-center gap-4 bg-white px-6 py-3 transition ${allLit ? "anim-glow" : ""}`}
          aria-label={`לשמוע את המילה ${w.word}`}
        >
          <span className="text-2xl">🔊</span>
          <span className="nikud text-5xl font-extrabold">{w.word}</span>
          <span className={`text-6xl transition-opacity ${allLit ? "opacity-100" : "opacity-0"}`}>{w.emoji}</span>
        </button>
      </div>
    </>
  );
}
