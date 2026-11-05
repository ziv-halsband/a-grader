"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { LETTER_BY_ID } from "@/content/letters";
import { buildHuntRounds, huntWordId, type HuntRound, type SceneObject } from "@/content/scenes";
import { line } from "@/content/voice";
import { popSound, rightSound, say, sparkleSound, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { recordGameAnswer } from "@/lib/recordGame";
import type { Child } from "@/lib/store";

/** Each scene's backdrop, drawn with CSS only (no image files): a tiled kitchen, a park, a beach. */
const BACKDROPS: Record<HuntRound["scene"], { style: CSSProperties; layers: ReactNode }> = {
  kitchen: {
    style: {
      backgroundColor: "#fff7ed",
      backgroundImage:
        "linear-gradient(90deg, rgb(251 146 60 / 0.18) 1px, transparent 1px), linear-gradient(rgb(251 146 60 / 0.18) 1px, transparent 1px)",
      backgroundSize: "8cqw 8cqw",
    },
    layers: (
      <>
        {/* The shelf. */}
        <span className="absolute inset-x-[3%] top-[26%] h-[3%] rounded-full bg-amber-700 shadow-md" />
        {/* The counter, then a checked tablecloth. */}
        <span className="absolute inset-x-0 top-[59%] h-[7%] bg-gradient-to-b from-slate-300 to-slate-400" />
        <span
          className="absolute inset-x-0 top-[66%] bottom-0"
          style={{
            backgroundColor: "#fecaca",
            backgroundImage:
              "linear-gradient(90deg, rgb(239 68 68 / 0.35) 50%, transparent 50%), linear-gradient(rgb(239 68 68 / 0.35) 50%, transparent 50%)",
            backgroundSize: "6cqw 6cqw",
          }}
        />
      </>
    ),
  },
  park: {
    style: { background: "linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 48%, #86efac 50%, #22c55e 100%)" },
    layers: (
      <>
        <span className="absolute -bottom-[10%] left-[30%] h-[40%] w-[40%] rounded-[50%] bg-amber-100/70" />
        <span className="absolute top-[47%] left-[4%] text-[4cqw]">🌿</span>
        <span className="absolute top-[74%] right-[3%] text-[4cqw]">🌼</span>
        <span className="absolute top-[52%] right-[40%] text-[3cqw]">🌱</span>
      </>
    ),
  },
  sea: {
    style: { background: "linear-gradient(180deg, #bae6fd 0%, #e0f2fe 27%, #38bdf8 28%, #0284c7 70%, #fde68a 71%, #fcd34d 100%)" },
    layers: (
      <>
        {[34, 48, 62].map((y) => (
          <span
            key={y}
            className="absolute inset-x-0 h-[3%] opacity-40"
            style={{
              top: `${y}%`,
              backgroundImage: "radial-gradient(circle at 50% 100%, transparent 60%, white 62%, transparent 70%)",
              backgroundSize: "8cqw 100%",
            }}
          />
        ))}
      </>
    ),
  },
};

/**
 * 🔦 Letter hunt: a big picture scene with about 8 things; "what starts with מ?" The child taps things;
 * each tap says the thing's name (and shows it in a bubble, so it works before the audio exists).
 * 2–3 things start with the letter. A wrong tap only wobbles; after two misses one thing glows. 3 scenes.
 */
export function HuntGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [rounds] = useState(() => buildHuntRounds(stationId));
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);
  const [bubble, setBubble] = useState<{ id: string; ok: boolean; n: number } | null>(null);
  const [done, setDone] = useState(false);
  const [end, setEnd] = useState(false);
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
    if (!end) return;
    sparkleSound();
    cheer("party");
    let t: ReturnType<typeof setTimeout>;
    say(line("champ", child.gender)).then(() => {
      t = setTimeout(() => alive.current && finish.current(), 1500);
    });
    return () => clearTimeout(t);
  }, [end, child.gender]);

  // The word bubble fades after a moment.
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble((b) => (b?.n === bubble.n ? null : b)), 1800);
    return () => clearTimeout(t);
  }, [bubble]);

  const round = rounds[idx];
  if (!round) return null;
  const letter = LETTER_BY_ID[round.target];
  const targets = round.objects.filter((o) => o.letter === round.target);
  const glowing = misses >= 2 ? targets.find((o) => !found.includes(o.id))?.id : undefined;

  const tap = async (obj: SceneObject) => {
    if (done || found.includes(obj.id)) return;
    setBubble((b) => ({ id: obj.id, ok: obj.letter === round.target, n: (b?.n ?? 0) + 1 }));
    if (obj.letter !== round.target) {
      wrongSound();
      cheer("oops");
      setMisses((m) => m + 1);
      setShaking(obj.id);
      setTimeout(() => alive.current && setShaking(null), 420);
      say(huntWordId(obj));
      return;
    }
    const next = [...found, obj.id];
    setFound(next);
    popSound();
    rightSound();
    cheer("happy");
    if (next.length < targets.length) {
      say(huntWordId(obj));
      return;
    }
    // The whole scene is found.
    setDone(true);
    recordGameAnswer(child.id, round.target, misses === 0 ? "firstTry" : "withHelp", misses);
    await say(huntWordId(obj), line("champ", child.gender));
    await new Promise((r) => setTimeout(r, 600));
    if (!alive.current) return;
    if (idx + 1 >= rounds.length) return setEnd(true);
    setIdx(idx + 1);
    setFound([]);
    setMisses(0);
    setBubble(null);
    setDone(false);
  };

  if (end) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <span className="anim-dance inline-block text-9xl" aria-hidden>
          🏆
        </span>
        <div className="flex flex-wrap justify-center gap-4 px-4">
          {rounds.map((r, i) => (
            <span
              key={r.key}
              className="anim-sticker flex flex-col items-center rounded-3xl bg-white px-4 py-2 shadow-md"
              style={{ animationDelay: `${i * 250}ms` }}
            >
              <span className="text-5xl font-extrabold text-accent-2">{LETTER_BY_ID[r.target].char}</span>
              <span className="text-3xl" aria-hidden>
                {r.objects
                  .filter((o) => o.letter === r.target)
                  .map((o) => o.emoji)
                  .join("")}
              </span>
            </span>
          ))}
        </div>
        <Confetti count={60} />
      </div>
    );
  }

  const backdrop = BACKDROPS[round.scene];
  return (
    <div className="flex flex-1 flex-col gap-3 py-3" data-game="hunt" data-target={round.target}>
      <Guide compact lines={["starts-prompt", `letter-${round.target}`]} intro={["hunt-intro"]} cue={idx} />

      <div className="flex items-center justify-center gap-3">
        <span className="rounded-2xl bg-white px-5 py-0.5 text-6xl font-extrabold text-accent-2 shadow">{letter.char}</span>
        <span className="flex gap-1 text-3xl" aria-label={`${found.length} מתוך ${targets.length}`}>
          {targets.map((t, i) => (
            <span key={t.id} className={i < found.length ? "anim-sticker" : "opacity-50 grayscale"}>
              {i < found.length ? "⭐" : "🔍"}
            </span>
          ))}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-2 sm:px-4">
        <div
          key={round.key}
          className="anim-rise @container relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[2rem] border-4 border-white shadow-xl"
          style={backdrop.style}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {backdrop.layers}
          </div>
          {round.objects.map((obj, i) => {
            const isFound = found.includes(obj.id);
            const showBubble = bubble?.id === obj.id;
            return (
              <button
                key={obj.id}
                onClick={() => tap(obj)}
                aria-label={obj.word}
                data-letter={obj.letter}
                className={`absolute flex h-[15cqw] w-[15cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${
                  isFound ? "bg-white/90 ring-4 ring-green-400" : ""
                } ${glowing === obj.id ? "anim-glow bg-white/60 ring-4 ring-yellow-400" : ""}`}
                style={{ left: `${obj.x}%`, top: `${obj.y}%`, touchAction: "manipulation" }}
              >
                <span
                  className={`inline-block text-[10cqw] leading-none drop-shadow-md ${
                    shaking === obj.id ? "anim-shake" : isFound ? "anim-jump" : ""
                  }`}
                  aria-hidden
                >
                  {obj.emoji}
                </span>
                {isFound && (
                  <span className="anim-sticker absolute -top-[1cqw] -right-[1cqw] flex h-[5cqw] w-[5cqw] items-center justify-center rounded-full bg-green-500 text-[3cqw] font-extrabold text-white">
                    ✓
                  </span>
                )}
                {showBubble && (
                  <span
                    className={`nikud absolute z-10 rounded-2xl px-[2cqw] text-[3.6cqw] font-extrabold whitespace-nowrap shadow-md ${
                      bubble.ok ? "bg-green-500 text-white" : "bg-white text-[var(--ink)]"
                    } ${obj.y < 25 ? "top-[14cqw]" : "-top-[7cqw]"} ${
                      obj.x < 20 ? "left-0" : obj.x > 80 ? "right-0" : "left-1/2 -translate-x-1/2"
                    }`}
                  >
                    {obj.word}
                  </span>
                )}
                {idx === 0 && i === round.objects.indexOf(targets[0]) && found.length === 0 && misses === 0 && !bubble && (
                  <PointHand className="-bottom-6 -left-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
