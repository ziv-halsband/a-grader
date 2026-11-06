// 📄 Printable worksheets (for parents): every sheet is generated from our own content (letters, nikud, stories).
// DRAFT (mom): which sheets exist, the wording, the lookalikes used as distractors, the picture words, the color
// pictures and the sentences are all drafts for mom to check. See docs/10-worksheets-research.md.
//
// Pure and deterministic: the same source + seed always gives the same sheets (the preview is what prints).

import { CONFUSABLE, LETTER_BY_ID, LETTER_STATIONS, LETTERS, soundsAlike, type Letter } from "./letters.ts";
import {
  decodable,
  NIKUD_SYLLABLE_BY_ID,
  NIKUD_WORD_BY_ID,
  NIKUD_WORLD_BY_ID,
  NIKUD_WORLDS,
  readWord,
  shownSyllable,
  type NikudSyllable,
  type NikudWord,
} from "./nikud.ts";
import { STORIES } from "./stories.ts";

// ---------------------------------------------------------------- what a sheet is made from

/** Letters (a station, or letters picked by hand), or a nikud world (optionally one of its stations). */
export type WsSource =
  | { kind: "letters"; stationId?: string; letterIds: string[] }
  | { kind: "nikud"; worldId: string; stationId?: string };

export type WsType = "write" | "find" | "match" | "color" | "nikud" | "read" | "cut";

export const WS_TYPES: { id: WsType; emoji: string; title: string; about: string; for: WsSource["kind"][] }[] = [
  { id: "write", emoji: "✍️", title: "כתיבת אות", about: "דוגמה עם סדר הקווים, שורות להעתקה ושורות לכתיבה לבד", for: ["letters"] },
  { id: "find", emoji: "🔎", title: "מוצאים ומקיפים", about: "להקיף את האות (או ההברה) בין אותיות דומות", for: ["letters", "nikud"] },
  { id: "match", emoji: "🖼️", title: "תמונה ואות", about: "לחבר בקו כל תמונה לאות שהיא מתחילה בה", for: ["letters"] },
  { id: "nikud", emoji: "🔊", title: "הברות ותמונות", about: "לחבר הברה לתמונה, ולכתוב את הניקוד החסר", for: ["nikud"] },
  { id: "color", emoji: "🎨", title: "צובעים לפי אות", about: "ציור משבצות: כל אות בצבע שלה", for: ["letters", "nikud"] },
  { id: "read", emoji: "📖", title: "קוראים ומציירים", about: "משפט קצר שאפשר לקרוא, ומסגרת לצייר אותו", for: ["nikud"] },
  { id: "cut", emoji: "✂️", title: "גוזרים ומדביקים", about: "לגזור אותיות או הברות ולבנות מילה מתחת לתמונה", for: ["letters", "nikud"] },
];

// ---------------------------------------------------------------- the sheets (data only; components draw them)

export type MatchRow = { pic: string; word: string };
/** Find-and-circle: one or two boxes, each with its targets (one sound, maybe two spellings) and a grid. */
export type FindBox = { targets: string[]; cells: string[]; cols: number };
export type ColorKey = { token: string; color: string; name: string };
/** "Write the missing vowel": the word cut around the letter that lost its vowel. */
export type MissingVowel = {
  pic: string;
  before: string;
  /** The letter without its vowel (dagesh / shin dot kept), or "" when the vowel is a whole vav (וֹ, וּ). */
  letter: string;
  /** Where the child writes: under the letter, above it (holam), or a box for a vav. */
  place: "under" | "above" | "vav";
  after: string;
  answer: string;
};
export type CutWord = { pic: string; word: string; tiles: string[]; showModel: boolean };

export type Sheet =
  | { type: "write"; key: string; letterId: string }
  | { type: "find"; key: string; unit: "letter" | "syllable"; boxes: FindBox[] }
  | { type: "match"; key: string; rows: MatchRow[]; tokens: string[] }
  | { type: "nikud"; key: string; rows: MatchRow[]; tokens: string[]; missing: MissingVowel[]; bank: string[] }
  | { type: "color"; key: string; unit: "letter" | "syllable"; pattern: string[]; slots: string; keys: ColorKey[]; pic: string }
  | { type: "read"; key: string; sentences: string[] }
  | { type: "cut"; key: string; unit: "letter" | "syllable"; words: CutWord[]; tiles: string[] };

// ---------------------------------------------------------------- seeded random (same seed, same sheet)

function rng(seed: string): () => number {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(arr: readonly T[], r: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const uniq = <T,>(a: T[]) => [...new Set(a)];

// ---------------------------------------------------------------- sources

export function sourceKey(s: WsSource): string {
  return s.kind === "letters"
    ? s.stationId
      ? `letters:${s.stationId}`
      : `letter:${s.letterIds.join(",")}`
    : `nikud:${s.worldId}${s.stationId ? `:${s.stationId}` : ""}`;
}

/** "letters:s1" · "letter:bet,kaf" · "nikud:hiriq" · "nikud:hiriq:i2". Unknown → null. */
export function parseSource(v: string | null | undefined): WsSource | null {
  if (!v) return null;
  const [kind, a, b] = v.split(":");
  if (kind === "letters") {
    const st = LETTER_STATIONS.find((s) => s.id === a);
    return st ? { kind: "letters", stationId: st.id, letterIds: st.letterIds } : null;
  }
  if (kind === "letter") {
    const ids = (a ?? "").split(",").filter((id) => LETTER_BY_ID[id]);
    return ids.length ? { kind: "letters", letterIds: ids } : null;
  }
  if (kind === "nikud" && NIKUD_WORLD_BY_ID[a]) {
    const st = b && NIKUD_WORLD_BY_ID[a].stations.find((s) => s.id === b && s.kind === "syllables");
    return { kind: "nikud", worldId: a, ...(st && { stationId: st.id }) };
  }
  return null;
}

/** A short title for the source, for the picker and the preview. */
export function sourceTitle(s: WsSource): string {
  if (s.kind === "letters") {
    const st = s.stationId && LETTER_STATIONS.find((x) => x.id === s.stationId);
    if (st) return st.mix ? st.title : `האותיות ${st.title}`;
    return s.letterIds.map((id) => LETTER_BY_ID[id].char).join(" ");
  }
  const w = NIKUD_WORLD_BY_ID[s.worldId];
  const st = s.stationId && w.stations.find((x) => x.id === s.stationId);
  return st ? `${w.title}: ${st.itemIds.map((id) => shownSyllable(NIKUD_SYLLABLE_BY_ID[id])).join(" ")}` : w.mapTitle;
}

/** The child's current station (the first one not done: letters first, then the nikud worlds in order). */
export function currentSource(done: string[]): WsSource {
  const st = LETTER_STATIONS.find((s) => !done.includes(`letters/${s.id}`));
  if (st) return { kind: "letters", stationId: st.id, letterIds: st.letterIds };
  for (const w of NIKUD_WORLDS) {
    const s = w.stations.find((x) => !done.includes(`${w.id}/${x.id}`));
    if (s) return { kind: "nikud", worldId: w.id, ...(s.kind === "syllables" && { stationId: s.id }) };
  }
  return { kind: "nikud", worldId: NIKUD_WORLDS[NIKUD_WORLDS.length - 1].id };
}

/** The first station of a world the child hasn't finished (for the 📄 tile on a nikud world's map). */
export function currentNikudSource(worldId: string, done: string[]): WsSource {
  const w = NIKUD_WORLD_BY_ID[worldId];
  const s = w.stations.find((x) => x.kind === "syllables" && !done.includes(`${worldId}/${x.id}`));
  return { kind: "nikud", worldId, ...(s && { stationId: s.id }) };
}

export function typesFor(s: WsSource): WsType[] {
  return WS_TYPES.filter((t) => t.for.includes(s.kind)).map((t) => t.id);
}

function letters(s: Extract<WsSource, { kind: "letters" }>): Letter[] {
  return s.letterIds.map((id) => LETTER_BY_ID[id]);
}

/** The syllables a nikud source practices: its station, or every syllable station of the world. */
function syllables(s: Extract<WsSource, { kind: "nikud" }>): NikudSyllable[] {
  const w = NIKUD_WORLD_BY_ID[s.worldId];
  const ids = w.stations.filter((st) => st.kind === "syllables" && (!s.stationId || st.id === s.stationId)).flatMap((st) => st.itemIds);
  return ids.map((id) => NIKUD_SYLLABLE_BY_ID[id]);
}

/** Every syllable of the world (for distractors and fillers). */
function worldSyllables(worldId: string): NikudSyllable[] {
  return NIKUD_WORLD_BY_ID[worldId].stations.filter((st) => st.kind === "syllables").flatMap((st) => st.itemIds.map((id) => NIKUD_SYLLABLE_BY_ID[id]));
}

// ---------------------------------------------------------------- building sheets

/** One sheet of a type for a source (a writing sheet: one per letter, so `build` may return several). */
export function buildSheets(source: WsSource, type: WsType, seed = 0): Sheet[] {
  const r = rng(`${sourceKey(source)}|${type}|${seed}`);
  const key = (k: string) => `${type}-${sourceKey(source)}-${k}-${seed}`;
  if (source.kind === "letters") {
    const ls = letters(source);
    switch (type) {
      case "write":
        return ls.map((l) => ({ type, key: key(l.id), letterId: l.id }));
      case "find":
        return findLetterSheets(ls, r).map((boxes, i) => ({ type, key: key(String(i)), unit: "letter", boxes }));
      case "match":
        return [{ type, key: key("0"), ...matchLetters(ls, r) }];
      case "color":
        return [{ type, key: key("0"), unit: "letter", ...colorSheet(letterTokens(ls, r), r) }];
      case "cut":
        return [{ type, key: key("0"), unit: "letter", ...cutLetters(ls, r) }];
      default:
        return [];
    }
  }
  const sy = syllables(source);
  switch (type) {
    case "find":
      return [{ type, key: key("0"), unit: "syllable", boxes: findSyllables(source.worldId, sy, r) }];
    case "nikud":
      return [{ type, key: key("0"), ...nikudSheet(source, sy, r) }];
    case "color":
      return [
        {
          type,
          key: key("0"),
          unit: "syllable",
          ...colorSheet(
            shuffled(sy, r).map((s) => shownSyllable(s)),
            r,
          ),
        },
      ];
    case "read":
      return [{ type, key: key("0"), sentences: readSentences(source.worldId, r) }];
    case "cut":
      return [{ type, key: key("0"), unit: "syllable", ...cutSyllables(source, r) }];
    default:
      return [];
  }
}

/** 📦 Every sheet for a source, in a sensible order (writing first, reading last). */
export function buildBundle(source: WsSource, seed = 0): Sheet[] {
  // A mixed review station holds many letters: no writing pages there (pick letters by hand for those).
  const mix = source.kind === "letters" && source.stationId && LETTER_STATIONS.find((s) => s.id === source.stationId)?.mix;
  return typesFor(source)
    .filter((t) => !(mix && t === "write"))
    .flatMap((t) => buildSheets(source, t, seed));
}

// ---- 🔎 find and circle

/** Letters that look like this one (CONFUSABLE), plus a few more for a full grid. DRAFT (mom). */
function lookalikesOf(id: string): string[] {
  return CONFUSABLE.filter((g) => g.includes(id)).flatMap((g) => g.filter((x) => x !== id));
}

/** Extra shape-lookalikes not in CONFUSABLE (only for distractors on paper). DRAFT (mom). */
const PAPER_LOOKALIKES: Record<string, string[]> = {
  alef: ["tsadi", "shin"],
  bet: ["pe", "resh"],
  gimel: ["vav", "zayin"],
  dalet: ["he"],
  he: ["dalet", "qof"],
  vav: ["yod", "zayin"],
  zayin: ["yod"],
  het: ["he"],
  tet: ["shin", "samekh"],
  yod: ["vav", "zayin"],
  kaf: ["pe", "nun"],
  lamed: ["kaf", "gimel"],
  mem: ["samekh", "tet"],
  nun: ["kaf", "vav"],
  samekh: ["tet", "mem"],
  ayin: ["shin", "tet"],
  pe: ["kaf", "bet"],
  tsadi: ["alef", "shin"],
  qof: ["he", "resh"],
  resh: ["dalet", "vav"],
  shin: ["tet", "ayin"],
  tav: ["het", "mem"],
  "kaf-sofit": ["resh", "dalet"],
  "mem-sofit": ["samekh", "tet"],
  "nun-sofit": ["vav", "zayin"],
  "pe-sofit": ["kaf-sofit", "pe"],
  "tsadi-sofit": ["tsadi", "ayin"],
};

function distractors(id: string): string[] {
  return uniq([...lookalikesOf(id), ...(PAPER_LOOKALIKES[id] ?? [])]).filter((x) => x !== id);
}

/** A grid: about a third targets, the rest lookalikes (none of them the target), shuffled. */
function grid(targets: string[], others: string[], n: number, r: () => number): string[] {
  const nTarget = Math.round(n * 0.32);
  const cells = Array.from({ length: nTarget }, (_, i) => targets[i % targets.length]);
  while (cells.length < n) cells.push(others[Math.floor(r() * others.length)]);
  return shuffled(cells, r);
}

/** Two letters per sheet (one big box when only one letter). */
function findLetterSheets(ls: Letter[], r: () => number): FindBox[][] {
  // A mix station: four letters with the most lookalikes, so the sheets stay a handful.
  const pickFrom = ls.length > 6 ? shuffled(ls, r).sort((a, b) => distractors(b.id).length - distractors(a.id).length).slice(0, 4) : ls;
  const pages: FindBox[][] = [];
  for (let i = 0; i < pickFrom.length; i += 2) {
    const pair = pickFrom.slice(i, i + 2);
    pages.push(
      pair.map((l) => {
        const n = pair.length === 1 ? 48 : 30;
        const others = distractors(l.id).map((id) => LETTER_BY_ID[id].char);
        return { targets: [l.char], cells: grid([l.char], others, n, r), cols: pair.length === 1 ? 6 : 6 };
      }),
    );
  }
  return pages;
}

const BGDKPT = "בגדכפת";
/** A letter as it starts a syllable: dagesh in בּ גּ דּ כּ פּ תּ, the dot on שׁ (same as nikud.ts). */
function baseOf(letterId: string): string {
  const c = LETTER_BY_ID[letterId].char;
  if (BGDKPT.includes(c)) return c + "ּ";
  if (c === "ש") return "שׁ";
  return c;
}

/** The ways one sound is written in a world: "בָּ" and "בַּ" (both say "ba"). Holam: only with the vav. */
function spellings(s: NikudSyllable): string[] {
  const w = NIKUD_WORLD_BY_ID[s.worldId];
  if (s.pre) return [shownSyllable(s)];
  const marks = w.marks.filter((m) => m.id !== "holamHaser");
  return marks.map((m) => s.base + m.sign);
}

/** Up to two syllables; distractors: the same letter with other vowels learned so far, lookalike letters, others. */
function findSyllables(worldId: string, sy: NikudSyllable[], r: () => number): FindBox[] {
  const order = NIKUD_WORLDS.map((w) => w.id);
  const known = NIKUD_WORLDS.slice(0, order.indexOf(worldId) + 1);
  const targets = shuffled(sy, r).slice(0, 2);
  const w = NIKUD_WORLD_BY_ID[worldId];
  return targets.map((s) => {
    const own = spellings(s);
    let others: string[];
    if (s.pre) {
      // Closed syllables (shva): the other closed syllables of the world, and the open syllable alone.
      others = uniq([...worldSyllables(worldId).filter((x) => x.id !== s.id).map((x) => shownSyllable(x)), s.pre]);
    } else {
      const otherVowels = known
        .filter((k) => k.id !== worldId && k.id !== "shva")
        .flatMap((k) => k.marks.filter((m) => m.id !== "holamHaser").map((m) => s.base + m.sign));
      const lookalikeLetters = distractors(s.letterId)
        .filter((id) => !LETTER_BY_ID[id].final)
        .flatMap((id) => w.marks.filter((m) => m.id !== "holamHaser").map((m) => baseOf(id) + m.sign));
      others = uniq([...otherVowels, ...lookalikeLetters]);
      if (others.length < 4) {
        others.push(...worldSyllables(worldId).filter((x) => x.letterId !== s.letterId).slice(0, 4).map((x) => shownSyllable(x)));
      }
    }
    others = others.filter((o) => !own.includes(o));
    return { targets: own, cells: grid(own, others, targets.length === 1 ? 42 : 30, r), cols: 6 };
  });
}

// ---- 🖼️ picture → first letter

/** One picture per letter (the letter's example word); sound-alike letters (ט/ת, כּ/ק, א/ע) never share a sheet. */
function matchLetters(ls: Letter[], r: () => number): { rows: MatchRow[]; tokens: string[] } {
  const chosen: Letter[] = [];
  const pool = [...shuffled(ls.filter((l) => !l.final), r), ...shuffled(LETTERS.filter((l) => !l.final && !ls.includes(l)), r)];
  for (const l of pool) {
    if (chosen.length >= 6) break;
    if (chosen.some((c) => soundsAlike(c.id, l.id))) continue;
    chosen.push(l);
  }
  const rows = shuffled(chosen, r).map((l) => ({ pic: l.emoji, word: l.word }));
  return { rows, tokens: shuffled(chosen.map((l) => l.char), r) };
}

// ---- 🔊 syllables ↔ pictures, and the missing vowel

const WORLD_SIGNS: Record<string, string[]> = {
  a: ["ָ", "ַ"],
  e: ["ֵ", "ֶ"],
  i: ["ִ"],
  o: ["ֹ"],
  u: ["ֻ"],
  shva: ["ְ"],
};
const VOWEL_SIGN = /[ְ-ֻ]/;
const VOWEL_SIGNS = /[ְ-ֻ]/g;

type Cl = { ch: string; marks: string };
function cls(word: string): Cl[] {
  const out: Cl[] = [];
  for (const c of word.normalize("NFC")) {
    if (/[א-ת]/.test(c)) out.push({ ch: c, marks: "" });
    else if (out.length) out[out.length - 1].marks += c;
  }
  return out;
}
const text = (c: Cl[]) => c.map((x) => x.ch + x.marks).join("");

/** Takes away the first vowel of this world in the word: under/above a letter, or a whole vowel-vav. */
export function blankVowel(word: string, worldId: string): MissingVowel | null {
  const v = NIKUD_WORLD_BY_ID[worldId].vowel;
  const cs = cls(word);
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    const prevBare = i > 0 && !VOWEL_SIGN.test(cs[i - 1].marks);
    const vav = c.ch === "ו" && i > 0 && prevBare && ((v === "o" && c.marks.includes("ֹ")) || (v === "u" && c.marks === "ּ"));
    if (vav) return { pic: "", before: text(cs.slice(0, i)), letter: "", place: "vav", after: text(cs.slice(i + 1)), answer: c.ch + c.marks };
    const sign = WORLD_SIGNS[v].find((s) => c.marks.includes(s));
    if (sign) {
      return {
        pic: "",
        before: text(cs.slice(0, i)),
        letter: c.ch + c.marks.replace(VOWEL_SIGNS, ""),
        place: sign === "ֹ" ? "above" : "under",
        after: text(cs.slice(i + 1)),
        answer: c.ch + c.marks,
      };
    }
  }
  return null;
}

/** Reading words the child can read in this world (the syllables' pictures and the words station). */
function readableWords(worldId: string): NikudWord[] {
  const w = NIKUD_WORLD_BY_ID[worldId];
  const ids = uniq([...w.stations.filter((s) => s.kind === "words").flatMap((s) => s.itemIds), ...worldSyllables(worldId).map((s) => s.word)]);
  return ids.map((id) => NIKUD_WORD_BY_ID[id]).filter((x) => x && decodable(x.word, worldId));
}

function nikudSheet(
  source: Extract<WsSource, { kind: "nikud" }>,
  sy: NikudSyllable[],
  r: () => number,
): { rows: MatchRow[]; tokens: string[]; missing: MissingVowel[]; bank: string[] } {
  // Top: up to 5 syllables, each to the picture that starts with it (others from the world fill in).
  const rest = worldSyllables(source.worldId).filter((s) => !sy.includes(s));
  const chosen: NikudSyllable[] = [];
  for (const s of [...shuffled(sy, r), ...shuffled(rest, r)]) {
    if (chosen.length >= 5) break;
    // Two syllables that sound alike (טָ/תָּ, כָּ/קָ, אָ/עָ) would make a fair picture ambiguous.
    if (chosen.some((c) => soundsAlike(c.letterId, s.letterId) || c.letterId === s.letterId)) continue;
    chosen.push(s);
  }
  const rows = shuffled(chosen, r).map((s) => {
    const w = NIKUD_WORD_BY_ID[s.word];
    return { pic: w.emoji, word: w.word };
  });
  const tokens = shuffled(chosen.map((s) => shownSyllable(s)), r);
  // Bottom: 6 words with this world's vowel missing.
  const used = new Set(rows.map((x) => x.pic));
  const missing = shuffled(readableWords(source.worldId), r)
    .filter((w) => !used.has(w.emoji))
    .map((w) => {
      const m = blankVowel(w.word, source.worldId);
      return m && { ...m, pic: w.emoji };
    })
    .filter((m): m is MissingVowel => !!m)
    .slice(0, 6);
  const w = NIKUD_WORLD_BY_ID[source.worldId];
  const bank = w.marks.filter((m) => m.id !== "holamHaser" || missing.some((x) => x.place === "above")).map((m) => (m.sign.startsWith("ו") ? m.sign : `◌${m.sign}`));
  return { rows, tokens, missing, bank };
}

// ---- 🎨 color by letter: little pixel pictures (12×12). "." stays white; a b c d are the key's colors.

/** DRAFT (mom): the pictures and colors. Every picture is our own. */
const PICTURES: { pic: string; rows: string[]; colors: [string, string][] }[] = [
  {
    pic: "🐞",
    colors: [
      ["#ef4444", "אָדֹם"],
      ["#1f2937", "שָׁחֹר"],
    ],
    rows: [
      "...b....b...",
      "....b..b....",
      "....bbbb....",
      "...bbbbbb...",
      "..aaabbaaa..",
      ".aabaabaabaa",
      ".aaaaabaaaaa",
      ".abbaabaabba",
      ".abbaabaabba",
      ".aaaaabaaaaa",
      "..aabababaa.",
      "...aaabaaa..",
    ].map((x) => x.slice(0, 12)),
  },
  {
    pic: "🌷",
    colors: [
      ["#ec4899", "וָרֹד"],
      ["#facc15", "צָהֹב"],
      ["#22c55e", "יָרֹק"],
    ],
    rows: [
      "...a.aa.a...",
      "...aaaaaa...",
      "..aaabbaaa..",
      "..aabbbbaa..",
      "..aaabbaaa..",
      "...aaaaaa...",
      ".....cc.....",
      ".cc..cc.....",
      ".ccc.cc..cc.",
      "..cccccccc..",
      ".....cc.....",
      ".....cc.....",
    ],
  },
  {
    pic: "🐟",
    colors: [
      ["#f97316", "כָּתֹם"],
      ["#facc15", "צָהֹב"],
      ["#1f2937", "שָׁחֹר"],
      ["#3b82f6", "כָּחֹל"],
    ],
    rows: [
      "............",
      "...aaaaa....",
      ".aaabaabaa.a",
      "acaabaabaaaa",
      "aaaabaabaaa.",
      "aaaabaabaaaa",
      ".aaabaabaa.a",
      "...aaaaa....",
      "............",
      "d..dd...d..d",
      "dddddddddddd",
      "dddddddddddd",
    ],
  },
  {
    pic: "🏠",
    colors: [
      ["#ef4444", "אָדֹם"],
      ["#facc15", "צָהֹב"],
      ["#3b82f6", "כָּחֹל"],
      ["#92400e", "חוּם"],
    ],
    rows: [
      ".....aa.....",
      "....aaaa....",
      "...aaaaaa...",
      "..aaaaaaaa..",
      ".aaaaaaaaaa.",
      "..bbbbbbbb..",
      "..bccbbccb..",
      "..bccbbccb..",
      "..bbbbbbbb..",
      "..bbbddbbb..",
      "..bbbddbbb..",
      "..bbbddbbb..",
    ],
  },
];

/** Letter tokens for a color sheet: the source's letters, then their lookalikes (that's the point: tell them apart). */
function letterTokens(ls: Letter[], r: () => number): string[] {
  const own = shuffled(ls, r).map((l) => l.char);
  const look = shuffled(uniq(ls.flatMap((l) => distractors(l.id))), r).map((id) => LETTER_BY_ID[id].char);
  return uniq([...own, ...look]);
}

function colorSheet(tokens: string[], r: () => number) {
  const fits = PICTURES.filter((p) => p.colors.length <= tokens.length);
  const p = fits[Math.floor(r() * fits.length)] ?? PICTURES[0];
  const keys = p.colors.map(([color, name], i) => ({ token: tokens[i], color, name }));
  return { pattern: p.rows, slots: "abcd".slice(0, keys.length), keys, pic: p.pic };
}

// ---- 📖 read and draw (sentences from our decodable stories: DRAFT (mom))

function readSentences(worldId: string, r: () => number): string[] {
  const pages = STORIES.filter((s) => s.world === worldId).flatMap((s) => s.pages.map((p) => p.text));
  // Something to draw: a statement, not a question; 2–5 words.
  const good = uniq(pages.filter((t) => !t.includes("?") && t.split(/\s+/).length >= 2 && t.split(/\s+/).length <= 5));
  return shuffled(good, r).slice(0, 3);
}

// ---- ✂️ cut and paste

function cutLetters(ls: Letter[], r: () => number): { words: CutWord[]; tiles: string[] } {
  // The letters' example words (finals: the word that ends with it), short enough to cut; others fill in.
  const short = (l: Letter) => cls(l.word).length <= 5;
  const own = shuffled(ls.filter(short), r);
  const more = shuffled(LETTERS.filter((l) => short(l) && !ls.includes(l)), r);
  const chosen: Letter[] = [];
  for (const l of [...own, ...more]) {
    if (chosen.length >= 3) break;
    if (chosen.some((c) => c.word === l.word || c.emoji === l.emoji)) continue;
    chosen.push(l);
  }
  const words = chosen.map((l) => ({ pic: l.emoji, word: l.word, tiles: cls(l.word).map((c) => c.ch + c.marks), showModel: true }));
  return { words, tiles: shuffled(words.flatMap((w) => w.tiles), r) };
}

function cutSyllables(source: Extract<WsSource, { kind: "nikud" }>, r: () => number): { words: CutWord[]; tiles: string[] } {
  const ws = shuffled(readableWords(source.worldId), r)
    .map((w) => ({ w, chips: readWord(w.word).chips.map((c) => c.text) }))
    .filter((x) => x.chips.length >= 2 && x.chips.length <= 3)
    .slice(0, 4);
  const words = ws.map(({ w, chips }) => ({ pic: w.emoji, word: w.word, tiles: chips, showModel: true }));
  return { words, tiles: shuffled(words.flatMap((w) => w.tiles), r) };
}

/** Labels shown on the sheets (kids' text: full nikud, gender-neutral "we do" forms). DRAFT (mom). */
export const WS_TEXT = {
  name: "שֵׁם:",
  write: (name: string) => `כּוֹתְבִים אֶת הָאוֹת ${name}`,
  model: "כָּךְ כּוֹתְבִים",
  trace: "✏️ עוֹבְרִים עַל הַנְּקֻדּוֹת",
  alone: "✍️ כּוֹתְבִים לְבַד",
  start: "מַתְחִילִים בַּנְּקֻדָּה, לְפִי הַמִּסְפָּרִים",
  arrow: "הוֹלְכִים עִם הַחֵץ",
  find: "מוֹצְאִים וּמַקִּיפִים",
  findLetter: "מַקִּיפִים בְּעִגּוּל אֶת כָּל הָאוֹתִיּוֹת",
  findSyllable: "מַקִּיפִים בְּעִגּוּל אֶת כָּל הַהֲבָרוֹת",
  howMany: "כַּמָּה יֵשׁ?",
  match: "תְּמוּנָה וְאוֹת",
  matchHow: "מְחַבְּרִים בְּקַו כָּל תְּמוּנָה לָאוֹת הָרִאשׁוֹנָה שֶׁלָּהּ",
  nikud: "הֲבָרוֹת וּתְמוּנוֹת",
  nikudHow: "מְחַבְּרִים בְּקַו כָּל תְּמוּנָה לַהֲבָרָה הָרִאשׁוֹנָה שֶׁלָּהּ",
  missingHow: "כּוֹתְבִים אֶת הַנִּקּוּד הֶחָסֵר",
  color: "צוֹבְעִים לְפִי הַמַּפְתֵּחַ",
  colorLetter: "צוֹבְעִים לְפִי אוֹת",
  colorSyllable: "צוֹבְעִים לְפִי הֲבָרָה",
  read: "קוֹרְאִים וּמְצַיְּרִים",
  readHow: "קוֹרְאִים אֶת הַמִּשְׁפָּט וּמְצַיְּרִים אוֹתוֹ בַּמִּסְגֶּרֶת",
  cut: "גּוֹזְרִים וּמַדְבִּיקִים",
  cutLetters: "גּוֹזְרִים אֶת הָאוֹתִיּוֹת וּמַדְבִּיקִים מִלָּה מִתַּחַת לַתְּמוּנָה",
  cutSyllables: "גּוֹזְרִים אֶת הַהֲבָרוֹת וּמַדְבִּיקִים מִלָּה מִתַּחַת לַתְּמוּנָה",
  cutHere: "✂️ לִגְזֹר",
  footer: "מַסַּע הַקְּרִיאָה",
} as const;
