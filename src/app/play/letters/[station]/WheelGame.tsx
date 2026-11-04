"use client";

import { useEffect, useRef, useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { letterQuizProps, toChoiceItem } from "@/components/LetterQuiz";
import { PointHand } from "@/components/PointHand";
import { buildWheelSlices, picturesFor } from "@/content/games";
import { LETTER_BY_ID, lettersUpTo } from "@/content/letters";
import { line } from "@/content/voice";
import { boingSound, say, sparkleSound, tickSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { pick } from "@/lib/random";
import type { Child } from "@/lib/store";

const SPINS = 4;
const SPIN_MS = 4200;
const COLORS = ["#fb923c", "#facc15", "#4ade80", "#60a5fa", "#f472b6", "#c084fc", "#2dd4bf", "#f87171"];

/** A point on the wheel's rim: `deg` clockwise from the top. */
const at = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [+(r * Math.sin(a)).toFixed(2), +(-r * Math.cos(a)).toFixed(2)] as const;
};

/**
 * 🎡 Wheel of luck: tap to spin (a tick as each peg passes, slowing down), it lands on a letter,
 * the guide says its name, then "what starts with it?" with 3 pictures (a final letter: "what ends with it?").
 * 4 spins, never the same letter twice. Not scored.
 */
export function WheelGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [slices] = useState(() => buildWheelSlices(stationId));
  const [landed, setLanded] = useState<string[]>([]);
  const [stage, setStage] = useState<"idle" | "spinning" | "landed" | "challenge" | "end">("idle");
  const [slice, setSlice] = useState<number | null>(null);
  const [question, setQuestion] = useState<ReturnType<typeof toChoiceItem> | null>(null);
  /** The wheel's angle at rest (while it spins, each frame sets it directly on the SVG). */
  const [angle, setAngle] = useState(0);
  const wheel = useRef<SVGGElement>(null);
  const frame = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const n = slices.length;
  const seg = 360 / n;

  const land = async (i: number, deg: number) => {
    const id = slices[i];
    setAngle(deg);
    setSlice(i);
    setQuestion(toChoiceItem({ kind: "starts", target: id, options: picturesFor(id, lettersUpTo(stationId)) }));
    setLanded((l) => [...l, id]);
    setStage("landed");
    sparkleSound();
    cheer("happy");
    await say(`letter-${id}`);
    await new Promise((r) => setTimeout(r, 900));
    if (alive.current) setStage("challenge");
  };

  const spin = () => {
    if (stage !== "idle") return;
    boingSound();
    setStage("spinning");
    const fresh = [...new Set(slices)].filter((id) => !landed.includes(id));
    const letter = pick(fresh.length ? fresh : slices);
    const i = pick(slices.map((id, k) => (id === letter ? k : -1)).filter((k) => k >= 0));
    // Turning the wheel by R puts slice i under the pointer when R ≡ -i·seg (mod 360); a little jitter inside the slice.
    const want = (((-i * seg + (Math.random() - 0.5) * seg * 0.5) % 360) + 360) % 360;
    const from = angle;
    const delta = 360 * 4 + ((want - (from % 360) + 360) % 360);
    const start = performance.now();
    let lastPeg = Math.floor((from + seg / 2) / seg);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SPIN_MS);
      const deg = from + delta * (1 - Math.pow(1 - t, 4));
      wheel.current?.setAttribute("transform", `rotate(${deg.toFixed(2)})`);
      const peg = Math.floor((deg + seg / 2) / seg);
      if (peg !== lastPeg) {
        lastPeg = peg;
        tickSound();
      }
      if (t < 1) frame.current = requestAnimationFrame(step);
      else land(i, from + delta);
    };
    frame.current = requestAnimationFrame(step);
  };

  const next = async () => {
    if (landed.length >= SPINS) {
      setStage("end");
      cheer("party");
      await say(line("champ", child.gender));
      await new Promise((r) => setTimeout(r, 1500));
      if (alive.current) onDone();
      return;
    }
    setStage("idle");
  };

  if (stage === "challenge" && question) {
    return <ChoiceGame key={landed.length} items={[question]} progress={false} {...letterQuizProps(child)} onDone={next} />;
  }

  const target = slice === null ? null : slices[slice];
  return (
    <div className="flex flex-1 flex-col items-center gap-4 py-4">
      <Guide compact once lines={["wheel-intro"]} />

      {/* The letters landed so far: 4 places to fill. */}
      <div className="flex gap-2" aria-label={`${landed.length} מתוך ${SPINS}`}>
        {Array.from({ length: SPINS }, (_, k) => (
          <span
            key={k}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-3xl font-extrabold shadow ${
              landed[k] ? "anim-sticker bg-white text-accent-2" : "bg-white/50"
            }`}
          >
            {landed[k] ? LETTER_BY_ID[landed[k]].char : ""}
          </span>
        ))}
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {/* The pointer. */}
        <span aria-hidden className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-5xl text-[var(--ink)] drop-shadow-md">
          ▼
        </span>
        <button
          onClick={spin}
          disabled={stage !== "idle"}
          aria-label="לסובב את הגלגל"
          className="relative aspect-square w-72 touch-manipulation rounded-full sm:w-80"
        >
          <svg viewBox="-110 -110 220 220" className="h-full w-full drop-shadow-xl">
            <circle r="108" fill="#fff" />
            <g ref={wheel} transform={`rotate(${angle})`}>
              {slices.map((id, k) => {
                const a0 = k * seg - seg / 2;
                const a1 = k * seg + seg / 2;
                const [px, py] = at(a0, 100);
                return (
                  <g key={k}>
                    <path
                      d={`M 0 0 L ${at(a0, 100).join(" ")} A 100 100 0 0 1 ${at(a1, 100).join(" ")} Z`}
                      fill={COLORS[k % COLORS.length]}
                      stroke="#fff"
                      strokeWidth="2"
                      opacity={stage === "landed" && slice !== k ? 0.4 : 1}
                    />
                    <text
                      transform={`rotate(${k * seg})`}
                      y="-62"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={n > 6 ? 32 : 38}
                      fontWeight={800}
                      fill="#1e1b4b"
                    >
                      {LETTER_BY_ID[id].char}
                    </text>
                    <circle cx={px} cy={py} r="4" fill="#fff" stroke="#1e1b4b" strokeWidth="1.5" />
                  </g>
                );
              })}
            </g>
            <circle r="22" fill="#fff" stroke="#1e1b4b" strokeWidth="3" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="24">
              ⭐
            </text>
          </svg>
          {stage === "idle" && landed.length === 0 && <PointHand className="bottom-4 left-1/2" />}
        </button>

        {stage === "landed" && target && (
          <span className="anim-sticker absolute top-1/2 flex h-28 w-28 items-center justify-center rounded-[1.75rem] border-[6px] border-white bg-[var(--card)] text-7xl font-extrabold text-accent-2 shadow-2xl">
            {LETTER_BY_ID[target].char}
          </span>
        )}
      </div>

      {/* Stays in the layout while spinning (hidden), so the wheel doesn't jump. */}
      <button
        onClick={spin}
        aria-label="לסובב"
        aria-hidden={stage !== "idle"}
        tabIndex={stage === "idle" ? 0 : -1}
        className={`btn-3d bg-accent px-10 py-3 text-4xl text-white ${stage === "idle" ? "anim-rise" : "invisible"}`}
      >
        🎡
      </button>
      {stage === "end" && <Confetti count={50} />}
    </div>
  );
}
