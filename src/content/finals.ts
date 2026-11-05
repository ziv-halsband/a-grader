// 🛏️ The finals' pajamas. DRAFT story for mom to check:
//   "At the end of a word the letter gets sleepy, so it puts on its pajamas (the final form) and goes to bed.
//    In the morning, at the start of a word, it takes them off again."
// Each round shows a word (with its picture) missing one letter, and two forms of that letter: the everyday
// form and the pajamas (final) form. The child taps the one that belongs there.
// Words reuse the letters world's example words, so their audio already exists.

import { shuffle } from "../lib/random.ts";
import { LETTER_BY_ID, LETTER_STATIONS } from "./letters.ts";

/** Each final letter and its everyday form. */
export const FINAL_PAIRS: { final: string; regular: string }[] = [
  { final: "kaf-sofit", regular: "kaf" },
  { final: "mem-sofit", regular: "mem" },
  { final: "nun-sofit", regular: "nun" },
  { final: "pe-sofit", regular: "pe" },
  { final: "tsadi-sofit", regular: "tsadi" },
];

/** Stations that show the game: from the finals station on. */
export function hasPajamas(stationId: string): boolean {
  const i = LETTER_STATIONS.findIndex((s) => s.id === stationId);
  const s7 = LETTER_STATIONS.findIndex((s) => s.id === "s7");
  return i >= s7 && s7 >= 0;
}

/** Splits a word with nikud into letters, each with its marks (so "מֶלֶךְ" → מֶ · לֶ · ךְ). */
export function letterClusters(word: string): string[] {
  const out: string[] = [];
  for (const ch of word) {
    // Hebrew points and cantillation (U+0591–U+05C7) belong to the letter before them.
    if (/[֑-ׇ]/.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

export type PajamaRound = {
  key: string;
  /** "end": the word misses its last letter (night); "start": its first letter (morning). */
  where: "end" | "start";
  /** The letter id that belongs in the gap (its example word is the round's word). */
  target: string;
  /** Both forms, shuffled: [regular, final] in some order. */
  options: string[];
  /** The word split into letters; `gap` is the missing one's index. */
  parts: string[];
  gap: number;
};

/**
 * 6 rounds: 4 "end of the word" (nights) and 2 "start of the word" (mornings), mixed, covering all 5 letters.
 * The night rounds come first and last, so the game opens and closes with the pajamas.
 */
export function buildPajamaRounds(): PajamaRound[] {
  const pairs = shuffle(FINAL_PAIRS);
  const nights = pairs.slice(0, 4);
  // Mornings: the 5th letter, plus one more (never the one right before it).
  const mornings = [pairs[4], pairs[1]];
  const plan: { where: "end" | "start"; p: (typeof FINAL_PAIRS)[number] }[] = [
    { where: "end", p: nights[0] },
    { where: "start", p: mornings[0] },
    { where: "end", p: nights[1] },
    { where: "end", p: nights[2] },
    { where: "start", p: mornings[1] },
    { where: "end", p: nights[3] },
  ];
  return plan.map(({ where, p }, i) => {
    const target = where === "end" ? p.final : p.regular;
    const parts = letterClusters(LETTER_BY_ID[target].word);
    return {
      key: `pj${i}`,
      where,
      target,
      options: shuffle([p.regular, p.final]),
      parts,
      gap: where === "end" ? parts.length - 1 : 0,
    };
  });
}
