"use client";

import { useEffect, useState } from "react";
import { boingSound } from "@/lib/audio";
import { onBuddy, type BuddyMood } from "@/lib/buddy";
import type { Child } from "@/lib/store";
import { BuddyAvatar } from "./BuddyAvatar";

const ANIM: Record<BuddyMood, string> = {
  happy: "anim-jump",
  oops: "anim-tilt",
  party: "anim-dance",
  giggle: "anim-wiggle",
};
const BUBBLE: Partial<Record<BuddyMood, string>> = { happy: "💛", party: "🎉", oops: "🤔", giggle: "😄" };

/** The buddy in the corner of every screen: it cheers, wonders, dances, and giggles when tapped. Never talks. */
export function Buddy({ child }: { child: Child }) {
  const [mood, setMood] = useState<{ m: BuddyMood; n: number } | null>(null);
  useEffect(() => onBuddy((m) => setMood((p) => ({ m, n: (p?.n ?? 0) + 1 }))), []);
  useEffect(() => {
    if (!mood) return;
    const t = setTimeout(() => setMood(null), mood.m === "party" ? 2800 : 900);
    return () => clearTimeout(t);
  }, [mood]);
  if (!child.buddy) return null;

  return (
    <button
      onClick={() => {
        boingSound();
        setMood((p) => ({ m: "giggle", n: (p?.n ?? 0) + 1 }));
      }}
      aria-label="החבר שלי"
      className="fixed bottom-3 left-3 z-30 flex h-20 w-20 items-end justify-center sm:bottom-5 sm:left-5 sm:h-24 sm:w-24"
    >
      <span key={mood?.n} className={`inline-block origin-bottom ${mood ? ANIM[mood.m] : "anim-bob"}`}>
        <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={64} />
      </span>
      {mood && BUBBLE[mood.m] && (
        <span key={`b${mood.n}`} className="anim-fly absolute -top-2 right-0 text-2xl">
          {BUBBLE[mood.m]}
        </span>
      )}
    </button>
  );
}
