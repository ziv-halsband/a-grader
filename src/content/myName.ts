// ✍️ Write my name: turns the child's nickname (as a parent typed it) into the letters to write.
// - Nikud and other marks are dropped (we write bare letters, like a name on a kindergarten drawing).
// - The last letter of each word takes its final form (מרימ → מרים), and a final form typed mid-word
//   goes back to the regular one (a typing slip), so the child always writes the name the right way.
// - Spaces split words; anything that isn't a Hebrew letter (׳ in ג׳וני, a hyphen, Latin letters) is skipped.
// - No Hebrew letters at all (e.g. "Noa"): no name to write, the tile stays hidden.

import { LETTERS } from "./letters.ts";

const ID_BY_CHAR = Object.fromEntries(LETTERS.map((l) => [l.char, l.id])) as Record<string, string>;
const TO_FINAL: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
const FROM_FINAL = Object.fromEntries(Object.entries(TO_FINAL).map(([a, b]) => [b, a])) as Record<string, string>;

export type NameLetter = { char: string; letterId: string };

/** The name's words, each a list of letters to write. Empty when there is nothing Hebrew to write. */
export function nameWords(nickname: string): NameLetter[][] {
  const bare = nickname.replace(/[֑-ׇ]/g, "");
  return bare
    .split(/[\s\-_.]+/)
    .map((w) => [...w].filter((c) => c in ID_BY_CHAR))
    .filter((w) => w.length)
    .map((w) =>
      w.map((c, i) => {
        const last = i === w.length - 1;
        // A single-letter "word" stays as typed; otherwise the last letter is final, the others regular.
        const char = w.length > 1 && last ? (TO_FINAL[c] ?? c) : !last ? (FROM_FINAL[c] ?? c) : c;
        return { char, letterId: ID_BY_CHAR[char] };
      }),
    );
}

/** The name as it will be written (finals fixed, no nikud), words joined by a space: "מרים", "דניאל". */
export function nameText(nickname: string): string {
  return nameWords(nickname)
    .map((w) => w.map((l) => l.char).join(""))
    .join(" ");
}

/** A name too long to write in one sitting gets no tile (a whole sentence typed as a nickname). */
export const NAME_MAX_LETTERS = 12;

export function canWriteName(nickname: string): boolean {
  const n = nameWords(nickname).flat().length;
  return n > 0 && n <= NAME_MAX_LETTERS;
}
