"use client";

import { useEffect, useState } from "react";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import type { Letter } from "@/content/letters";
import { line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { boingSound, say, sayStepped, sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { shuffle } from "@/lib/random";

/**
 * 📖 Learn, in two parts:
 *  1. Meet each letter: big shape, its name, and a word that starts (or, for finals, ends) with it, its letter
 *     colored like the big one. The guide says the name, then the word ("בֵּית… בַּיִת"), and each one lights up
 *     as it is said, so the child hears the name's start inside the word. Tap the letter → its name, tap the word → the word.
 *  2. 🗣️ Say it, then check (research item 14): each letter again, without its name. The child says it out loud,
 *     then taps 👂 to hear if they were right. No speech recognition, nothing to lose.
 * DRAFT for mom: name → word until she decides how to say the bare letter sound.
 */
export function Meet({ letters, gender, onDone }: { letters: Letter[]; gender: Gender; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<"meet" | "say">("meet");
  const [order] = useState(() => shuffle(letters));

  if (stage === "say")
    return (
      <SayCheck
        letters={order}
        gender={gender}
        onBack={() => {
          setStage("meet");
          setI(letters.length - 1);
        }}
        onDone={onDone}
      />
    );
  return <MeetLetter key={letters[i].id} letters={letters} i={i} onGo={setI} onNext={() => setStage("say")} />;
}

function MeetLetter({ letters, i, onGo, onNext }: { letters: Letter[]; i: number; onGo: (i: number) => void; onNext: () => void }) {
  /** Letters come alive: every tap wiggles (counter restarts the animation). */
  const [taps, setTaps] = useState(0);
  /** The line being said right now (audio id), to light up the letter or the word. */
  const [glow, setGlow] = useState<string | null>(null);
  const l = letters[i];
  const name = `letter-${l.id}`;
  const word = `word-${l.id}`;
  const play = (id: string) => sayStepped([id], () => setGlow(id)).then((all) => all && setGlow(null));

  return (
    <div className="flex flex-1 flex-col gap-3 py-3">
      <Guide compact intro={["meet-intro"]} lines={[name, word]} onStep={setGlow} />

      <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-2 rounded-[2.5rem] bg-[var(--card)]/90 p-5 shadow-xl">
        <button
          onClick={() => {
            boingSound();
            cheer("giggle");
            setTaps((t) => t + 1);
            play(name);
          }}
          aria-label={`האות ${l.name}`}
          className={`btn-3d relative flex h-44 w-44 items-center justify-center rounded-[2rem] bg-white text-[8.5rem] leading-none font-extrabold text-accent-2 transition-transform duration-300 sm:h-52 sm:w-52 sm:text-[10.5rem] ${
            glow === name ? "scale-105 ring-8 ring-yellow-300" : ""
          }`}
        >
          <span key={taps} className={taps ? "anim-wiggle inline-block" : "inline-block"}>
            {l.char}
          </span>
          {i === 0 && taps === 0 && <PointHand className="-bottom-4 -left-4" />}
        </button>
        <p className={`nikud text-3xl font-extrabold transition-colors ${glow === name ? "text-accent-2" : ""}`}>{l.name}</p>

        {/* name → word: the same start, said one after the other. */}
        <span aria-hidden className={`text-3xl leading-none text-accent-2 transition-opacity ${glow ? "opacity-100" : "opacity-40"}`}>
          ⬇
        </span>

        <button
          onClick={() => play(word)}
          className={`btn-3d flex items-center gap-4 bg-white px-6 py-2 transition-transform duration-300 ${
            glow === word ? "scale-105 ring-8 ring-yellow-300" : ""
          }`}
          aria-label={`המילה ${l.word}`}
        >
          <span className={`inline-block text-6xl ${glow === word ? "anim-wiggle" : ""}`}>{l.emoji}</span>
          <HighlightedWord word={l.word} char={l.char} fromEnd={!!l.final} pop={glow === word} />
        </button>
      </div>

      <Nav
        dots={letters.length}
        at={i}
        onPrev={i > 0 ? () => onGo(i - 1) : undefined}
        onNext={() => (i === letters.length - 1 ? onNext() : onGo(i + 1))}
      />
    </div>
  );
}

/** 🗣️ Say it, then check: the letter alone; say its name out loud, then 👂 to hear it. */
function SayCheck({ letters, gender, onBack, onDone }: { letters: Letter[]; gender: Gender; onBack: () => void; onDone: () => void }) {
  const [j, setJ] = useState(0);
  const [heard, setHeard] = useState(false);
  /** The hand points at 👂 only after a moment: first the child says it, then checks. */
  const [hint, setHint] = useState(false);
  const l = letters[j];
  const last = j === letters.length - 1;

  useEffect(() => {
    const t = setTimeout(() => setHint(true), 2500);
    return () => clearTimeout(t);
  }, [j]);

  const go = (k: number) => {
    setJ(k);
    setHeard(false);
    setHint(false);
  };
  const check = () => {
    if (!heard) {
      sparkleSound();
      cheer("happy");
    }
    setHeard(true);
    say(`letter-${l.id}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-3 py-3">
      <Guide compact once lines={[line("say-aloud", gender)]} />

      <div key={l.id} className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-4 rounded-[2.5rem] bg-[var(--card)]/90 p-5 shadow-xl">
        <div className="relative flex h-44 w-44 items-center justify-center rounded-[2rem] bg-white text-[8.5rem] leading-none font-extrabold text-accent-2 shadow-[0_6px_0_rgb(0_0_0/0.18)] sm:h-52 sm:w-52 sm:text-[10.5rem]">
          {l.char}
          <span aria-hidden className={`absolute -top-6 -right-8 text-6xl ${heard ? "" : "anim-bob"}`}>
            🗣️
          </span>
        </div>
        <p className={`nikud h-12 text-3xl font-extrabold ${heard ? "anim-sticker" : "invisible"}`}>{l.name}</p>
        <button
          onClick={check}
          aria-label="לשמוע אם צדקתי"
          className={`btn-3d relative flex h-24 w-24 items-center justify-center rounded-full text-6xl ${
            heard ? "bg-green-100 ring-4 ring-green-400" : "bg-white"
          }`}
        >
          <span aria-hidden>👂</span>
          {hint && !heard && <PointHand className="-bottom-5 -left-4" />}
        </button>
      </div>

      <Nav
        dots={letters.length}
        at={j}
        icon="🗣️"
        onPrev={() => (j > 0 ? go(j - 1) : onBack())}
        // Only after hearing it: no tapping through without checking.
        onNext={heard ? () => (last ? onDone() : go(j + 1)) : undefined}
        done={last}
        pointNext={heard}
      />
    </div>
  );
}

/** Back / dots / next. The very last step shows the big "to the game" button. */
function Nav({
  dots,
  at,
  icon,
  onPrev,
  onNext,
  done = false,
  pointNext = false,
}: {
  dots: number;
  at: number;
  icon?: string;
  onPrev?: () => void;
  onNext?: () => void;
  done?: boolean;
  pointNext?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-6 pb-4">
      <button onClick={onPrev} disabled={!onPrev} aria-label="הקודם" className="btn-3d h-16 w-16 bg-white text-3xl disabled:invisible">
        →
      </button>
      <div className="flex items-center gap-2" aria-hidden>
        {icon && <span className="text-2xl">{icon}</span>}
        {Array.from({ length: dots }, (_, k) => (
          <span key={k} className={`h-3 rounded-full transition-all ${k === at ? "w-8 bg-accent" : "w-3 bg-white"}`} />
        ))}
      </div>
      {done ? (
        <button
          onClick={onNext}
          disabled={!onNext}
          className="btn-3d relative bg-accent px-6 py-4 text-2xl font-extrabold text-white disabled:opacity-40"
        >
          לַמִּשְׂחָק! 🎯
          {pointNext && <PointHand className="-bottom-6 -left-2" />}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!onNext}
          aria-label="הבא"
          className="btn-3d relative h-16 w-16 bg-accent text-3xl text-white disabled:opacity-40"
        >
          ←
          {pointNext && <PointHand className="-bottom-6 -left-2" />}
        </button>
      )}
    </div>
  );
}

/** The word with nikud; the letter being taught is colored like the big letter (and pops while the word is said). */
function HighlightedWord({ word, char, fromEnd, pop }: { word: string; char: string; fromEnd: boolean; pop: boolean }) {
  // A cluster = one letter plus its nikud marks, so the colored part never splits a vowel from its letter.
  const clusters = word.match(/[א-ת][֑-ׇ]*|./g) ?? [word];
  const target = fromEnd ? clusters.findLastIndex((c) => c[0] === char) : clusters.findIndex((c) => c[0] === char);
  return (
    <span className="nikud text-5xl font-bold">
      {clusters.map((c, i) => (
        <span
          key={i}
          className={i === target ? `inline-block rounded-xl bg-accent-2/15 px-1 font-extrabold text-accent-2 transition-transform duration-300 ${pop ? "scale-125" : ""}` : ""}
        >
          {c}
        </span>
      ))}
    </span>
  );
}
