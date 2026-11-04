// Builds rounds for the letter games from what the child has already met.
// Rule from the brief: practice uses only material already taught.

import { shuffle } from "../lib/random.ts";
import { KAMATZ_STATIONS, SYLLABLE_BY_ID, syllablesUpTo } from "./kamatz.ts";
import { CONFUSABLE, LETTER_BY_ID, LETTER_STATIONS, lettersUpTo, soundsAlike } from "./letters.ts";

/** Known letters that look like `id` (only ones the child has met). */
function lookalikes(id: string, known: string[]): string[] {
  return CONFUSABLE.filter((g) => g.includes(id))
    .flat()
    .filter((x) => x !== id && known.includes(x));
}

/** 3 picture options for "what starts with target?": never a sound-alike letter's picture (ט/ת, כּ/ק, א/ע). */
function pictureOptions(target: string, pool: string[]): string[] {
  const others = pool.filter((x) => x !== target && !soundsAlike(x, target));
  return shuffle([target, ...shuffle(others).slice(0, 2)]);
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
    options: pictureOptions(target, pool),
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
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  if (station.mix) return buildMixQuizItems(station.letterIds);
  const find = buildFindItems(stationId);
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
        options: pictureOptions(target, nonFinal),
      };
    }
    return { kind: "find" as const, target, options: shuffle([target, ...distractors(target, reached, 2)]) };
  });
}

/**
 * A mixed station's quiz: 10 letters at random from everything learned so far. 7 by name (with lookalike
 * distractors from the whole range) and 3 picture questions (non-final letters, so no picture is ambiguous).
 */
export function buildMixQuizItems(letterIds: string[], n = 10): QuizItem[] {
  const nonFinal = letterIds.filter((id) => !LETTER_BY_ID[id].final);
  const picks = shuffle(letterIds).slice(0, n);
  const pictureTargets = new Set(shuffle(picks.filter((id) => !LETTER_BY_ID[id].final)).slice(0, 3));
  return picks.map((target) =>
    pictureTargets.has(target)
      ? { kind: "starts" as const, target, options: pictureOptions(target, nonFinal) }
      : { kind: "find" as const, target, options: shuffle([target, ...distractors(target, letterIds, 2)]) },
  );
}

/**
 * Up to `n` targets for a game: the station's letters first (a mix station: a random handful of everything),
 * then review letters from earlier stations, then repeats when the child knows only a few letters so far.
 */
function gameTargets(stationId: string, n: number): string[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const known = lettersUpTo(stationId);
  const own = shuffle(station.letterIds).slice(0, n);
  const earlier = shuffle(known.filter((x) => !own.includes(x)));
  const out = [...own, ...earlier].slice(0, n);
  for (let i = 0; out.length < n; i++) out.push(out[i]);
  return out;
}

/** 3 pictures for "what starts with X?" (or "ends with", for a final letter: then only final-letter words). */
export function picturesFor(target: string, known: string[]): string[] {
  const finals = !!LETTER_BY_ID[target].final;
  const pool = known.filter((id) => id !== target && !!LETTER_BY_ID[id].final === finals);
  return shuffle([target, ...shuffle(pool).slice(0, 2)]);
}

/** 3 letters for "which letter does this picture start with?": a lookalike when there is one, same kind (final or not). */
export function lettersFor(target: string, known: string[]): string[] {
  const finals = !!LETTER_BY_ID[target].final;
  return shuffle([target, ...distractors(target, known.filter((id) => !!LETTER_BY_ID[id].final === finals), 2)]);
}

/**
 * 📺 The quiz show: 6 questions, "where is X?" and "what starts with X?" taking turns,
 * never the same letter twice in a row.
 */
export function buildShowItems(stationId: string, n = 6): QuizItem[] {
  const known = lettersUpTo(stationId);
  const targets = gameTargets(stationId, n);
  for (let i = 1; i < targets.length - 1; i++) {
    if (targets[i] === targets[i - 1]) [targets[i], targets[i + 1]] = [targets[i + 1], targets[i]];
  }
  return targets.map((target, i) =>
    i % 2 === 1
      ? { kind: "starts" as const, target, options: picturesFor(target, known) }
      : { kind: "find" as const, target, options: shuffle([target, ...distractors(target, known, 2)]) },
  );
}

/** 🎡 The wheel's slices (up to 8): the station's letters, topped up to at least 6 so the wheel looks full. */
export function buildWheelSlices(stationId: string): string[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const own = Math.min(8, Math.max(6, station.letterIds.length));
  const letters = [...new Set(gameTargets(stationId, own))];
  // Only a few letters known (the first station): each one twice, alternating, for 8 slices.
  return letters.length < 6 ? [...letters, ...letters] : letters;
}

/** 🎁 The boxes: 6 letters hidden as pictures; the child names the first (or last) letter. */
export function buildBoxItems(stationId: string, n = 6) {
  const known = lettersUpTo(stationId);
  return shuffle(gameTargets(stationId, n)).map((target, i) => ({
    key: `box-${i}`,
    target,
    options: lettersFor(target, known),
  }));
}
