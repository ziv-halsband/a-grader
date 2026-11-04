import { KAMATZ, PATACH } from "@/content/kamatz";

/**
 * A syllable with its vowel mark in the accent color. Combining marks can't be colored on their own,
 * so two layers are stacked: the whole syllable in accent, and the bare letter in ink on top of it.
 */
export function Syllable({
  base,
  mark,
  showMark = true,
  className = "",
}: {
  base: string;
  mark: "kamatz" | "patach";
  showMark?: boolean;
  className?: string;
}) {
  return (
    <span className={`nikud inline-grid leading-none ${className}`} aria-hidden>
      <span
        className={`col-start-1 row-start-1 text-accent transition-opacity duration-500 ${showMark ? "opacity-100" : "opacity-0"}`}
      >
        {base + (mark === "kamatz" ? KAMATZ : PATACH)}
      </span>
      <span className="col-start-1 row-start-1">{base}</span>
    </span>
  );
}
