"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import type { Letter } from "@/content/letters";
import { line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { say } from "@/lib/audio";

/** Introduces each letter: big shape, its name, and a word that starts (or, for finals, ends) with it. */
export function Meet({ letters, gender, onDone }: { letters: Letter[]; gender: Gender; onDone: () => void }) {
  const [i, setI] = useState(0);
  const l = letters[i];
  const last = i === letters.length - 1;
  const intro = [`letter-${l.id}`, "like", `word-${l.id}`];

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <Guide compact lines={i === 0 ? [line("meet-intro", gender), ...intro] : intro} />

      <div key={l.id} className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-4 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
        <button
          onClick={() => say(`letter-${l.id}`)}
          aria-label={`האות ${l.name}`}
          className="btn-3d flex h-48 w-48 items-center justify-center rounded-[2rem] bg-white text-[9rem] leading-none font-extrabold text-accent-2 sm:h-56 sm:w-56 sm:text-[11rem]"
        >
          {l.char}
        </button>
        <p className="nikud text-3xl font-extrabold">{l.name}</p>
        <button
          onClick={() => say(`word-${l.id}`)}
          className="btn-3d flex items-center gap-4 bg-white px-6 py-3"
          aria-label={`המילה ${l.word}`}
        >
          <span className="text-6xl">{l.emoji}</span>
          <HighlightedWord word={l.word} char={l.char} fromEnd={!!l.final} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-6 pb-4">
        <button
          onClick={() => setI(i - 1)}
          disabled={i === 0}
          aria-label="האות הקודמת"
          className="btn-3d h-16 w-16 bg-white text-3xl disabled:invisible"
        >
          →
        </button>
        <div className="flex gap-2" aria-hidden>
          {letters.map((x, j) => (
            <span key={x.id} className={`h-3 rounded-full transition-all ${j === i ? "w-8 bg-accent" : "w-3 bg-white"}`} />
          ))}
        </div>
        {last ? (
          <button
            onClick={onDone}
            className="btn-3d bg-accent px-6 py-4 text-2xl font-extrabold text-white"
          >
            לַמִּשְׂחָק! 🎯
          </button>
        ) : (
          <button onClick={() => setI(i + 1)} aria-label="האות הבאה" className="btn-3d h-16 w-16 bg-accent text-3xl text-white">
            ←
          </button>
        )}
      </div>
    </div>
  );
}

/** The word with nikud; the letter being taught is colored. */
function HighlightedWord({ word, char, fromEnd }: { word: string; char: string; fromEnd: boolean }) {
  // A cluster = one letter plus its nikud marks, so the colored part never splits a vowel from its letter.
  const clusters = word.match(/[א-ת][֑-ׇ]*|./g) ?? [word];
  const target = fromEnd ? clusters.findLastIndex((c) => c[0] === char) : clusters.findIndex((c) => c[0] === char);
  return (
    <span className="nikud text-4xl font-bold">
      {clusters.map((c, i) => (
        <span key={i} className={i === target ? "text-accent" : ""}>
          {c}
        </span>
      ))}
    </span>
  );
}
