"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { buildDetectiveRounds, lensSpot, type LensSpot } from "@/content/lookalikes";
import { LETTER_BY_ID } from "@/content/letters";
import { PRAISE, line } from "@/content/voice";
import { boingSound, rightSound, say, sparkleSound, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { GLYPH, letterDiff, type LetterDiff } from "@/lib/glyphDiff";
import { pick } from "@/lib/random";
import { recordGameAnswer } from "@/lib/recordGame";
import type { Child } from "@/lib/store";

const LENS_R = 20;

/**
 * A letter drawn from the real font (the shapes kids will read: ב's sharp corner and foot, כ's round back).
 * With the glass on: inside a see-through magnifying glass, the letter's own telling part turns orange
 * (lib/glyphDiff.ts). Only inside the glass, so the eye goes to one place.
 */
function MagnifiedLetter({ letterId, spot, overlay, lens }: { letterId: string; spot: LensSpot; overlay?: string; lens: boolean }) {
  const char = LETTER_BY_ID[letterId].char;
  const clip = `lens${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { x, y } = spot;
  // The handle points away from the middle of the letter, so it never covers the letter.
  const dx = x - 50 || 1;
  const dy = y - 50 || 1;
  const d = Math.hypot(dx, dy);
  const ux = dx / d;
  const uy = dy / d;
  return (
    <svg viewBox="0 0 100 100" className="block aspect-square w-full overflow-visible" aria-hidden>
      {/* The writing line: final letters (ך ן) visibly go under it. */}
      <line x1="8" x2="92" y1={GLYPH.baseline} y2={GLYPH.baseline} stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
      <text x={GLYPH.x} y={GLYPH.baseline} fontSize={GLYPH.size} fontWeight={GLYPH.weight} textAnchor="middle" fill="#1e1b4b">
        {char}
      </text>
      {lens && (
        <g className="anim-lens">
          <defs>
            <clipPath id={clip}>
              <circle cx={x} cy={y} r={LENS_R} />
            </clipPath>
          </defs>
          {overlay && <image href={overlay} x="0" y="0" width="100" height="100" clipPath={`url(#${clip})`} />}
          <line
            x1={x + ux * LENS_R}
            y1={y + uy * LENS_R}
            x2={x + ux * (LENS_R + 16)}
            y2={y + uy * (LENS_R + 16)}
            stroke="#78350f"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <circle cx={x} cy={y} r={LENS_R} fill="rgb(254 243 199 / 0.25)" stroke="#b45309" strokeWidth={3.5} />
          <path
            d={`M ${x - LENS_R * 0.55} ${y - LENS_R * 0.3} A ${LENS_R * 0.62} ${LENS_R * 0.62} 0 0 1 ${x - LENS_R * 0.2} ${y - LENS_R * 0.58}`}
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.9}
          />
        </g>
      )}
    </svg>
  );
}

/**
 * 🔍 The lookalike detective: two letters that look alike (ב/כ, ד/ר, ה/ח…) side by side. The child taps the
 * magnifying glass, the glass lands on the one spot where they differ, then the guide names one and the child
 * picks it. 6 rounds, no timer. One wrong tap: the right card glows ("this is ח… your turn").
 * Scored like "where is ב?" (first try = knows), marked as a game answer.
 */
export function DetectiveGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [rounds] = useState(() => buildDetectiveRounds(stationId));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"look" | "ask" | "solved" | "end">("look");
  const [wrong, setWrong] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [nudge, setNudge] = useState(0);
  const [hint, setHint] = useState<string[] | null>(null);
  /** What tells this round's letters apart, measured on the font (the hand-placed spot until then). */
  const [measured, setMeasured] = useState<{ key: string; diffs: Record<string, LetterDiff> } | null>(null);
  const roundKey = rounds[idx]?.key;
  useEffect(() => {
    const r = rounds.find((x) => x.key === roundKey);
    if (!r) return;
    let live = true;
    const [a, b] = r.pair;
    letterDiff(LETTER_BY_ID[a].char, LETTER_BY_ID[b].char, Math.round(LENS_R * 0.7)).then(
      (d) => live && d && setMeasured({ key: r.key, diffs: { [a]: d.a, [b]: d.b } }),
    );
    return () => {
      live = false;
    };
  }, [rounds, roundKey]);
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
    say(line("champ", child.gender)).then(() => {
      t = setTimeout(() => alive.current && finish.current(), 1400);
    });
    return () => clearTimeout(t);
  }, [phase, child.gender]);

  const round = rounds[idx];
  if (!round) return null;
  const fallback = lensSpot(round.pair[0], round.pair[1]);
  const diffOf = (id: string) => (measured?.key === round.key ? measured.diffs[id] : undefined);

  const lookCloser = () => {
    if (phase !== "look") return;
    sparkleSound();
    setPhase("ask");
  };

  const tap = async (id: string) => {
    if (phase === "look") {
      // Not yet: the glass first (it wiggles).
      boingSound();
      setNudge((n) => n + 1);
      return;
    }
    if (phase !== "ask" || id === wrong) return;
    if (id !== round.target) {
      wrongSound();
      cheer("oops");
      setWrong(id);
      setShaking(id);
      setTimeout(() => alive.current && setShaking(null), 420);
      setHint(["this-is", `letter-${id}`, line("your-turn", child.gender)]);
      return;
    }
    setPhase("solved");
    rightSound();
    cheer("happy");
    recordGameAnswer(child.id, round.target, wrong ? "withHelp" : "firstTry", wrong ? 1 : 0);
    await say(`letter-${round.target}`, ...(idx % 2 === 1 ? [line(pick(PRAISE), child.gender)] : []));
    await new Promise((r) => setTimeout(r, 400));
    if (!alive.current) return;
    if (idx + 1 >= rounds.length) return setPhase("end");
    setIdx(idx + 1);
    setPhase("look");
    setWrong(null);
    setHint(null);
  };

  const guideLines =
    phase === "end"
      ? []
      : phase === "look"
      ? idx === 0
        ? [line("det-intro", child.gender)]
        : []
      : (hint ?? ["det-here", "find-prompt", `letter-${round.target}`]);

  return (
    <div className="flex flex-1 flex-col gap-4 py-4" data-game="detective" data-target={phase === "look" ? "" : round.target}>
      <Guide compact once={phase === "look"} lines={guideLines} cue={idx * 10 + (hint ? 1 : 0)} />

      <div className="flex justify-center gap-2" aria-label={`סיבוב ${Math.min(idx + 1, rounds.length)} מתוך ${rounds.length}`}>
        {rounds.map((r, i) => (
          <span
            key={r.key}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
              i < idx || phase === "end" ? "bg-amber-300" : i === idx ? "bg-white ring-2 ring-amber-500" : "bg-white/60"
            }`}
          >
            {i < idx || phase === "end" ? "⭐" : ""}
          </span>
        ))}
      </div>

      {phase === "end" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <span className="anim-dance inline-block text-9xl" aria-hidden>
            🕵️
          </span>
          <span className="anim-sticker text-6xl" aria-hidden>
            🏅
          </span>
          <Confetti count={60} />
        </div>
      ) : (
        <div key={round.key} className="anim-rise flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <div className="flex w-full max-w-xl items-center justify-center gap-4 sm:gap-8">
            {round.pair.map((id) => {
              const isAnswer = id === round.target;
              const faded = wrong === id;
              return (
                <button
                  key={id}
                  onClick={() => tap(id)}
                  disabled={faded}
                  aria-label={`האות ${LETTER_BY_ID[id].name}`}
                  data-letter={id}
                  className={`btn-3d relative aspect-square w-[44%] max-w-60 rounded-[2rem] border-4 bg-white p-[6%] transition-opacity ${
                    faded ? "border-transparent opacity-30" : "border-amber-200"
                  } ${shaking === id ? "anim-shake" : ""} ${wrong && isAnswer && phase === "ask" ? "anim-glow ring-4 ring-yellow-400" : ""} ${
                    phase === "solved" && isAnswer ? "scale-105 bg-green-50 ring-4 ring-green-400" : ""
                  }`}
                >
                  <MagnifiedLetter
                    letterId={id}
                    spot={diffOf(id)?.spot ?? fallback}
                    overlay={diffOf(id)?.overlay}
                    lens={phase !== "look"}
                  />
                </button>
              );
            })}
          </div>

          <button
            key={`glass-${nudge}`}
            onClick={lookCloser}
            disabled={phase !== "look"}
            aria-label="זכוכית מגדלת"
            className={`btn-3d relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-amber-200 to-amber-400 text-6xl transition-opacity sm:h-28 sm:w-28 sm:text-7xl ${
              phase === "look" ? (nudge ? "anim-wiggle" : "anim-glow") : "opacity-40"
            }`}
          >
            <span aria-hidden>🔍</span>
            {phase === "look" && idx === 0 && <PointHand className="-bottom-6 -left-5" />}
          </button>
        </div>
      )}
    </div>
  );
}
