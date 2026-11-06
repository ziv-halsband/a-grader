"use client";

// Pieces both readers share: the 📚 short stories (/play/stories) and the 📗 library books (/play/i-read).

import Link from "next/link";
import { useEffect, useState } from "react";
import { BuddyAvatar } from "./BuddyAvatar";
import { Confetti } from "./Confetti";
import { Guide } from "./Guide";
import { PointHand } from "./PointHand";
import { line, PRAISE } from "@/content/voice";
import { rightSound, say, sparkleSound, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { pick as pickOne, shuffle } from "@/lib/random";
import type { Child } from "@/lib/store";

export type BookColors = { spine: string; cover: string };

/** Splits an emoji scene into its emoji (so each one can pop in on its own). */
export function emojis(s: string): string[] {
  try {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((g) => g.segment);
  } catch {
    return [s];
  }
}

/** The closed book: a big cover picture and the title. Tap to open. */
export function BookCover({
  title,
  cover,
  colors,
  hand,
  onOpen,
  badge,
}: {
  title: string;
  cover: string;
  colors: BookColors;
  hand: boolean;
  onOpen: () => void;
  /** A small label on the cover (the library's stage: "שָׁלָב א׳"). */
  badge?: string;
}) {
  return (
    <button
      onClick={onOpen}
      aria-label="לפתוח את הספר"
      className="btn-3d anim-rise relative mt-4 flex w-full max-w-md flex-col items-center gap-4 px-6 pt-8 pb-8"
      style={{ borderInlineStart: `22px solid ${colors.spine}`, background: `linear-gradient(160deg, white 0%, ${colors.cover} 100%)` }}
    >
      {badge && (
        <span className="nikud absolute top-3 left-4 rounded-full px-3 py-0.5 text-base font-extrabold text-white shadow" style={{ background: colors.spine }}>
          {badge}
        </span>
      )}
      <span className="anim-bob text-[9rem] leading-none drop-shadow-lg" aria-hidden>
        {cover}
      </span>
      <span className="nikud text-center text-5xl font-extrabold" style={{ lineHeight: 1.5 }}>
        {title}
      </span>
      <span className="mt-2 flex h-16 w-24 items-center justify-center rounded-3xl bg-accent text-4xl font-extrabold text-white shadow" aria-hidden>
        📖
      </span>
      {hand && <PointHand className="-bottom-4 left-1/3" />}
    </button>
  );
}

export function PageDots({ n, at }: { n: number; at: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`h-3.5 rounded-full transition-all ${i === at ? "w-8 bg-accent" : i < at ? "w-3.5 bg-accent/50" : "w-3.5 bg-white"}`} />
      ))}
    </div>
  );
}

/** ← next page (big) and → back (small), with the page dots between. The last page's ← goes to the question. */
export function PageNav({ at, n, onGo, hand }: { at: number; n: number; onGo: (to: number) => void; hand: boolean }) {
  return (
    <div className="mt-5 flex w-full max-w-3xl items-center justify-between gap-3">
      <button
        onClick={() => onGo(at - 1)}
        aria-label="לעמוד הקודם"
        className="btn-3d flex h-16 w-16 items-center justify-center bg-white text-3xl font-extrabold"
      >
        →
      </button>
      <PageDots n={n} at={at} />
      <button
        onClick={() => onGo(at + 1)}
        aria-label={at === n - 1 ? "לשאלה" : "לעמוד הבא"}
        className="btn-3d relative flex h-20 w-24 items-center justify-center bg-accent text-4xl font-extrabold text-white"
      >
        ←{hand && <PointHand className="-bottom-8 -left-1" />}
      </button>
    </div>
  );
}

/**
 * 3 picture (or face) answers; the first of `options` is right (shuffled on screen).
 * A wrong tap just wobbles; the right one cheers and calls `onRight(firstTry)`.
 */
export function PicAnswers({ options, child, onRight }: { options: string[]; child: Child; onRight: (firstTry: boolean) => void }) {
  const right = options[0];
  const [order] = useState(() => shuffle(options));
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<{ o: string; n: number } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (o: string) => {
    if (picked) return;
    if (o === right) {
      setPicked(o);
      rightSound();
      cheer("happy");
      const p = pickOne(PRAISE);
      say(p === "champ" ? line("champ", child.gender) : p);
      onRight(misses === 0);
      return;
    }
    wrongSound();
    cheer("oops");
    setMisses((m) => m + 1);
    setWrong((w) => ({ o, n: (w?.n ?? 0) + 1 }));
  };

  return (
    <div className="grid w-full grid-cols-3 gap-3 sm:gap-5" role="group" aria-label="תשובות">
      {order.map((o) => (
        <button
          key={`${o}-${wrong?.o === o ? wrong.n : 0}`}
          onClick={() => pick(o)}
          data-answer={o === right ? "right" : "wrong"}
          className={`btn-3d flex aspect-square items-center justify-center bg-white text-[clamp(3rem,10vw,5.5rem)] leading-none ${
            wrong?.o === o ? "anim-shake" : ""
          } ${picked === o ? "anim-word ring-8 ring-green-400" : ""} ${picked && picked !== o ? "opacity-40" : ""}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** The end: confetti, the book's sticker (⭐ if every answer was right on the first try), the buddy dancing, "next book". */
export function BookDone({
  title,
  cover,
  child,
  star,
  firstRead,
  doneLine,
  next,
  shelfHref,
  onAgain,
}: {
  title: string;
  cover: string;
  child: Child;
  star: boolean;
  firstRead: boolean;
  doneLine: string;
  next?: { href: string; title: string; cover: string };
  shelfHref: string;
  onAgain: () => void;
}) {
  useEffect(() => {
    sparkleSound();
    const t = setTimeout(() => cheer("party"), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 pt-2">
      <Confetti count={firstRead ? 70 : 40} />
      <Guide compact lines={[line(doneLine, child.gender)]} />
      <div className="flex items-end gap-6">
        <div className="anim-fly relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[6rem] shadow-2xl">
          {cover}
          <span
            className={`absolute -top-1 -left-1 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-3xl font-extrabold text-white shadow ${
              star ? "bg-amber-400" : "bg-green-500"
            }`}
            aria-label={star ? "כוכב" : "קראת"}
          >
            {star ? "⭐" : "✓"}
          </span>
        </div>
        {child.buddy && (
          <span className="anim-dance-loop inline-block origin-bottom">
            <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={100} />
          </span>
        )}
      </div>
      <p className="nikud text-3xl font-extrabold">{title}</p>

      <div className="mt-4 flex w-full flex-col gap-3">
        {next && (
          <Link
            href={next.href}
            className="btn-3d nikud anim-glow relative flex items-center justify-center gap-3 bg-accent px-5 py-4 text-2xl font-extrabold text-white"
          >
            <span className="text-4xl" aria-hidden>
              {next.cover}
            </span>
            {next.title} ←
            <PointHand className="-bottom-7 left-6" />
          </Link>
        )}
        <div className="flex gap-3">
          <button onClick={onAgain} className="btn-3d nikud flex-1 bg-white px-5 py-4 text-xl font-bold">
            🔁 עוֹד פַּעַם
          </button>
          <Link href={shelfHref} className="btn-3d nikud flex-1 bg-white px-5 py-4 text-center text-xl font-bold">
            📚 לַמַּדָּף
          </Link>
        </div>
      </div>
    </div>
  );
}
