"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { PointHand } from "@/components/PointHand";
import { hasAudio, lockedSound, say, starSound, unlockSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";

export type Step = { id: string; icon: string; label: string };

/** The prize step's id (the 🎁 at the end of the path). */
export const PRIZE = "done";

/**
 * The one 🎁 rule, the same in every world: the prize opens only when every other step was finished in this
 * visit, or when the station was finished before (a replay).
 */
export function prizeLocked(steps: Step[], finished: string[], collectedBefore: boolean): boolean {
  return !collectedBefore && !steps.every((s) => s.id === PRIZE || finished.includes(s.id));
}

/**
 * The station's steps as a path the child can read without words: the step now is big and lit, finished steps
 * are green ✓, the ones ahead are soft. Every finished step drops a ⭐ into the 🎁 at the end (★★☆☆); the 🎁 has a
 * 🔒 until every other step is done. Tapped early: it wiggles, knocks, and the 👆 points at the next step to do.
 * When the last ⭐ lands the lock pops off and the 🎁 bounces, so the child knows to tap it.
 *
 * Between steps (a step was finished and the station moved on): a ⭐ flies to the prize, then a short splash
 * of the next step (icon + name + progress), ~1.3s, tap to skip.
 *
 * "learn" is always open (so the child can go back in the middle of a game), the others once reached.
 */
export function StationSteps({
  steps,
  current,
  reached,
  completed = reached,
  finished,
  locked = [],
  onLocked,
  onPick,
}: {
  steps: Step[];
  current: string;
  /** Index of the furthest step open (all steps up to it can be picked). */
  reached: number;
  /** Steps before this index get a ✓ (defaults to `reached`; differs in practice mode, where all are open). */
  completed?: number;
  /** Step ids actually finished in this visit; when given, only these get a ✓ (and a ⭐ in the prize). */
  finished?: string[];
  /** Steps that stay closed even in practice mode (the prize, until every other step is finished). */
  locked?: string[];
  /** Tapped a locked step (extra; the knock, the line and the 👆 are already done here). */
  onLocked?: () => void;
  onPick: (id: string) => void;
}) {
  const at = steps.findIndex((s) => s.id === current);
  const work = steps.filter((s) => s.id !== PRIZE);
  const isDone = (s: Step) => (finished ? finished.includes(s.id) : steps.indexOf(s) < completed);
  const doneIds = work.filter(isDone).map((s) => s.id);
  const prizeIsLocked = locked.includes(PRIZE);
  // Unlocked without every step done in this visit = collected on an earlier visit (a replay).
  const collected = !prizeIsLocked && doneIds.length < work.length;

  // What changed since the last render (derived during render, not in an effect).
  const [seen, setSeen] = useState({ done: doneIds, current, locked: prizeIsLocked });
  const [flight, setFlight] = useState<{ id: string; n: number } | null>(null);
  const [splash, setSplash] = useState<{ id: string; from: number; to: number; n: number } | null>(null);
  const [popLock, setPopLock] = useState(0);
  const [nudge, setNudge] = useState(0);
  if (seen.done.join() !== doneIds.join() || seen.current !== current || seen.locked !== prizeIsLocked) {
    const added = doneIds.filter((id) => !seen.done.includes(id));
    if (added.length) {
      setFlight({ id: added[added.length - 1], n: (flight?.n ?? 0) + 1 });
      // Moved on to a new step after finishing one: the splash (the prize has its own show).
      if (seen.current !== current && current !== PRIZE)
        setSplash({ id: current, from: seen.done.length, to: doneIds.length, n: (splash?.n ?? 0) + 1 });
    }
    setSeen({ done: doneIds, current, locked: prizeIsLocked });
  }

  // While a ⭐ is flying, it hasn't landed yet: the prize shows one star less and keeps its lock.
  const stars = doneIds.length - (flight ? 1 : 0);
  // The lock stays on until the last ⭐ has landed, then pops off.
  const showLock = prizeIsLocked || (!!flight && !collected && doneIds.length === work.length);
  const ready = !prizeIsLocked && !collected && !flight && current !== PRIZE;

  const nextToDo = work.find((s) => !isDone(s));
  const buttons = useRef(new Map<string, HTMLElement>());
  const starRow = useRef<HTMLSpanElement>(null);

  const landed = () => {
    setFlight(null);
    starSound();
    cheer("happy");
    if (!prizeIsLocked && !collected) {
      setPopLock((p) => p + 1);
      setTimeout(unlockSound, 120);
      if (current !== PRIZE) setTimeout(() => say(hasAudio("prize-ready") ? "prize-ready" : "locked"), 500);
    }
  };

  useEffect(() => {
    if (!nudge) return;
    const t = setTimeout(() => setNudge(0), 2600);
    return () => clearTimeout(t);
  }, [nudge]);

  const tapLocked = () => {
    lockedSound();
    cheer("oops");
    say(hasAudio("more-stars") ? "more-stars" : "locked");
    setNudge((n) => n + 1);
    onLocked?.();
  };

  return (
    <>
      <nav
        aria-label="שלבי התחנה"
        className="relative z-50 mx-auto mt-3 flex w-full max-w-xl items-start justify-center px-3"
      >
        {steps.map((s, i) => {
          const isPrize = s.id === PRIZE;
          const isLocked = locked.includes(s.id);
          const open = !isLocked && (i === 0 || i <= reached);
          const isNow = i === at;
          const done = !isPrize && isDone(s);
          return (
            <div key={s.id} className="flex min-w-0 flex-1 items-start">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`mt-7 h-2 min-w-1 flex-1 rounded-full transition-colors duration-500 sm:mt-8 ${
                    isDone(steps[i - 1]) && steps[i - 1].id !== PRIZE ? "bg-green-500" : "bg-white/60"
                  }`}
                />
              )}
              <div className="relative flex flex-col items-center">
                <button
                  ref={(el) => {
                    if (el) buttons.current.set(s.id, el);
                    else buttons.current.delete(s.id);
                  }}
                  key={isPrize ? `prize-${nudge}` : s.id}
                  onClick={() => (isLocked ? tapLocked() : open && !isNow && onPick(s.id))}
                  disabled={!open && !isLocked}
                  aria-current={isNow ? "step" : undefined}
                  aria-label={
                    isPrize
                      ? `${s.label}${showLock ? " סגור" : ""} ${stars} מתוך ${work.length} כוכבים`
                      : `${s.label}${done ? " ✓" : ""}`
                  }
                  data-step={s.id}
                  data-state={isPrize ? (showLock ? "locked" : collected ? "collected" : "ready") : done ? "done" : isNow ? "now" : "ahead"}
                  className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    isNow
                      ? "h-16 w-16 bg-white text-4xl shadow-[0_0_0_5px_var(--accent),0_8px_20px_rgb(0_0_0/0.2)] sm:h-20 sm:w-20 sm:text-5xl"
                      : done
                        ? "h-14 w-14 bg-green-100 text-3xl shadow-[0_0_0_4px_#22c55e] sm:h-16 sm:w-16"
                        : isPrize && ready
                          ? "anim-prize-ready h-14 w-14 bg-amber-100 text-4xl shadow-[0_0_0_4px_#f59e0b,0_0_24px_#fbbf24] sm:h-16 sm:w-16"
                          : open || isPrize
                            ? "h-14 w-14 bg-white/70 text-3xl shadow sm:h-16 sm:w-16"
                            : "h-14 w-14 bg-white/40 text-3xl opacity-50 grayscale sm:h-16 sm:w-16"
                  } ${isPrize && nudge ? "anim-wiggle" : ""}`}
                >
                  <span aria-hidden className={isPrize && showLock ? "opacity-70" : ""}>
                    {s.icon}
                  </span>
                  {isPrize && showLock && (
                    <span aria-hidden className="absolute -bottom-1 -left-1 text-xl drop-shadow">
                      🔒
                    </span>
                  )}
                  {isPrize && popLock > 0 && !showLock && (
                    <span key={popLock} aria-hidden className="pointer-events-none absolute inset-0">
                      <span className="anim-unlock absolute -bottom-1 -left-1 text-xl">🔓</span>
                      <span className="anim-burst absolute inset-0 flex items-center justify-center text-4xl">✨</span>
                    </span>
                  )}
                  {isPrize && collected && (
                    <span className="absolute -top-1 -left-1 rounded-full bg-green-500 px-1.5 text-xs font-bold text-white">
                      ✓
                    </span>
                  )}
                  {done && (
                    <span
                      aria-hidden
                      className="anim-pop absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-500 text-xs font-extrabold text-white"
                    >
                      ✓
                    </span>
                  )}
                </button>
                {isPrize && !collected ? (
                  <span ref={starRow} aria-hidden className="mt-1.5 flex gap-px text-xs leading-none sm:text-sm">
                    {work.map((w, k) => (
                      <span
                        key={w.id}
                        className={k < stars ? (k === stars - 1 && !flight ? "anim-pop inline-block" : "") : "opacity-30 grayscale"}
                      >
                        ⭐
                      </span>
                    ))}
                  </span>
                ) : (
                  <span
                    className={`nikud mt-1 whitespace-nowrap text-xs leading-tight ${isNow ? "font-extrabold" : "font-bold opacity-80"}`}
                  >
                    {s.label}
                  </span>
                )}
                {nudge > 0 && nextToDo?.id === s.id && <PointHand key={nudge} className="-bottom-10 -left-3" />}
              </div>
            </div>
          );
        })}
      </nav>

      {flight && (
        <FlyingStar
          key={flight.n}
          fromId={flight.id}
          buttons={buttons}
          starRow={starRow}
          onLanded={landed}
        />
      )}
      {splash && (
        <StepSplash
          key={splash.n}
          step={steps.find((s) => s.id === splash.id)!}
          before={splash.from}
          after={splash.to}
          total={work.length}
          onClose={() => setSplash(null)}
        />
      )}
    </>
  );
}

/** A ⭐ that flies from the finished step to the prize's stars (~0.8s). */
function FlyingStar({
  fromId,
  buttons,
  starRow,
  onLanded,
}: {
  fromId: string;
  buttons: RefObject<Map<string, HTMLElement>>;
  starRow: RefObject<HTMLSpanElement | null>;
  onLanded: () => void;
}) {
  const star = useRef<HTMLSpanElement>(null);
  const done = useRef(onLanded);
  useEffect(() => {
    done.current = onLanded;
  });
  useEffect(() => {
    const el = star.current;
    const a = buttons.current.get(fromId)?.getBoundingClientRect();
    const b = (starRow.current ?? buttons.current.get(PRIZE))?.getBoundingClientRect();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done.current();
    };
    if (!el || !a || !b) {
      finish();
      return;
    }
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2;
    const y1 = b.top + b.height / 2;
    el.style.left = `${x0}px`;
    el.style.top = `${y0}px`;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const anim = el.animate?.(
      [
        { transform: "translate(-50%, -50%) scale(0.4) rotate(0deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(2.2) rotate(-40deg)", opacity: 1, offset: 0.3 },
        {
          transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-50% + ${dy * 0.6 + 90}px)) scale(1.6) rotate(120deg)`,
          offset: 0.7,
        },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6) rotate(360deg)`, opacity: 1 },
      ],
      { duration: 900, easing: "ease-in-out", fill: "forwards" },
    );
    // A safety net: the star always lands (no animation support, a hidden tab…).
    const t = setTimeout(finish, 1000);
    if (anim) anim.onfinish = finish;
    return () => clearTimeout(t);
  }, [fromId, buttons, starRow]);
  return (
    <span
      ref={star}
      aria-hidden
      className="pointer-events-none fixed z-[60] text-3xl drop-shadow-[0_0_8px_#fde047]"
      style={{ left: -100, top: -100 }}
    >
      ⭐
    </span>
  );
}

/** The next step, big: its icon, its name and how far along the path we are. Tap anywhere to skip. */
function StepSplash({
  step,
  before,
  after,
  total,
  onClose,
}: {
  step: Step;
  before: number;
  after: number;
  total: number;
  onClose: () => void;
}) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const t = setTimeout(() => close.current(), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={`השלב הבא: ${step.label}`}
      data-splash={step.id}
      className="anim-fade fixed inset-0 z-40 flex items-center justify-center bg-black/25 p-6 backdrop-blur-[2px]"
      style={{ animationDuration: "200ms" }}
    >
      <span className="anim-rise flex w-full max-w-sm flex-col items-center gap-3 rounded-[2.5rem] bg-[var(--card)] px-6 pt-6 pb-7 shadow-2xl">
        <span className="anim-sticker inline-block text-[7rem] leading-none drop-shadow-lg">{step.icon}</span>
        <span className="nikud text-4xl font-extrabold">{step.label}</span>
        {/* Progress: one segment per step, filling as the stars come in, the 🎁 at the end. */}
        <span className="flex w-full items-center gap-2" dir="rtl">
          <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-black/10">
            <span
              className="anim-bar-fill absolute inset-y-0 right-0 rounded-full bg-green-500"
              style={
                {
                  "--from": `${(before / total) * 100}%`,
                  "--to": `${(after / total) * 100}%`,
                } as CSSProperties
              }
            />
            {Array.from({ length: total - 1 }, (_, k) => (
              <span
                key={k}
                className="absolute inset-y-0 w-1 bg-[var(--card)]"
                style={{ right: `calc(${((k + 1) / total) * 100}% - 2px)` }}
              />
            ))}
          </span>
          <span aria-hidden className="text-3xl">
            🎁
          </span>
        </span>
      </span>
    </button>
  );
}
