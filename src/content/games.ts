// Builds rounds for the letter games from what the child has already met.
// Rule from the brief: practice uses only material already taught.

import { shuffle } from "../lib/random.ts";
import { KAMATZ_STATIONS, SYLLABLE_BY_ID, syllablesUpTo } from "./kamatz.ts";
import { CONFUSABLE, LETTER_BY_ID, LETTER_STATIONS, lettersUpTo } from "./letters.ts";

/** Known letters that look like `id` (only ones the child has met). */
function lookalikes(id: string, known: string[]): string[] {
  return CONFUSABLE.filter((g) => g.includes(id))
    .flat()
    .filter((x) => x !== id && known.includes(x));
}

/** Picks `n` distractors: one lookalike if there is one, the rest at random. */
function distractors(target: string, known: string[], n: number): string[] {
  const tricky = shuffle(lookalikes(target, known)).slice(0, 1);
  const rest = shuffle(known.filter((x) => x !== target && !tricky.includes(x)));
  return [...tricky, ...rest].slice(0, n);
}

export type FindItem = { target: string; options: string[] };

/**
 * "Where is the letter X?" with 3 choices. Every new letter of the station once,
 * plus 2 review items: from earlier stations when there are any (spaced review), otherwise from this one.
 */
export function buildFindItems(stationId: string): FindItem[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const known = lettersUpTo(stationId);
  const earlier = known.filter((x) => !station.letterIds.includes(x));
  const review = shuffle(earlier.length ? earlier : station.letterIds).slice(0, 2);
  const targets = [...shuffle(station.letterIds), ...review];
  // Avoid the same target twice in a row.
  for (let i = 1; i < targets.length; i++) {
    if (targets[i] === targets[i - 1] && i + 1 < targets.length) {
      [targets[i], targets[i + 1]] = [targets[i + 1], targets[i]];
    }
  }
  return targets.map((target) => ({
    target,
    options: shuffle([target, ...distractors(target, known, 2)]),
  }));
}

export type Bubble = { key: string; letterId: string; isTarget: boolean };
export type BubbleRound = { target: string; bubbles: Bubble[] };

/** Two rounds of "pop every bubble of letter X": 3 targets among 6 others. */
export function buildBubbleRounds(stationId: string): BubbleRound[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const known = lettersUpTo(stationId);
  return shuffle(station.letterIds)
    .slice(0, 2)
    .map((target, r) => {
      const base = distractors(target, known, 6);
      // Few letters known so far: cycle through the distractors to fill the board.
      const others = Array.from({ length: 6 }, (_, i) => base[i % base.length]);
      const letters = [target, target, target, ...others];
      return {
        target,
        bubbles: shuffle(letters).map((letterId, i) => ({
          key: `${r}-${i}`,
          letterId,
          isTarget: letterId === target,
        })),
      };
    });
}

export type StartsItem = { target: string; options: string[] };

/**
 * "Which word starts with the letter X?" The options are pictures (the letters' example words),
 * so the child links the letter to its sound at the start of a word, not only to its name.
 * Final letters ask "which word ENDS with…", using only final-letter words so no option is ambiguous.
 */
export function buildStartsItems(stationId: string): StartsItem[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const finals = station.letterIds.every((id) => LETTER_BY_ID[id].final);
  const pool = lettersUpTo(stationId).filter((id) => !!LETTER_BY_ID[id].final === finals);
  return shuffle(station.letterIds).map((target) => ({
    target,
    options: shuffle([target, ...shuffle(pool.filter((x) => x !== target)).slice(0, 2)]),
  }));
}

/** "Where is בָּ?": every syllable of the station + 2 review, 3 options from syllables already learned. */
export function buildSyllableItems(stationId: string) {
  const station = KAMATZ_STATIONS.find((s) => s.id === stationId)!;
  const known = syllablesUpTo(stationId);
  const earlier = known.filter((x) => !station.itemIds.includes(x));
  const targets = [...shuffle(station.itemIds), ...shuffle(earlier.length ? earlier : station.itemIds).slice(0, 2)];
  return targets.map((target) => ({
    target,
    options: shuffle([target, ...distractors(target, known, 2)]),
    // Each option is shown with kamatz or patach at random: both say "a".
    marks: Object.fromEntries(known.map((id) => [id, Math.random() < 0.5 ? "kamatz" : "patach"])) as Record<
      string,
      "kamatz" | "patach"
    >,
  }));
}

/** "Which word starts like בָּ?": pictures whose first syllable is a known syllable. */
export function buildSyllableStartsItems(stationId: string) {
  const station = KAMATZ_STATIONS.find((s) => s.id === stationId)!;
  const known = syllablesUpTo(stationId).filter((id) => SYLLABLE_BY_ID[id].starts);
  return shuffle(station.itemIds.filter((id) => SYLLABLE_BY_ID[id].starts)).map((target) => ({
    target,
    options: shuffle([target, ...shuffle(known.filter((x) => x !== target)).slice(0, 2)]),
  }));
}

/** Read the word, pick its picture: every word once, 3 pictures. */
export function buildReadItems(wordIds: string[]) {
  return shuffle(wordIds).map((target) => ({
    target,
    options: shuffle([target, ...shuffle(wordIds.filter((x) => x !== target)).slice(0, 2)]),
  }));
}

export type QuizItem = { kind: "find" | "starts"; target: string; options: string[] };

/**
 * One mixed quiz per station (Matific-style variety instead of a drill): every new letter once by name
 * ("where is ב?", scored), 2 picture questions ("what starts with ב?"), and 1 review letter from before.
 */
export function buildQuizItems(stationId: string): QuizItem[] {
  const find = buildFindItems(stationId);
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const news = find.filter((f) => station.letterIds.includes(f.target)).map((f) => ({ ...f, kind: "find" as const }));
  const review = find.filter((f) => !station.letterIds.includes(f.target)).slice(0, 1).map((f) => ({ ...f, kind: "find" as const }));
  const starts = buildStartsItems(stationId).slice(0, 2).map((s) => ({ ...s, kind: "starts" as const }));
  // find, find, starts, find, starts, find…, review last.
  const out: QuizItem[] = [];
  news.forEach((f, i) => {
    out.push(f);
    if ((i === 1 || i === 2) && starts.length) out.push(starts.shift()!);
  });
  return [...out, ...starts, ...review];
}

type Stat = { firstTry: number; withHelp: number; misses: number; lastFirstTry: boolean; at?: number };

/**
 * The surprise round (Matific-style adaptive review): 6 quick questions for THIS child.
 * Letters that needed help last time come first, then letters not seen for a while (spaced review),
 * then a little randomness so it never feels the same. Only letters the child has already reached.
 */
export function buildReviewItems(reached: string[], stats: Record<string, Stat>, now: number, n = 6): QuizItem[] {
  const day = 86_400_000;
  const weight = (id: string) => {
    const s = stats[id];
    if (!s) return 2 + Math.random();
    const struggled = s.lastFirstTry ? 0 : 3;
    const stale = Math.min(3, s.at ? (now - s.at) / day : 2);
    return struggled + Math.min(3, s.misses) * 0.5 + stale + Math.random() * 1.5;
  };
  const picks = [...reached].sort((a, b) => weight(b) - weight(a)).slice(0, n);
  const nonFinal = reached.filter((id) => !LETTER_BY_ID[id].final);
  return shuffle(picks).map((target, i) => {
    // Every third question is a picture question, when there are enough pictures to choose from.
    const pictures = !LETTER_BY_ID[target].final && nonFinal.length >= 3 && i % 3 === 2;
    if (pictures) {
      return {
        kind: "starts" as const,
        target,
        options: shuffle([target, ...shuffle(nonFinal.filter((x) => x !== target)).slice(0, 2)]),
      };
    }
    return { kind: "find" as const, target, options: shuffle([target, ...distractors(target, reached, 2)]) };
  });
}
