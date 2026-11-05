"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PRAISE, line } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { rightSound, say, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { pick } from "@/lib/random";
import type { Result } from "@/lib/store";

export type ChoiceItem = {
  target: string;
  options: string[];
  /** What the guide asks (audio ids). */
  prompt: string[];
  /** Shown above the options (e.g. the letter, or the word to read). A function gets "solved" (e.g. to reveal a hidden picture). */
  cue?: ReactNode | ((solved: boolean) => ReactNode);
  /** Audio ids said but not written in the caption (a by-ear question must not show the word to match by eye). */
  unseen?: string[];
  /** Card style for this question (a quiz can mix letters and pictures). */
  size?: "big" | "picture";
};

/**
 * One question at a time, 3 big choices. Every quiz in the adventure uses this, so they all share
 * the same hint ladder (no timer, no penalty):
 *   wrong once  → that card fades, the guide repeats the question;
 *   wrong again → the guide shows the answer and the child taps it.
 * Only a first-try answer counts as "knows"; anything after help is reported as "withHelp".
 */
export function ChoiceGame<T extends ChoiceItem>({
  items,
  intro,
  gender,
  renderOption,
  optionLabel,
  reveal,
  onSolved,
  explainWrong,
  onAnswer,
  onDone,
  size = "big",
  progress = true,
}: {
  items: T[];
  /** Said once before the first question. */
  intro?: string[];
  gender: Gender;
  renderOption: (id: string, item: T) => ReactNode;
  optionLabel: (id: string, item: T) => string;
  /** Said when the guide shows the answer (before "now you"). */
  reveal: (item: T) => string[];
  /**
   * After a first wrong tap: why it is wrong ("כִּמְעַט! קוֹף מַתְחִיל בָּאוֹת קוֹף"), then "try again".
   * Without it, the question is simply asked again.
   */
  explainWrong?: (item: T, tapped: string) => string[];
  /** Said right after a correct tap, before the praise (e.g. the word that was read). */
  onSolved?: (item: T) => string[];
  onAnswer: (item: T, result: Result, misses: number) => void;
  onDone: () => void;
  size?: "big" | "picture";
  /** The "question n of N" dots (off when a game shows its own progress, one question at a time). */
  progress?: boolean;
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
      rightSound();
      cheer("happy");
      onAnswer(item, wrong.length === 0 && !demo ? "firstTry" : "withHelp", wrong.length);
      // Praise only every other answer: the chime and the buddy already say "yes".
      const praise = idx % 2 === 1 ? [line(pick(PRAISE), gender)] : [];
      await say(...(onSolved?.(item) ?? []), ...praise);
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
    wrongSound();
    cheer("oops");
    setWrong(nextWrong);
    setShaking(id);
    setTimeout(() => alive.current && setShaking(null), 420);
    const n = (hint?.n ?? 0) + 1;
    const left = item.options.filter((o) => o !== item.target && !nextWrong.includes(o));
    if (nextWrong.length >= 2 || left.length === 0) {
      setDemo(true);
      setHint({ lines: [...reveal(item), line("your-turn", gender)], n });
    } else {
      // Say why it was wrong, then "try again" (or, without an explanation, just the question again).
      setHint({ lines: explainWrong ? [...explainWrong(item, id), line("try-again", gender)] : item.prompt, n });
    }
  };

  const big = (item.size ?? size) === "big";
  return (
    <div className="flex flex-1 flex-col gap-5 py-4">
      <Guide compact lines={hint?.lines ?? prompt} unseen={item.unseen} cue={idx * 100 + (hint?.n ?? 0)} />

      {progress && (
        <div className="flex justify-center gap-2" aria-label={`שאלה ${idx + 1} מתוך ${items.length}`}>
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full ${i < idx ? "bg-accent" : i === idx ? "bg-white ring-2 ring-accent" : "bg-white/60"}`}
            />
          ))}
        </div>
      )}

      <div key={idx} className="anim-rise flex flex-1 flex-col items-center justify-center gap-6 px-4">
        {typeof item.cue === "function" ? item.cue(solved) : item.cue}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {item.options.map((id) => {
            const isWrong = wrong.includes(id);
            const isAnswer = id === item.target;
            return (
              <button
                key={id}
                onClick={() => tap(id)}
                disabled={isWrong}
                aria-label={optionLabel(id, item)}
                className={`btn-3d flex aspect-square items-center justify-center rounded-[2rem] bg-white font-extrabold transition-opacity ${
                  big ? "w-28 text-8xl sm:w-36 sm:text-9xl" : "w-24 text-6xl sm:w-32 sm:text-7xl"
                } ${isWrong ? "opacity-25" : ""} ${shaking === id ? "anim-shake" : ""} ${
                  demo && isAnswer ? "anim-glow ring-4 ring-yellow-400" : ""
                } ${solved && isAnswer ? "scale-110 bg-green-100 ring-4 ring-green-400" : ""}`}
              >
                {renderOption(id, item)}
              </button>
            );
          })}
        </div>
      </div>
      {solved && <Confetti key={`confetti-${idx}`} count={30} />}
    </div>
  );
}
