"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { buildFindItems } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { PRAISE, line } from "@/content/voice";
import { say } from "@/lib/audio";
import { pick } from "@/lib/random";
import { actions, type Child } from "@/lib/store";

/**
 * "Where is the letter X?" — the check that the child knows the letters.
 * Hint ladder (no timer, no penalty): wrong once → that card fades and the question repeats;
 * wrong again → the guide shows the right letter and the child taps it.
 * Only a first-try answer counts as "knows"; anything after help is recorded separately.
 */
export function FindGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [items] = useState(() => buildFindItems(stationId));
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shaking, setShaking] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [solved, setSolved] = useState(false);
  /** What the guide says after a wrong tap (null = the question itself). */
  const [hint, setHint] = useState<{ lines: string[]; n: number } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const item = items[idx];
  const g = child.gender;
  const prompt = idx === 0 ? [line("find-intro", g), "find-prompt", `letter-${item.target}`] : ["find-prompt", `letter-${item.target}`];

  const tap = async (id: string) => {
    if (solved || wrong.includes(id)) return;
    if (id === item.target) {
      setSolved(true);
      actions.recordLetter(child.id, item.target, wrong.length === 0 ? "firstTry" : "withHelp", wrong.length);
      await say(line(pick(PRAISE), g));
      await new Promise((r) => setTimeout(r, 350));
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
    const left = item.options.filter((o) => o !== item.target && !nextWrong.includes(o));
    const n = (hint?.n ?? 0) + 1;
    if (left.length === 0) {
      setDemo(true);
      setHint({ lines: ["here-it-is", `letter-${item.target}`, line("your-turn", g)], n });
    } else {
      setHint({ lines: [line("try-again", g), "find-prompt", `letter-${item.target}`], n });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <Guide compact lines={hint?.lines ?? prompt} cue={idx * 100 + (hint?.n ?? 0)} />

      <div className="flex justify-center gap-2" aria-label={`שאלה ${idx + 1} מתוך ${items.length}`}>
        {items.map((_, i) => (
          <span key={i} className={`h-3 w-3 rounded-full ${i < idx ? "bg-accent" : i === idx ? "bg-white ring-2 ring-accent" : "bg-white/60"}`} />
        ))}
      </div>

      <div key={idx} className="anim-rise flex flex-1 items-center justify-center gap-4 px-4">
        {item.options.map((id) => {
          const isWrong = wrong.includes(id);
          const isAnswer = id === item.target;
          return (
            <button
              key={id}
              onClick={() => tap(id)}
              disabled={isWrong}
              aria-label={`האות ${LETTER_BY_ID[id].name}`}
              className={`btn-3d flex aspect-square w-28 items-center justify-center rounded-[2rem] bg-white text-8xl font-extrabold transition-opacity sm:w-36 sm:text-9xl ${
                isWrong ? "opacity-25" : ""
              } ${shaking === id ? "anim-shake" : ""} ${demo && isAnswer ? "anim-glow ring-4 ring-yellow-400" : ""} ${
                solved && isAnswer ? "scale-110 bg-green-100 ring-4 ring-green-400" : ""
              }`}
            >
              {LETTER_BY_ID[id].char}
            </button>
          );
        })}
      </div>
      {solved && <Confetti key={`confetti-${idx}`} count={30} />}
    </div>
  );
}
