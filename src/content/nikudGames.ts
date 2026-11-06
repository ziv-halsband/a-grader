// Rounds for the nikud worlds' games, from what the child has met so far (only material already taught).

import { shuffle } from "../lib/random.ts";
import {
  NIKUD_SYLLABLE_BY_ID,
  NIKUD_SYLLABLES,
  NIKUD_WORLDS,
  NIKUD_WORLD_BY_ID,
  nikudStation,
  syllablesUpTo,
} from "./nikud.ts";

/** Avoid the same target twice in a row. */
function spread(targets: string[]): string[] {
  const t = [...targets];
  for (let i = 1; i < t.length; i++) {
    if (t[i] === t[i - 1] && i + 1 < t.length) [t[i], t[i + 1]] = [t[i + 1], t[i]];
  }
  return t;
}

/**
 * The same letter with a vowel from an earlier world ("בָּ" next to "בֵּ"): the real reading check, the letter
 * alone doesn't give the answer. Only syllables of worlds before this one (the child met them).
 */
function sameLetterEarlier(id: string): string | undefined {
  const s = NIKUD_SYLLABLE_BY_ID[id];
  if (s.pre) return undefined;
  const order = NIKUD_WORLDS.map((w) => w.id);
  const before = NIKUD_SYLLABLES.filter(
    (x) => x.letterId === s.letterId && !x.pre && order.indexOf(x.worldId) < order.indexOf(s.worldId),
  );
  return shuffle(before)[0]?.id;
}

export type SyllableItem = {
  target: string;
  options: string[];
  /** Which of its world's marks each option is shown with (two marks, one sound: both are practiced). */
  marks: Record<string, string>;
};

/** A mark for each syllable: its own, or (when the world has two) one of the two at random. */
function marksFor(ids: string[]): Record<string, string> {
  return Object.fromEntries(
    ids.map((id) => {
      const s = NIKUD_SYLLABLE_BY_ID[id];
      const marks = NIKUD_WORLD_BY_ID[s.worldId].marks;
      // Holam without a vav only on the letter we teach it with (אֹ); kubutz/shuruk and the rest mix freely.
      const pool = s.worldId === "holam" ? [s.mark] : marks.map((m) => m.id);
      return [id, pool[Math.floor(Math.random() * pool.length)]];
    }),
  );
}

/**
 * 👂 "Where is בֵּ?": every syllable of the station + 2 reviews, 3 options. From the second world on, one wrong
 * option is often the same letter with an older vowel (בָּ for בֵּ).
 */
export function buildFindItems(worldId: string, stationId: string): SyllableItem[] {
  const station = nikudStation(worldId, stationId)!;
  const known = syllablesUpTo(worldId, stationId);
  const earlier = known.filter((x) => !station.itemIds.includes(x));
  const targets = spread([...shuffle(station.itemIds), ...shuffle(earlier.length ? earlier : station.itemIds).slice(0, 2)]);
  return targets.map((target) => {
    const tricky = Math.random() < 0.7 ? sameLetterEarlier(target) : undefined;
    const rest = shuffle(known.filter((x) => x !== target && NIKUD_SYLLABLE_BY_ID[x].letterId !== NIKUD_SYLLABLE_BY_ID[target].letterId));
    const options = shuffle([target, ...(tricky ? [tricky] : []), ...rest].slice(0, 3));
    return { target, options, marks: marksFor(options) };
  });
}

/** 🖼️ "Which word starts like בֵּ?": every syllable of the station, 3 pictures of known syllables. */
export function buildStartsItems(worldId: string, stationId: string): { target: string; options: string[] }[] {
  const station = nikudStation(worldId, stationId)!;
  const known = syllablesUpTo(worldId, stationId);
  return shuffle(station.itemIds).map((target) => {
    const t = NIKUD_SYLLABLE_BY_ID[target];
    // Not two pictures starting with the same letter (or the same pre-syllable in the shva world).
    const others = shuffle(known.filter((x) => x !== target)).filter((x) => {
      const o = NIKUD_SYLLABLE_BY_ID[x];
      return o.letterId !== t.letterId && (o.pre ?? "") + o.base !== (t.pre ?? "") + t.base;
    });
    return { target, options: shuffle([target, ...others.slice(0, 2)]) };
  });
}

/** 🔍 Read alone: every word once, 3 pictures. */
export function buildReadItems(wordIds: string[]): { target: string; options: string[] }[] {
  return shuffle(wordIds).map((target) => ({
    target,
    options: shuffle([target, ...shuffle(wordIds.filter((x) => x !== target)).slice(0, 2)]),
  }));
}
