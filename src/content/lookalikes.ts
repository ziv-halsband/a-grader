// 🔍 The lookalike detective: two letters that look alike, side by side. A magnifying glass shows the one place
// where they differ (ד's corner sticking out, ה's gap, ב's foot…), then the child picks the one the guide names.
// DRAFT: which "telling difference" to point at is our guess from the print shapes; mom should check each pair.
//
// The lens point is in the same 100×100 box as the writing strokes (content/writing.ts), so the glass sits
// exactly on the letter we draw.

import { shuffle } from "../lib/random.ts";
import { CONFUSABLE, LETTER_STATIONS, lettersUpTo } from "./letters.ts";

export type LensSpot = { x: number; y: number };

/** Where to hold the glass for each pair (same spot on both letters, so the child compares like with like). */
const SPOTS: Record<string, LensSpot> = {
  "bet|kaf": { x: 80, y: 78 }, // ב has a foot sticking out; כ is round
  "dalet|resh": { x: 70, y: 22 }, // ד has a corner sticking out; ר is round
  "dalet|kaf-sofit": { x: 72, y: 88 }, // ך goes down, under the line
  "kaf-sofit|resh": { x: 76, y: 88 },
  "he|het": { x: 30, y: 36 }, // ה has a gap; ח is closed
  "he|tav": { x: 31, y: 36 }, // ה has a gap; ת's leg is joined
  "het|tav": { x: 28, y: 78 }, // ת has a little foot
  "vav|zayin": { x: 48, y: 22 }, // ז wears a hat on both sides
  "nun-sofit|vav": { x: 56, y: 88 }, // ן goes down, under the line
  "nun-sofit|zayin": { x: 54, y: 88 },
  "gimel|nun": { x: 46, y: 76 }, // ג has a little leg; נ sits flat
  "mem-sofit|samekh": { x: 26, y: 76 }, // ם has square corners; ס is round
  "ayin|tsadi": { x: 72, y: 52 }, // ע's arm goes all the way down; צ's is short
  "mem|tet": { x: 44, y: 22 }, // מ has a roof; ט is open at the top
};

const key = (a: string, b: string) => [a, b].sort().join("|");

export function lensSpot(a: string, b: string): LensSpot {
  return SPOTS[key(a, b)] ?? { x: 50, y: 50 };
}

/** Every lookalike pair whose both letters the child has met by this station. */
export function lookalikePairs(stationId: string): [string, string][] {
  const known = lettersUpTo(stationId);
  const out: [string, string][] = [];
  for (const g of CONFUSABLE) {
    for (let i = 0; i < g.length; i++)
      for (let j = i + 1; j < g.length; j++) if (known.includes(g[i]) && known.includes(g[j])) out.push([g[i], g[j]]);
  }
  return out;
}

export type DetectiveRound = { key: string; pair: [string, string]; target: string };

/**
 * 6 rounds: pairs with this station's new letters first (they are the ones just learned), then older pairs.
 * Each pair is asked both ways when there are few pairs, never the same question twice in a row.
 */
export function buildDetectiveRounds(stationId: string, n = 6): DetectiveRound[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const pairs = lookalikePairs(stationId);
  if (!pairs.length) return [];
  const isNew = (p: [string, string]) => p.some((id) => station.letterIds.includes(id));
  const ordered = [...shuffle(pairs.filter(isNew)), ...shuffle(pairs.filter((p) => !isNew(p)))];
  const first = ordered.map(() => (Math.random() < 0.5 ? 0 : 1));
  const rounds: DetectiveRound[] = [];
  for (let i = 0; rounds.length < n; i++) {
    const p = ordered[i % ordered.length];
    // Second time around a pair: ask for the other letter.
    const lap = Math.floor(i / ordered.length);
    const target = p[(first[i % ordered.length] + lap) % 2];
    rounds.push({ key: `d${i}`, pair: shuffle([...p]) as [string, string], target });
  }
  // The same letter asked twice in a row (ה/ת then ח/ת): swap in a later round.
  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i].target !== rounds[i - 1].target) continue;
    const j = rounds.findIndex((r, k) => k > i && r.target !== rounds[i].target && r.target !== rounds[i + 1]?.target);
    if (j > 0) [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
  }
  return rounds;
}
