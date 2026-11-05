// "Does the child know this letter?" and "which letters should come back today?".
// Pure functions (no React, no storage) so the games, the garden and the parents' area share one rule.
//
// DRAFT RULE for mom to check (research items 4–5, docs/07-letters-research.md):
//   a letter "knows" (🌸 blooms) after right answers on the FIRST try
//   on at least 2 different days AND in at least 2 kinds of question.
// One lucky day, or one kind of question repeated, is not enough.

/** Kinds of question a letter can be answered in. Open-ended: new question types just add a name. */
export type AnswerKind =
  | "find" // 🎯 "where is ב?": the letter by its name
  | "starts" // 🖼️ "what starts with ב?": the letter → a picture
  | "hear" // 👂 hear the sound, pick the letter
  | "first-letter" // 🎁 a picture → its first letter
  | "write" // ✍️ writing it alone
  | "game"
  | (string & {});

/** The bits of a letter's stats the rule reads (structurally the same as LetterStat in store.ts). */
export type MasteryStat = {
  firstTry: number;
  withHelp: number;
  misses: number;
  lastFirstTry: boolean;
  at?: number;
  days?: string[];
  kinds?: string[];
};

export type Mastery = "new" | "practicing" | "knows";

export const MASTERY_RULE = { days: 2, kinds: 2 };

/** A local calendar day, "2026-11-05" (the child's own day, not UTC). */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Days with a first-try right answer. Saves from before 5 Nov have no `days`: then the last practice day
 * counts as one, when there was any first-try answer.
 */
export function successDays(stat: MasteryStat | undefined): string[] {
  if (!stat) return [];
  if (stat.days) return stat.days;
  return stat.firstTry > 0 && stat.at ? [dayKey(stat.at)] : [];
}

/** Kinds answered right on the first try. Older saves only scored "where is ב?". */
export function successKinds(stat: MasteryStat | undefined): string[] {
  if (!stat) return [];
  if (stat.kinds) return stat.kinds;
  return stat.firstTry > 0 ? ["find"] : [];
}

export function letterMastery(stat: MasteryStat | undefined): Mastery {
  if (!stat || stat.firstTry + stat.withHelp === 0) return "new";
  const days = successDays(stat).length;
  const kinds = successKinds(stat).length;
  return days >= MASTERY_RULE.days && kinds >= MASTERY_RULE.kinds ? "knows" : "practicing";
}

/** What is still missing before the letter blooms, for the parents' tooltip. */
export function masteryMissing(stat: MasteryStat | undefined): { days: number; kinds: number } {
  return {
    days: Math.max(0, MASTERY_RULE.days - successDays(stat).length),
    kinds: Math.max(0, MASTERY_RULE.kinds - successKinds(stat).length),
  };
}

/** Adds a value to a short set-like list (newest last), keeping at most `max` entries. */
export function addTo(list: string[] | undefined, value: string, max: number): string[] {
  const l = list ?? [];
  return l.includes(value) ? l : [...l, value].slice(-max);
}

const DAY = 86_400_000;
/** Review gaps (days) by how many days the letter was already answered right: ~1, 3, 7. */
export const REVIEW_GAPS = [1, 1, 3, 7];

/**
 * How much a letter should come back in today's 🎲 practice (higher = sooner). In this order:
 *  1. weak letters (needed help or missed last time),
 *  2. letters due: the gap since last practice reached ~1, 3 or 7 days (longer once it went well on more days),
 *  3. letters that already bloomed come back less often.
 * `rand` (0–1) keeps every round a little different.
 */
export function reviewWeight(stat: MasteryStat | undefined, now: number, rand: number): number {
  if (!stat || stat.firstTry + stat.withHelp === 0) return 2 + rand;
  const weak = stat.lastFirstTry ? 0 : 4;
  const gap = REVIEW_GAPS[Math.min(REVIEW_GAPS.length - 1, successDays(stat).length)];
  const since = stat.at ? (now - stat.at) / DAY : gap;
  const due = Math.min(3, (2 * since) / gap);
  const bloomed = letterMastery(stat) === "knows" ? 0.5 : 1;
  return (weak + due) * bloomed + rand;
}

/** The days of this week (Sunday first, as in Israel) that are in `days`. Never a "missed" list. */
export function daysThisWeek(days: string[] | undefined, now: number): string[] {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()).getTime();
  const week = Array.from({ length: 7 }, (_, i) => dayKey(start + i * DAY + DAY / 2));
  return week.filter((k) => days?.includes(k));
}
