"use client";

import { useEffect, useState } from "react";
import { GUIDE_NAME } from "@/content/worlds";
import { VOICE_BY_ID } from "@/content/voice";
import { say, stopAudio } from "@/lib/audio";

/**
 * Mom, the guide. Placeholder portrait for now: later this becomes her photo,
 * or a short avatar video clip per line (HeyGen, driven by her approved audio).
 *
 * Speaks `lines` when they change; the 🔊 button repeats them.
 */
export function Guide({
  lines,
  compact = false,
  cue = 0,
}: {
  lines: string[];
  compact?: boolean;
  /** Change it to speak the same lines again (e.g. the same letter twice in a row). */
  cue?: number;
}) {
  const [talking, setTalking] = useState(false);
  const key = `${cue}#${lines.join("|")}`;

  useEffect(() => {
    let alive = true;
    const ids = key.split("#")[1].split("|").filter(Boolean);
    if (!ids.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects an external audio process
    setTalking(true);
    say(...ids).then(() => alive && setTalking(false));
    return () => {
      alive = false;
      stopAudio();
    };
  }, [key]);

  const replay = () => {
    setTalking(true);
    say(...lines).then(() => setTalking(false));
  };

  const caption = lines.map((id) => VOICE_BY_ID[id]?.text ?? "").join(" ");

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
