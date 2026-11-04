"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PRAISE, line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { say } from "@/lib/audio";
import { pick } from "@/lib/random";
import type { Result } from "@/lib/store";

export type ChoiceItem = {
  target: string;
  options: string[];
  /** What the guide asks (audio ids). */
  prompt: string[];
  /** Shown above the options (e.g. the letter, or the word to read). */
  cue?: ReactNode;
};

/**
 * One question at a time, 3 big choices. Every quiz in the adventure uses this, so they all share
 * the same hint ladder (no timer, no penalty):
 *   wrong once  → that card fades, the guide repeats the question;
 *   wrong again → the guide shows the answer and the child taps it.
 * Only a first-try answer counts as "knows"; anything after help is reported as "withHelp".
 */
export function ChoiceGame({
  items,
  intro,
  gender,
  renderOption,
  optionLabel,
  reveal,
  onSolved,
  onAnswer,
  onDone,
  size = "big",
}: {
  items: ChoiceItem[];
  /** Said once before the first question. */
  intro?: string[];
  gender: Gender;
  renderOption: (id: string) => ReactNode;
  optionLabel: (id: string) => string;
  /** Said when the guide shows the answer (before "now you"). */
  reveal: (target: string) => string[];
  /** Said right after a correct tap, before the praise (e.g. the word that was read). */
  onSolved?: (target: string) => string[];
  onAnswer: (target: string, result: Result, misses: number) => void;
  onDone: () => void;
  size?: "big" | "picture";
}) {
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shaking, setShaking] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState<{ lines: string[]; n: number } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const item = items[idx];
  const prompt = idx === 0 && intro ? [...intro, ...item.prompt] : item.prompt;

  const tap = async (id: string) => {
    if (solved || wrong.includes(id)) return;
    if (id === item.target) {
      setSolved(true);
      onAnswer(item.target, wrong.length === 0 && !demo ? "firstTry" : "withHelp", wrong.length);
      await say(...(onSolved?.(item.target) ?? []), line(pick(PRAISE), gender));
      await new Promise((r) => setTimeout(r, 300));
      if (!alive.current) return;
      if (idx + 1 >= items.length) return onDone();
      setIdx(idx + 1);
      setWrong([]);
      setDemo(false);
      setSolved(false);
      setHint(null);
      return;
    }
    const nextWrong = [...wrong, id];
    setWrong(nextWrong);
    setShaking(id);
    setTimeout(() => alive.current && setShaking(null), 420);
    const n = (hint?.n ?? 0) + 1;
    const left = item.options.filter((o) => o !== item.target && !nextWrong.includes(o));
    if (nextWrong.length >= 2 || left.length === 0) {
      setDemo(true);
      setHint({ lines: [...reveal(item.target), line("your-turn", gender)], n });
    } else {
      setHint({ lines: [line("try-again", gender), ...item.prompt], n });
    }
  };

  const big = size === "big";
  return (
    <div className="flex flex-1 flex-col gap-5 py-4">
      <Guide compact lines={hint?.lines ?? prompt} cue={idx * 100 + (hint?.n ?? 0)} />

      <div className="flex justify-center gap-2" aria-label={`שאלה ${idx + 1} מתוך ${items.length}`}>
        {items.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${i < idx ? "bg-accent" : i === idx ? "bg-white ring-2 ring-accent" : "bg-white/60"}`}
          />
        ))}
      </div>

      <div key={idx} className="anim-rise flex flex-1 flex-col items-center justify-center gap-6 px-4">
        {item.cue}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {item.options.map((id) => {
            const isWrong = wrong.includes(id);
            const isAnswer = id === item.target;
            return (
              <button
                key={id}
                onClick={() => tap(id)}
                disabled={isWrong}
                aria-label={optionLabel(id)}
                className={`btn-3d flex aspect-square items-center justify-center rounded-[2rem] bg-white font-extrabold transition-opacity ${
                  big ? "w-28 text-8xl sm:w-36 sm:text-9xl" : "w-24 text-6xl sm:w-32 sm:text-7xl"
                } ${isWrong ? "opacity-25" : ""} ${shaking === id ? "anim-shake" : ""} ${
                  demo && isAnswer ? "anim-glow ring-4 ring-yellow-400" : ""
                } ${solved && isAnswer ? "scale-110 bg-green-100 ring-4 ring-green-400" : ""}`}
              >
                {renderOption(id)}
              </button>
            );
          })}
        </div>
      </div>
      {solved && <Confetti key={`confetti-${idx}`} count={30} />}
    </div>
  );
}
