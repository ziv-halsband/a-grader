"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { GUIDE_NAME } from "@/content/worlds";
import { VOICE_BY_ID } from "@/content/voice";
import { dynamicText, sayStepped, stopAudio } from "@/lib/audio";

/**
 * Mom, the guide. Placeholder portrait for now: later this becomes her photo,
 * or a short avatar video clip per line (HeyGen, driven by her approved audio).
 *
 * Speaks `lines` when they change; the 🔊 button repeats them.
 */
/** Lines already said this session (for `once`). */
const spokenOnce = new Set<string>();

export function Guide({
  lines,
  compact = false,
  cue = 0,
  once = false,
  intro = [],
  onStep,
  unseen = [],
}: {
  lines: string[];
  compact?: boolean;
  /** Change it to speak the same lines again (e.g. the same letter twice in a row). */
  cue?: number;
  /** Intros and greetings: spoken only the first time this session (the caption and 🔊 stay). */
  once?: boolean;
  /** Said before `lines` only the first time this session (e.g. "new letters!" then the letter). */
  intro?: string[];
  /** Called with each line's id as it starts, then null when done (e.g. to light up what is being said). */
  onStep?: (id: string | null) => void;
  /** Lines said but not written in the caption (shown as 👂): a by-ear question must not show the word. */
  unseen?: string[];
}) {
  const [talking, setTalking] = useState(false);
  const key = `${cue}#${lines.join("|")}`;
  const introKey = intro.join("|");
  const step = useEffectEvent((id: string | null) => onStep?.(id));
  const speak = useEffectEvent((ids: string[]) =>
    sayStepped(ids, (i) => step(ids[i])).then((all) => {
      if (all) step(null);
    }),
  );

  useEffect(() => {
    let alive = true;
    let ids = key.split("#")[1].split("|").filter(Boolean);
    const introIds = introKey.split("|").filter(Boolean);
    if (introIds.length && !spokenOnce.has(`intro#${introKey}`)) {
      spokenOnce.add(`intro#${introKey}`);
      ids = [...introIds, ...ids];
    }
    if (!ids.length) return;
    if (once) {
      if (spokenOnce.has(key)) return;
      spokenOnce.add(key);
    }
    const started = performance.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects an external audio process
    setTalking(true);
    speak(ids).then(() => alive && setTalking(false));
    return () => {
      alive = false;
      stopAudio();
      // Cut off right away (a remount, a fast tap away): it wasn't really heard, so say it next time.
      if (performance.now() - started < 600) {
        if (once) spokenOnce.delete(key);
        if (introIds.length) spokenOnce.delete(`intro#${introKey}`);
      }
    };
  }, [key, once, introKey]);

  const replay = () => {
    setTalking(true);
    sayStepped(lines, (i) => onStep?.(lines[i])).then((all) => {
      if (all) onStep?.(null);
      setTalking(false);
    });
  };

  const caption = lines
    .map((id) => (unseen.includes(id) ? "👂" : (VOICE_BY_ID[id]?.text ?? dynamicText(id) ?? "")))
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex w-full max-w-2xl items-end gap-3 px-4">
      <button
        onClick={replay}
        aria-label={`${GUIDE_NAME}: לשמוע שוב`}
        className={`btn-3d relative flex shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-amber-100 to-amber-300 ${
          compact ? "h-16 w-16 text-4xl" : "h-24 w-24 text-6xl"
        } ${talking ? "anim-talk" : ""}`}
      >
        <span aria-hidden>👩‍🏫</span>
        <span
          className={`absolute -bottom-1 -left-1 flex items-center justify-center rounded-full bg-white shadow ${
            compact ? "h-7 w-7 text-sm" : "h-9 w-9 text-xl"
          }`}
        >
          🔊
        </span>
      </button>
      {caption && (
        <p
          className={`nikud relative mb-2 rounded-3xl rounded-br-md bg-white/95 px-4 py-2 font-medium shadow-md ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
