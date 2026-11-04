"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { LETTER_BY_ID } from "@/content/letters";
import { PRAISE, line } from "@/content/voice";
import { strokesFor, toPoints, type Pt } from "@/content/writing";
import type { Gender } from "@/content/worlds";
import { popSound, say } from "@/lib/audio";
import { pick } from "@/lib/random";

type Mode = "watch" | "trace" | "alone" | "done";

const CRAYONS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#8b5cf6", "#ec4899"];
/** How far (in the 100×100 box) a finger may be from the path and still count. Generous: 5-year-old fingers. */
const NEAR = 11;
/** How far ahead along the path one move may jump (stops shortcuts across the letter). */
const LOOKAHEAD = 14;

/**
 * Writing one letter, three rounds: 👀 watch the pencil write it → ✏️ trace it (green start dot, arrows,
 * numbers) → ✍️ write it alone (only a faint shape). The ink only grows forward along the right stroke,
 * in the right direction, so a shaky finger still makes a neat letter, but the order and direction are learned.
 */
export function LetterWriter({
  letterId,
  gender,
  skipWatch = false,
  onDone,
}: {
  letterId: string;
  gender: Gender;
  skipWatch?: boolean;
  /** helped = needed the start-dot hint while writing alone. */
  onDone: (helped: boolean) => void;
}) {
  const letter = LETTER_BY_ID[letterId];
  const strokes = useMemo(() => strokesFor(letterId), [letterId]);
  const [mode, setMode] = useState<Mode>(skipWatch ? "trace" : "watch");
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

  const reset = (next: Mode) => {
    setMode(next);
    moveTo(0, 0);
    setMissedStarts(0);
  };

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
              setMode("trace");
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
  }, [mode, strokes]);

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
    if (p >= path.length - 2) {
      // Stroke finished.
      drawing.current = false;
      setIsDrawing(false);
      popSound();
      if (s + 1 < strokes.length) {
        moveTo(s + 1, 0);
      } else {
        moveTo(s, path.length - 1);
        finishRound();
      }
      return;
    }
    moveTo(s, p);
  };

  const finishRound = async () => {
    if (mode === "trace") {
      await say(line(pick(PRAISE), gender));
      reset("alone");
    } else if (mode === "alone") {
      setMode("done");
      await say(`letter-${letterId}`, line(pick(PRAISE), gender));
    }
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "trace" && mode !== "alone") return;
    const pt = toBox(e);
    if (!pt) return;
    const start = strokes[pos.current.stroke][pos.current.progress];
    if (Math.hypot(start.x - pt.x, start.y - pt.y) > NEAR + 4) {
      // Started in the wrong place: show where to start (in "alone" this counts as help).
      setWobble(true);
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
    drawing.current = true;
    setIsDrawing(true);
    advance([pt]);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    // Coalesced events give the full finger path on fast moves; the list can be empty on some browsers.
    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const events = coalesced.length ? coalesced : [e.nativeEvent];
    const svg = svgRef.current;
    const m = svg?.getScreenCTM()?.inverse();
    if (!m) return;
    advance(events.map((ev) => new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m)));
  };

  const onUp = () => {
    drawing.current = false;
    setIsDrawing(false);
  };

  const showHints = mode === "trace" || mode === "watch";
  const showStart = mode === "trace" || (mode === "alone" && (stroke > 0 || progress > 0 || missedStarts >= 2));
  const g = gender;
  const guideLines =
    mode === "watch"
      ? [line("write-watch", g), `letter-${letterId}`]
      : mode === "trace"
        ? [line("write-trace", g)]
        : mode === "alone"
          ? ["write-alone"]
          : [];

  return (
    <div className="flex flex-1 flex-col items-center gap-3 py-3">
      <Guide compact lines={guideLines} cue={mode === "done" ? 0 : ["watch", "trace", "alone"].indexOf(mode) + 1} />

      <div className="flex items-center gap-2" aria-label="שלבי הכתיבה">
        {(
          [
            ["watch", "👀"],
            ["trace", "✏️"],
            ["alone", "✍️"],
          ] as const
        ).map(([m, icon], i) => {
          const at = ["watch", "trace", "alone", "done"].indexOf(mode);
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

      <div className={`relative w-full max-w-[min(26rem,calc(100dvh-20rem))] ${wobble ? "anim-shake" : ""}`}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="aspect-square w-full touch-none rounded-[2.5rem] bg-white shadow-xl select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="img"
          aria-label={`כתיבת האות ${letter.name}`}
        >
          {/* Writing lines, like a first-grade notebook. */}
          <line x1="6" x2="94" y1="22" y2="22" stroke="#e2e8f0" strokeWidth="0.6" strokeDasharray="2 2" />
          <line x1="6" x2="94" y1="80" y2="80" stroke="#cbd5e1" strokeWidth="0.8" />

          {/* The letter's track. */}
          {strokes.map((pts, i) => (
            <polyline
              key={`track-${i}`}
              points={toPoints(pts)}
              fill="none"
              stroke={mode === "alone" ? "#f1f5f9" : "#e9eef5"}
              strokeWidth="13"
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
                    strokeWidth="1.4"
                    strokeDasharray="0.1 4"
                    strokeLinecap="round"
                  />
                  {arrows(pts).map((a, k) => (
                    <path
                      key={k}
                      d="M -2.6 -2.2 L 2.6 0 L -2.6 2.2 Z"
                      fill="var(--accent)"
                      transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`}
                    />
                  ))}
                </g>
              ),
            )}

          {/* Ink: finished strokes + the current one up to the finger. */}
          {strokes.map((pts, i) => {
            const upto = i < stroke ? pts.length : i === stroke ? progress + 1 : 0;
            if (upto < 2) return null;
            return (
              <polyline
                key={`ink-${i}`}
                points={toPoints(pts.slice(0, upto))}
                fill="none"
                stroke={mode === "done" ? "var(--accent)" : color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={mode === "done" ? "transition-colors duration-700" : ""}
              />
            );
          })}

          {/* Start dots with the stroke number. */}
          {showHints &&
            strokes.map((pts, i) =>
              i < stroke || (i === stroke && progress > 0) ? null : (
                <g key={`start-${i}`} transform={`translate(${pts[0].x} ${pts[0].y})`}>
                  <circle r="5.5" fill={i === stroke ? "#22c55e" : "#fb923c"} className={i === stroke ? "anim-glow" : ""} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="6.5" fontWeight="800" fill="white">
                    {i + 1}
                  </text>
                </g>
              ),
            )}
          {mode === "alone" && showStart && progress === 0 && (
            <circle cx={strokes[stroke][0].x} cy={strokes[stroke][0].y} r="4.5" fill="#22c55e" className="anim-glow" />
          )}

          {/* The pencil, at the tip of the ink. */}
          {(mode === "watch" || isDrawing) && strokes[stroke]?.[progress] && (
            <text
              x={strokes[stroke][progress].x + 2}
              y={strokes[stroke][progress].y - 2}
              fontSize="12"
              aria-hidden
              style={{ pointerEvents: "none" }}
            >
              ✏️
            </text>
          )}
        </svg>
        {mode === "done" && (
          <span className="anim-sticker absolute -top-4 -left-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[var(--card)] text-5xl shadow-lg">
            {letter.emoji}
          </span>
        )}
      </div>

      {mode === "done" ? (
        <div className="flex gap-3">
          <button onClick={() => reset("alone")} className="btn-3d bg-white px-5 py-3 text-xl font-bold">
            🔁 עוֹד פַּעַם
          </button>
          <button onClick={() => onDone(helped)} className="btn-3d bg-accent px-6 py-3 text-xl font-extrabold text-white">
            הָלְאָה ←
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2" role="group" aria-label="צבע">
          {CRAYONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label="בחירת צבע"
              className={`h-12 w-7 rounded-t-full rounded-b-md shadow transition ${c === color ? "-translate-y-2 ring-2 ring-white" : ""}`}
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
