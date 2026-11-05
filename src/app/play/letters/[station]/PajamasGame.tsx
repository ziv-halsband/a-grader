"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { FINAL_PAIRS, buildPajamaRounds } from "@/content/finals";
import { LETTER_BY_ID } from "@/content/letters";
import { line } from "@/content/voice";
import { rightSound, say, sparkleSound, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { recordGameAnswer } from "@/lib/recordGame";
import type { Child } from "@/lib/store";

/** A little striped nightcap with a pompom, worn by a letter in pajamas. */
function Nightcap({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 30" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path d="M 2 26 Q 20 18 38 26 L 30 6 Q 26 0 20 6 Z" fill="#818cf8" stroke="#4338ca" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 6 20 Q 20 13 34 20" fill="none" stroke="#e0e7ff" strokeWidth="3" />
      <circle cx="18" cy="5" r="5" fill="white" stroke="#c7d2fe" strokeWidth="1.5" />
    </svg>
  );
}

/** A letter asleep: pajama stripes, a nightcap, and z-z-z floating up. */
function SleepingLetter({ char, className = "" }: { char: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="pajamas anim-snooze inline-block">{char}</span>
      <Nightcap className="-top-[0.12em] -right-[0.05em] h-[0.42em] w-[0.55em] rotate-[18deg]" />
      <span className="anim-zzz absolute -top-[0.1em] -left-[0.1em] text-[0.3em]" aria-hidden>
        💤
      </span>
    </span>
  );
}

/**
 * 🛏️ The finals' pajamas (DRAFT story for mom): at the end of a word a letter gets sleepy, puts on its pajamas
 * (the final form, ך ם ן ף ץ) and goes to bed; in the morning, at the start of a word, it takes them off.
 * A word with its picture misses one letter; the child taps the right form (tap, no drag: small fingers).
 * Nights: the gap is a bed at the end of the word. Mornings: the gap is at the start. 6 rounds, no timer.
 */
export function PajamasGame({ child, onDone }: { child: Child; onDone: () => void }) {
  const [rounds] = useState(buildPajamaRounds);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"ask" | "solved" | "end">("ask");
  const [wrong, setWrong] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const alive = useRef(true);
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "end") return;
    sparkleSound();
    cheer("party");
    let t: ReturnType<typeof setTimeout>;
    say("pj-night", line("champ", child.gender)).then(() => {
      t = setTimeout(() => alive.current && finish.current(), 1500);
    });
    return () => clearTimeout(t);
  }, [phase, child.gender]);

  const round = rounds[idx];
  const night = round.where === "end";
  const word = LETTER_BY_ID[round.target];
  // The first night is a demo: the hand shows where to tap, and it isn't scored.
  const demo = idx === 0;

  const tap = async (id: string) => {
    if (phase !== "ask" || id === wrong) return;
    if (id !== round.target) {
      wrongSound();
      cheer("oops");
      setWrong(id);
      setShaking(id);
      setTimeout(() => alive.current && setShaking(null), 420);
      return;
    }
    setPhase("solved");
    rightSound();
    cheer(night ? "happy" : "giggle");
    if (!demo) recordGameAnswer(child.id, round.target, wrong ? "withHelp" : "firstTry", wrong ? 1 : 0);
    await say(`word-${round.target}`, night ? "pj-night" : "good-morning");
    await new Promise((r) => setTimeout(r, 500));
    if (!alive.current) return;
    if (idx + 1 >= rounds.length) return setPhase("end");
    setIdx(idx + 1);
    setPhase("ask");
    setWrong(null);
  };

  const guideLines = wrong
    ? [night ? "pj-end-hint" : "pj-start-hint", line("your-turn", child.gender)]
    : [`word-${round.target}`, night ? "pj-end" : "pj-start"];

  if (phase === "end") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
        <div
          className="relative flex w-full max-w-2xl flex-col items-center gap-6 overflow-hidden rounded-[2rem] px-4 py-10 shadow-2xl"
          style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)" }}
        >
          <Stars />
          <div className="flex flex-wrap items-end justify-center gap-5 text-8xl font-extrabold sm:gap-8" dir="rtl">
            {FINAL_PAIRS.map((p, i) => (
              <span key={p.final} className="anim-sticker flex flex-col items-center" style={{ animationDelay: `${i * 200}ms` }}>
                <SleepingLetter char={LETTER_BY_ID[p.final].char} />
                <span className="-mt-4 text-5xl" aria-hidden>
                  🛏️
                </span>
              </span>
            ))}
          </div>
        </div>
        <Confetti count={50} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4" data-game="pajamas" data-target={round.target}>
      <Guide compact lines={guideLines} intro={["pj-intro"]} cue={idx * 10 + (wrong ? 1 : 0)} />

      <div className="flex justify-center gap-2" aria-label={`סיבוב ${idx + 1} מתוך ${rounds.length}`}>
        {rounds.map((r, i) => (
          <span
            key={r.key}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
              i < idx ? "bg-indigo-200" : i === idx ? "bg-white ring-2 ring-indigo-500" : "bg-white/60"
            }`}
          >
            {i < idx ? (r.where === "end" ? "🌙" : "☀️") : ""}
          </span>
        ))}
      </div>

      <div key={round.key} className="anim-rise flex flex-1 flex-col items-center justify-center gap-5 px-3">
        {/* The word's little world: a starry night (end of the word) or a sunny morning (start). */}
        <div
          className="relative flex w-full max-w-2xl flex-col items-center gap-3 overflow-hidden rounded-[2rem] px-4 pt-5 pb-6 shadow-xl"
          style={{
            background: night
              ? "linear-gradient(180deg, #1e1b4b 0%, #312e81 65%, #4338ca 100%)"
              : "linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #fef3c7 100%)",
          }}
        >
          {night ? <Stars /> : <Morning />}
          <span className="anim-bob relative text-7xl sm:text-8xl" aria-hidden>
            {word.emoji}
          </span>
          <div
            dir="rtl"
            aria-label={word.word}
            className="relative flex items-end rounded-3xl bg-white/95 px-5 pt-2 pb-3 text-7xl font-extrabold text-[var(--ink)] shadow-lg sm:text-8xl"
          >
            {round.parts.map((part, i) =>
              i !== round.gap ? (
                <span key={i} className="nikud" aria-hidden>
                  {part}
                </span>
              ) : phase === "solved" ? (
                <span key={i} className="anim-sticker nikud flex flex-col items-center" aria-hidden>
                  {night ? <SleepingLetter char={part} /> : <span className="text-accent-2">{part}</span>}
                  {night && <span className="-mt-3 text-4xl">🛏️</span>}
                </span>
              ) : (
                <span key={i} className="mx-1 flex flex-col items-center" aria-hidden>
                  <span className="flex h-[1.1em] w-[0.75em] items-center justify-center rounded-2xl border-4 border-dashed border-indigo-300 bg-indigo-50/70 text-indigo-300">
                    <span className="text-[0.45em]">?</span>
                  </span>
                  {night && <span className="-mt-2 text-4xl">🛏️</span>}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {round.options.map((id) => {
            const isAnswer = id === round.target;
            return (
              <button
                key={id}
                onClick={() => tap(id)}
                disabled={wrong === id}
                aria-label={`האות ${LETTER_BY_ID[id].name}`}
                data-letter={id}
                className={`btn-3d relative flex aspect-square w-28 items-center justify-center rounded-[2rem] bg-white text-8xl font-extrabold transition-opacity sm:w-36 sm:text-9xl ${
                  wrong === id ? "opacity-25" : ""
                } ${shaking === id ? "anim-shake" : ""} ${wrong && isAnswer && phase === "ask" ? "anim-glow ring-4 ring-yellow-400" : ""} ${
                  phase === "solved" && isAnswer ? "opacity-30" : ""
                }`}
              >
                <span className="-mt-2 leading-none">{LETTER_BY_ID[id].char}</span>
                {demo && isAnswer && phase === "ask" && !wrong && <PointHand className="-bottom-6 -left-5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stars() {
  const stars = [
    [8, 14],
    [22, 70],
    [35, 22],
    [62, 12],
    [78, 60],
    [90, 24],
    [50, 84],
    [12, 50],
  ];
  return (
    <>
      <span className="absolute top-3 left-4 text-5xl" aria-hidden>
        🌙
      </span>
      {stars.map(([x, y], i) => (
        <span
          key={i}
          aria-hidden
          className="anim-glimmer absolute text-lg text-yellow-200"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 300}ms` }}
        >
          ✦
        </span>
      ))}
    </>
  );
}

function Morning() {
  return (
    <>
      <span className="anim-bob absolute top-3 left-4 text-5xl" aria-hidden>
        ☀️
      </span>
      <span className="absolute top-6 right-6 text-4xl opacity-90" aria-hidden>
        ☁️
      </span>
      <span className="absolute bottom-6 left-10 text-3xl opacity-80" aria-hidden>
        ☁️
      </span>
    </>
  );
}
