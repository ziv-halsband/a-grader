import { shownSyllable, type NikudSyllable } from "@/content/nikud";

/**
 * A syllable with its vowel in the world's color. A combining mark can't be colored on its own, so two layers
 * are stacked: the whole syllable in the accent color, and the bare letter in ink on top of it.
 * `pop`: the colored layer pops into place (the vowel "jumps" under the letter).
 */
export function Glyph({
  s,
  mark = s.mark,
  showMark = true,
  pop = false,
  className = "",
}: {
  s: Pick<NikudSyllable, "pre" | "base" | "mark">;
  mark?: string;
  showMark?: boolean;
  pop?: boolean;
  className?: string;
}) {
  const full = shownSyllable(s as NikudSyllable, mark);
  return (
    <span className={`nikud inline-grid leading-none ${className}`} aria-hidden>
      <span
        key={`${mark}-${pop}`}
        className={`col-start-1 row-start-1 text-accent transition-opacity duration-300 ${showMark ? "opacity-100" : "opacity-0"} ${
          pop && showMark ? "anim-mark-in" : ""
        }`}
      >
        {full}
      </span>
      <span className="col-start-1 row-start-1">{(s.pre ?? "") + s.base}</span>
    </span>
  );
}

/** A mark on its own, the way teachers write it on the board: on a dotted circle (or the vav that carries it). */
export function markAlone(sign: string): string {
  return sign.startsWith("ו") ? sign : `◌${sign}`;
}
