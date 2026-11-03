// Builds rounds for the letter games from what the child has already met.
// Rule from the brief: practice uses only material already taught.

import { shuffle } from "../lib/random.ts";
import { CONFUSABLE, LETTER_STATIONS, lettersUpTo } from "./letters.ts";

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
