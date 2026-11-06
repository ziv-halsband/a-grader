"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { LETTER_BY_ID } from "@/content/letters";
import { PRAISE, line } from "@/content/voice";
import {
  scoreFreehand,
  smoothPath,
  softenInk,
  strokesFor,
  toPoints,
  type FreehandScore,
  type Pt,
} from "@/content/writing";
import type { Gender } from "@/content/worlds";
import { hasAudio, popSound, rightSound, say, sparkleSound, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { pick } from "@/lib/random";

type Mode = "watch" | "trace" | "alone" | "free" | "done";
/** The writing rounds; a writer can do only some of them (✍️ write my name: watch → trace → free). */
export type WriteRound = Exclude<Mode, "done">;
const ALL_ROUNDS: WriteRound[] = ["watch", "trace", "alone", "free"];
const ROUNDS = [
  ["watch", "👀"],
  ["trace", "✏️"],
  ["alone", "✍️"],
  ["free", "🖍️"],
] as const;
const ORDER: Mode[] = ["watch", "trace", "alone", "free", "done"];

/** How free writing went: passed the check first time, or after a miss / a trip back to tracing. */
export type FreeResult = { result: "firstTry" | "withHelp"; misses: number };

const CRAYONS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#8b5cf6", "#ec4899"];
/** How far (in the 100×100 box) a finger may be from the path and still count. Generous: 5-year-old fingers. */
const NEAR = 16;
/**
 * How far ahead along the path one move may jump. Big enough for a fast finger on an iPad (Safari sends few
 * touch events, so one move can cover a lot of the path; founder, 5 Nov: "we can't win there").
 */
const LOOKAHEAD = 40;
/** Lifting the finger after this much of a stroke counts as finishing it. */
const LIFT_DONE = 0.8;
/** Free writing: after this many "not yet"s, offer going back to tracing (and moving on), and check more gently. */
const OFFER_HELP_AFTER = 2;
/** Ink widths in the 100×100 box: a nice marker on a ~26rem board (about 4 mm), not a fat blob. */
const INK_W = 4.1;
const TRACK_W = 11;
/** How long the "not yet" hint stays (ms). */
const HINT_MS = 3400;

/**
 * Writing one letter, four rounds: 👀 watch the pencil write it → ✏️ trace it (green start dot, arrows,
 * numbers) → ✍️ write it alone (only a faint shape) → 🖍️ write it freely (empty notebook lines, real ink).
 * In the first three the ink only grows forward along the right stroke, in the right direction, so a shaky
 * finger still makes a neat letter, but the order and direction are learned. In the last one the ink is the
 * child's own; "סִיַּמְתִּי" checks it against the letter (scoreFreehand). Passed: the neat letter draws itself
 * over the child's (same place, same size, same crayon) and gets a star stamp. Not yet: the letter shows faintly,
 * the part to fix glows, 👆 points where to start. The board is a notebook row (NotebookLines) on paper.
 */
export function LetterWriter({
  letterId,
  gender,
  skipWatch = false,
  rounds = ALL_ROUNDS,
  intro,
  reserve = 0,
  onDone,
}: {
  letterId: string;
  gender: Gender;
  skipWatch?: boolean;
  /** Which rounds to play, in order (default: all four). 👀 can always be asked for again. */
  rounds?: WriteRound[];
  /** Said once before the first instruction (Guide `intro`). */
  intro?: string[];
  /** Room (rem) the page needs above the writer, so the board still fits on a landscape iPad. */
  reserve?: number;
  /**
   * helped = needed the start-dot hint while writing alone.
   * free = how free writing went; null when the child moved on without passing it.
   * ink = the child's own strokes from free writing (empty if there were none).
   */
  onDone: (helped: boolean, free: FreeResult | null, ink: { color: string; pts: Pt[] }[]) => void;
}) {
  const letter = LETTER_BY_ID[letterId];
  const strokes = useMemo(() => strokesFor(letterId), [letterId]);
  const plan = rounds.filter((r) => !(skipWatch && r === "watch"));
  /** The round after this one: the next planned round in the usual order (✏️ → free when there is no ✍️). */
  const nextOf = (m: Mode): Mode =>
    ORDER.slice(ORDER.indexOf(m) + 1).find((x) => x === "done" || (x !== "watch" && rounds.includes(x))) ?? "done";
  const [mode, setMode] = useState<Mode>(plan[0] ?? "free");
  const afterWatch = nextOf("watch");
  const [stroke, setStroke] = useState(0);
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState(CRAYONS[4]);
  const [missedStarts, setMissedStarts] = useState(0);
  const [helped, setHelped] = useState(false);
  const [wobble, setWobble] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  /** Where the pen is, read by pointer handlers between renders (fast moves fire many events per frame). */
  const pos = useRef({ stroke: 0, progress: 0 });
  const moveTo = (s: number, p: number) => {
    pos.current = { stroke: s, progress: p };
    setStroke(s);
    setProgress(p);
  };

  // 🖍️ Free writing: the child's own strokes, the "not yet" hint (which letter points were missed) and the result.
  const [ink, setInk] = useState<{ color: string; pts: Pt[] }[]>([]);
  const [hint, setHint] = useState<FreehandScore | null>(null);
  /** Passed free writing: how the ink sat on the model (for the "polish" moment). */
  const [passed, setPassed] = useState<FreehandScore | null>(null);
  const uid = useId().replace(/:/g, "");
  const [freeMisses, setFreeMisses] = useState(0);
  const [backToTrace, setBackToTrace] = useState(false);
  const [free, setFree] = useState<FreeResult | null>(null);
  /** The free ink would already pass the check (checked each time the finger lifts). */
  const [ready, setReady] = useState(false);
  /** The one finger that writes (a palm or a second finger on the screen is ignored). */
  const pointer = useRef<number | null>(null);

  const reset = (next: Mode) => {
    setMode(next);
    moveTo(0, 0);
    setMissedStarts(0);
    setInk([]);
    setHint(null);
    setPassed(null);
    setReady(false);
    pointer.current = null;
  };

  // The "not yet" hint shows for a moment, then the board is the child's again.
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), HINT_MS);
    return () => clearTimeout(t);
  }, [hint]);

  // 👀 Watch: the pencil writes the letter by itself, then the child's turn.
  useEffect(() => {
    if (mode !== "watch") return;
    let raf = 0;
    let s = 0;
    let p = 0;
    let last = performance.now();
    let pause = 0;
    let done: ReturnType<typeof setTimeout> | undefined;
    const tick = (now: number) => {
      // rAF's timestamp can be slightly earlier than performance.now() on the first frame.
      const dt = Math.max(0, now - last);
      last = now;
      if (pause > 0) pause -= dt;
      else {
        p += dt * 0.06;
        if (p >= strokes[s].length - 1) {
          p = strokes[s].length - 1;
          if (s + 1 < strokes.length) {
            setStroke(s);
            setProgress(p);
            s++;
            p = 0;
            pause = 350;
          } else {
            setStroke(s);
            setProgress(p);
            done = setTimeout(() => {
              pos.current = { stroke: 0, progress: 0 };
              setStroke(0);
              setProgress(0);
              setMode(afterWatch);
            }, 900);
            return;
          }
        }
      }
      setStroke(s);
      setProgress(Math.floor(p));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [mode, strokes, afterWatch]);

  const toBox = (e: React.PointerEvent): Pt | null => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const advance = (pts: Pt[]) => {
    const { stroke: s, progress: p0 } = pos.current;
    const path = strokes[s];
    let p = p0;
    for (const pt of pts) {
      let best = -1;
      let bestD = NEAR;
      for (let i = p; i <= Math.min(path.length - 1, p + LOOKAHEAD); i++) {
        const d = Math.hypot(path[i].x - pt.x, path[i].y - pt.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best > p) p = best;
    }
    if (p === p0) return;
    if (p >= path.length - 4) return completeStroke();
    moveTo(s, p);
  };

  /** The current stroke is done: next stroke, or the round is done. */
  const completeStroke = () => {
    const { stroke: s } = pos.current;
    drawing.current = false;
    setIsDrawing(false);
    popSound();
    if (s + 1 < strokes.length) {
      moveTo(s + 1, 0);
    } else {
      moveTo(s, strokes[s].length - 1);
      finishRound();
    }
  };

  const finishRound = async () => {
    if (mode === "trace" || mode === "alone") {
      rightSound();
      cheer("happy");
      await new Promise((r) => setTimeout(r, 500));
      reset(nextOf(mode));
    }
  };

  /** ✓ "סִיַּמְתִּי": check the free ink. Pass → the letter fades in under it; not yet → show what was missed. */
  const checkFree = () => {
    if (!ink.length) return;
    const score = scoreFreehand(
      letterId,
      ink.map((s) => s.pts),
      { easier: freeMisses >= OFFER_HELP_AFTER },
    );
    if (score.pass) {
      setFree((f) => f ?? { result: freeMisses || backToTrace ? "withHelp" : "firstTry", misses: freeMisses });
      setHint(null);
      setPassed(score);
      setMode("done");
      sparkleSound();
      cheer("party");
      const pretty = line("write-pretty", gender);
      say(`letter-${letterId}`, hasAudio(pretty) ? pretty : line(pick(PRAISE), gender));
    } else {
      setFreeMisses((n) => n + 1);
      setHint(score);
      wrongSound();
      cheer("oops");
      // A lookalike or a missing tail: "look here!" (the telling part lights up); else "almost, once more".
      const look = line("write-look-here", gender);
      say(score.miss === "lookalike" || score.miss === "below" ? (hasAudio(look) ? look : "write-free-almost") : "write-free-almost");
    }
  };

  const toBoxClamped = (x: number, y: number, m: DOMMatrix): Pt => {
    const p = new DOMPoint(x, y).matrixTransform(m);
    return { x: Math.min(100, Math.max(0, p.x)), y: Math.min(100, Math.max(0, p.y)) };
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === "free") {
      if (pointer.current !== null) return;
      const m = svgRef.current?.getScreenCTM()?.inverse();
      if (!m) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Some pens/emulators don't support capture: drawing still works while over the box.
      }
      pointer.current = e.pointerId;
      setHint(null);
      setInk((k) => [...k, { color, pts: [toBoxClamped(e.clientX, e.clientY, m)] }]);
      return;
    }
    if (mode !== "trace" && mode !== "alone") return;
    // A second finger or a resting palm while writing: ignore it (no "wrong start", no lost stroke).
    if (drawing.current && pointer.current !== null && pointer.current !== e.pointerId) return;
    const pt = toBox(e);
    if (!pt) return;
    const start = strokes[pos.current.stroke][pos.current.progress];
    if (Math.hypot(start.x - pt.x, start.y - pt.y) > NEAR + 6) {
      // Started in the wrong place: show where to start (in "alone" this counts as help).
      setWobble(true);
      wrongSound();
      cheer("oops");
      setTimeout(() => setWobble(false), 450);
      const n = missedStarts + 1;
      setMissedStarts(n);
      if (mode === "alone" && n >= 2) setHelped(true);
      if (n === 1 || n % 3 === 0) say("write-start-here");
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some pens/emulators don't support capture: drawing still works while over the box.
    }
    pointer.current = e.pointerId;
    drawing.current = true;
    setIsDrawing(true);
    advance([pt]);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const isFree = mode === "free" && pointer.current === e.pointerId;
    if (!isFree && !(drawing.current && pointer.current === e.pointerId)) return;
    // Coalesced events give the full finger path on fast moves; the list can be empty on some browsers.
    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const events = coalesced.length ? coalesced : [e.nativeEvent];
    const svg = svgRef.current;
    const m = svg?.getScreenCTM()?.inverse();
    if (!m) return;
    if (isFree) {
      const pts = events.map((ev) => toBoxClamped(ev.clientX, ev.clientY, m));
      setInk((k) => {
        if (!k.length) return k; // cleared mid-stroke
        const cur = [...k[k.length - 1].pts];
        // Skip points closer than ~1 unit: a resting finger trembles, and they add nothing to the line.
        for (const p of pts) {
          const last = cur[cur.length - 1];
          if (Math.hypot(p.x - last.x, p.y - last.y) >= 0.8) cur.push(p);
        }
        return [...k.slice(0, -1), { ...k[k.length - 1], pts: cur }];
      });
      return;
    }
    advance(events.map((ev) => new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m)));
  };

  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    // Another finger or a palm lifting: the writing finger keeps going.
    if (pointer.current !== null && pointer.current !== e.pointerId) return;
    if (mode === "free" && pointer.current !== null && ink.length) {
      setReady(scoreFreehand(letterId, ink.map((s) => s.pts), { easier: freeMisses >= OFFER_HELP_AFTER }).pass);
    }
    pointer.current = null;
    // Lifted near the end of a stroke (a small finger rarely lands on the exact end): count it as done.
    const { stroke: st, progress: pr } = pos.current;
    if (drawing.current && (mode === "trace" || mode === "alone") && pr >= strokes[st].length * LIFT_DONE) {
      completeStroke();
      return;
    }
    drawing.current = false;
    setIsDrawing(false);
  };

  const showHints = mode === "trace" || mode === "watch";
  const showStart = mode === "trace" || (mode === "alone" && (stroke > 0 || progress > 0 || missedStarts >= 2));
  /** Free writing and its result: the child's own ink, no letter track. */
  const freehand = mode === "free" || (mode === "done" && ink.length > 0);
  const offerHelp = mode === "free" && freeMisses >= OFFER_HELP_AFTER;
  const g = gender;
  const guideLines =
    mode === "watch"
      ? ["write-watch", `letter-${letterId}`]
      : mode === "trace"
        ? [`letter-${letterId}`, line("your-turn", g)]
        : mode === "alone"
          ? ["write-alone"]
          : mode === "free"
            ? [line("write-free", g), `letter-${letterId}`]
            : [];

  return (
    <div className="flex flex-1 flex-col items-center gap-3 py-3">
      <Guide compact lines={guideLines} intro={intro} cue={mode === "done" ? 0 : ORDER.indexOf(mode) + 1} />

      <div className="flex items-center gap-2" aria-label="שלבי הכתיבה">
        {ROUNDS.filter(([m]) => rounds.includes(m) || m === mode).map(([m, icon]) => {
          const at = ORDER.indexOf(mode);
          const i = ORDER.indexOf(m);
          return (
            <span
              key={m}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${
                i === at ? "scale-110 bg-white shadow" : i < at ? "bg-white/70" : "bg-white/30 grayscale"
              }`}
            >
              {i < at ? "✅" : icon}
            </span>
          );
        })}
      </div>

      <div
        className={`relative w-full ${wobble ? "anim-shake" : ""}`}
        // Free writing has one more row of buttons (✓) under the crayons.
        style={{ maxWidth: `min(26rem, calc(100dvh - ${(mode === "free" ? 24 : 20) + reserve}rem))` }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="paper-board aspect-square w-full touch-none rounded-[2.5rem] shadow-xl select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onLostPointerCapture={onUp}
          role="img"
          aria-label={`כתיבת האות ${letter.name}`}
        >
          <defs>
            {/* A crayon's waxy grain and a slightly rough edge (the same ink in every round). */}
            <filter id={`crayon-${uid}`} filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.9 1.3" result="g" />
              <feComposite in="d" in2="g" operator="in" />
            </filter>
          </defs>

          <NotebookLines letterId={letterId} />

          {/* The letter's track (free writing has none: only the notebook lines). */}
          {!freehand &&
            strokes.map((pts, i) => (
              <polyline
                key={`track-${i}`}
                data-track=""
                points={toPoints(pts)}
                fill="none"
                stroke={mode === "alone" ? "#eef2f7" : "#e3e9f2"}
                strokeWidth={TRACK_W}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

          {/* Dotted guide + arrows for the strokes still to write. */}
          {showHints &&
            strokes.map((pts, i) =>
              i < stroke ? null : (
                <g key={`hint-${i}`} opacity={i === stroke ? 1 : 0.35}>
                  <polyline
                    points={toPoints(pts)}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                    strokeDasharray="0.1 3.6"
                    strokeLinecap="round"
                  />
                  {arrows(pts).map((a, k) => (
                    <path
                      key={k}
                      d="M -2.2 -1.9 L 2.4 0 L -2.2 1.9 Z"
                      fill="var(--accent)"
                      transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`}
                    />
                  ))}
                </g>
              ),
            )}

          {/* Free ink: the child's own strokes, each in the crayon it was written with (a passed letter fades
              back so its neat version can draw itself on top). */}
          {freehand && (
            <g
              filter={`url(#crayon-${uid})`}
              className="transition-opacity duration-1000"
              opacity={passed ? 0.32 : 1}
            >
              {ink.map((s, i) => (
                <path
                  key={`free-${i}`}
                  d={smoothPath(softenInk(s.pts))}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={INK_W}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </g>
          )}

          {/* ✨ Polish: the same letter, neat, drawn right where (and as big as) the child wrote it. */}
          {mode === "done" && passed && (
            <g filter={`url(#crayon-${uid})`} style={{ pointerEvents: "none" }}>
              {strokes.map((pts, i) => (
                <polyline
                  key={`neat-${i}`}
                  points={toPoints(pts.map((p) => ({ x: (p.x - passed.fit.tx) / passed.fit.sx, y: (p.y - passed.fit.ty) / passed.fit.sy })))}
                  pathLength={1}
                  fill="none"
                  stroke={ink[ink.length - 1]?.color ?? color}
                  strokeWidth={INK_W + 0.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="anim-ink"
                  style={{ animationDelay: `${450 + i * 380}ms` }}
                />
              ))}
            </g>
          )}

          {/* Not yet: the letter faintly over the ink; what to fix (a missed part, a lookalike's telling part)
              glows in the accent color. */}
          {mode === "free" && hint && (
            <g className="anim-fade" style={{ pointerEvents: "none" }}>
              {strokes.flatMap((pts, i) =>
                runs(pts, hint.covered[i]).map((r, k) => (
                  <polyline
                    key={`miss-${i}-${k}`}
                    points={toPoints(r.pts)}
                    fill="none"
                    stroke={r.covered ? "#94a3b8" : "var(--accent)"}
                    strokeOpacity={r.covered ? 0.45 : 0.9}
                    strokeWidth={r.covered ? 2.2 : 4.4}
                    strokeDasharray={r.covered ? "0.1 3" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={r.covered ? "" : "anim-glow-soft"}
                  />
                )),
              )}
            </g>
          )}

          {/* Ink: finished strokes + the current one up to the finger. */}
          {!freehand && (
            <g filter={`url(#crayon-${uid})`}>
              {strokes.map((pts, i) => {
                const upto = i < stroke ? pts.length : i === stroke ? progress + 1 : 0;
                if (upto < 2) return null;
                return (
                  <polyline
                    key={`ink-${i}`}
                    points={toPoints(pts.slice(0, upto))}
                    fill="none"
                    stroke={mode === "done" ? "var(--accent)" : color}
                    strokeWidth={INK_W + 0.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={mode === "done" ? "transition-colors duration-700" : ""}
                  />
                );
              })}
            </g>
          )}

          {/* Start dots with the stroke number. */}
          {showHints &&
            strokes.map((pts, i) =>
              i < stroke || (i === stroke && progress > 0) ? null : (
                <g key={`start-${i}`} transform={`translate(${pts[0].x} ${pts[0].y})`}>
                  <circle
                    r="4.6"
                    fill={i === stroke ? "#22c55e" : "#fb923c"}
                    stroke="white"
                    strokeWidth="0.9"
                    className={i === stroke ? "anim-glow" : ""}
                  />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="5.4" fontWeight="800" fill="white">
                    {i + 1}
                  </text>
                </g>
              ),
            )}
          {mode === "alone" && showStart && progress === 0 && (
            <circle
              cx={strokes[stroke][0].x}
              cy={strokes[stroke][0].y}
              r="3.8"
              fill="#22c55e"
              stroke="white"
              strokeWidth="0.8"
              className="anim-glow"
            />
          )}

          {/* The pencil, at the tip of the ink. */}
          {(mode === "watch" || isDrawing) && strokes[stroke]?.[progress] && (
            <text
              x={strokes[stroke][progress].x + 1.5}
              y={strokes[stroke][progress].y - 1.5}
              fontSize="11"
              aria-hidden
              style={{ pointerEvents: "none" }}
            >
              ✏️
            </text>
          )}
        </svg>
        {mode === "trace" && stroke === 0 && progress === 0 && !isDrawing && (
          <span
            aria-hidden
            className="anim-point pointer-events-none absolute text-5xl drop-shadow-md"
            style={{ left: `${strokes[0][0].x}%`, top: `${strokes[0][0].y + 4}%` }}
          >
            👆
          </span>
        )}
        {/* Not yet: the hand shows where to start again (the first stroke that needs work). */}
        {mode === "free" && hint && (
          <span
            aria-hidden
            className="anim-point pointer-events-none absolute text-5xl drop-shadow-md"
            style={{
              left: `${strokes[hint.hintStroke][0].x}%`,
              top: `${strokes[hint.hintStroke][0].y + 4}%`,
            }}
          >
            👆
          </span>
        )}
        {mode === "done" && (
          <span className="anim-sticker absolute -top-4 -left-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[var(--card)] text-5xl shadow-lg">
            {letter.emoji}
          </span>
        )}
        {/* A teacher's star stamp on a neat letter. */}
        {mode === "done" && passed && (
          <span
            aria-label="כוכב"
            className="anim-stamp absolute bottom-4 left-5 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-dashed border-amber-400 bg-amber-50/90 text-4xl"
            style={{ animationDelay: `${600 + strokes.length * 380}ms` }}
          >
            ⭐
          </span>
        )}
      </div>

      {mode === "done" ? (
        <div className="flex gap-3">
          <button onClick={() => reset("free")} className="btn-3d bg-white px-5 py-3 text-xl font-bold">
            🔁 עוֹד פַּעַם
          </button>
          <button
            onClick={() => onDone(helped, free, ink)}
            className="btn-3d relative bg-accent px-6 py-3 text-xl font-extrabold text-white"
          >
            הָלְאָה ←
            {/* A 5-year-old doesn't read "onward": the hand shows the way. */}
            <PointHand />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 px-2" role="group" aria-label="צבע">
          {CRAYONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label="בחירת צבע"
              className={`h-12 w-8 rounded-t-full rounded-b-md shadow transition ${c === color ? "-translate-y-2 ring-2 ring-white" : ""}`}
              style={{ background: c }}
            />
          ))}
          {mode !== "watch" && (
            <button
              onClick={() => reset(mode)}
              aria-label="למחוק ולהתחיל מחדש"
              className="btn-3d mr-2 flex h-11 w-11 items-center justify-center bg-white text-xl"
            >
              ↺
            </button>
          )}
          {mode !== "watch" && (
            <button
              onClick={() => reset("watch")}
              aria-label="לראות שוב איך כותבים"
              className="btn-3d flex h-11 w-11 items-center justify-center bg-white text-xl"
            >
              👀
            </button>
          )}
        </div>
      )}
      {mode === "free" && (
        <div className="flex items-center gap-3">
          {offerHelp && (
            <button
              onClick={() => {
                setBackToTrace(true);
                reset("trace");
              }}
              aria-label="חזרה למעקב על האות"
              className="btn-3d anim-glow flex h-14 w-14 items-center justify-center bg-white text-2xl"
            >
              ✏️
            </button>
          )}
          <button
            onClick={checkFree}
            disabled={!ink.length}
            className="btn-3d relative bg-accent px-6 py-3 text-xl font-extrabold text-white disabled:opacity-40"
          >
            ✓ סִיַּמְתִּי
            {/* The letter is already good: show where to tap, instead of the child waiting for someone to say so. */}
            {ready && !hint && <PointHand />}
          </button>
          {offerHelp && (
            <button onClick={() => onDone(helped, null, ink)} className="btn-3d bg-white px-4 py-3 text-lg font-bold">
              הָלְאָה ←
            </button>
          )}
        </div>
      )}
      {mode === "done" && <Confetti count={40} />}
    </div>
  );
}

/** A few direction arrows spread along a stroke. */
function arrows(pts: Pt[]) {
  const out: { x: number; y: number; deg: number }[] = [];
  const every = 22;
  for (let i = 12; i < pts.length - 6; i += every) {
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 2)];
    out.push({ x: a.x, y: a.y, deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  }
  if (!out.length && pts.length > 4) {
    const i = Math.floor(pts.length / 2);
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 2)];
    out.push({ x: a.x, y: a.y, deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  }
  return out;
}

/** Splits a stroke into runs of covered / missed points (each run overlaps the next by a point, so no gaps). */
function runs(pts: Pt[], covered: boolean[]) {
  const out: { covered: boolean; pts: Pt[] }[] = [];
  pts.forEach((p, i) => {
    const run = out[out.length - 1];
    if (run && run.covered === covered[i]) run.pts.push(p);
    else {
      if (run) run.pts.push(p);
      out.push({ covered: covered[i], pts: [p] });
    }
  });
  return out;
}

/**
 * A first-grade notebook row: a soft band between the top line and the (stronger) bottom line where the letter
 * sits, a dotted line below for the letters that go down (finals, ק) and above for ל's neck, and a margin on
 * the right like a Hebrew notebook. The model letters are drawn to fit exactly this band (writing.ts).
 */
export function NotebookLines({ letterId }: { letterId: string }) {
  const pts = strokesFor(letterId).flat();
  const down = pts.some((p) => p.y > 85);
  const up = pts.some((p) => p.y < 15);
  return (
    <g aria-hidden style={{ pointerEvents: "none" }}>
      <rect x="0" y="22" width="100" height="58" fill="#e6f0fb" opacity="0.6" />
      <line x1="90" x2="90" y1="0" y2="100" stroke="#f9a8a8" strokeWidth="0.45" />
      <line x1="0" x2="100" y1="22" y2="22" stroke="#9cbde6" strokeWidth="0.5" />
      <line x1="0" x2="100" y1="80" y2="80" stroke="#5f8fd1" strokeWidth="0.85" />
      <line x1="0" x2="100" y1="96" y2="96" stroke="#9cbde6" strokeWidth="0.5" strokeDasharray="1.2 1.6" opacity={down ? 1 : 0.4} />
      {up && <line x1="0" x2="100" y1="6" y2="6" stroke="#9cbde6" strokeWidth="0.5" strokeDasharray="1.2 1.6" />}
    </g>
  );
}
