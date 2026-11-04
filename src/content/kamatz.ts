// The קָמָץ וּפַתָּח world: the first nikud. DRAFT content until mom's topic card.
// Both marks say the same sound, "אָ", so a syllable is heard the same with either one;
// the screen mixes both on purpose so the child learns to read both shapes.
//
// Rule from the brief: only letters the child already knows, and only kamatz/patach in the words.

import { LETTER_BY_ID } from "./letters.ts";

export const KAMATZ = "ָ"; // ָ
export const PATACH = "ַ"; // ַ
const DAGESH = "ּ";
const SHIN_DOT = "ׁ";

export type Syllable = {
  /** Same id as the letter: "bet" → בָּ. */
  id: string;
  letterId: string;
  /** Letter + its marks before the vowel (dagesh for בּ כּ פּ…, shin dot). */
  base: string;
  /** What the voice reads. A bare "בָּ" is often read as the letter name, so a word that sounds the same is used. */
  spoken: string;
  /** A picture word whose first sound is this syllable (for "which word starts like בָּ?"). */
  starts?: { word: string; emoji: string };
};

// spoken: the vowel sound "a" closed with a silent ה makes TTS read just the syllable ("בָּה" → "ba").
const S = (letterId: string, marks: string, starts?: Syllable["starts"]): Syllable => {
  const base = LETTER_BY_ID[letterId].char + marks;
  return { id: letterId, letterId, base, spoken: `${base}${KAMATZ}ה`, starts };
};

export const SYLLABLES: Syllable[] = [
  S("alef", "", { word: "אַרְיֵה", emoji: "🦁" }),
  S("mem", "", { word: "מַפָּה", emoji: "🗺️" }),
  S("lamed", "", { word: "לַהַב", emoji: "🔥" }),
  S("bet", DAGESH, { word: "בַּנָּנָה", emoji: "🍌" }),
  S("dalet", DAGESH, { word: "דָּג", emoji: "🐟" }),
  S("gimel", DAGESH, { word: "גָּמָל", emoji: "🐫" }),
  S("resh", "", { word: "רַכֶּבֶת", emoji: "🚂" }),
  S("nun", "", { word: "נָחָשׁ", emoji: "🐍" }),
  S("shin", SHIN_DOT, { word: "שָׁעוֹן", emoji: "⏰" }),
  S("tav", DAGESH, { word: "תַּפּוּחַ", emoji: "🍎" }),
  S("samekh", "", { word: "סַבָּא", emoji: "👴" }),
  S("kaf", DAGESH, { word: "כַּדּוּר", emoji: "⚽" }),
  S("pe", DAGESH, { word: "פַּרְפַּר", emoji: "🦋" }),
  S("yod", "", { word: "יָד", emoji: "✋" }),
  S("het", "", { word: "חָתוּל", emoji: "🐱" }),
  S("tsadi", "", { word: "צָב", emoji: "🐢" }),
];

export const SYLLABLE_BY_ID = Object.fromEntries(SYLLABLES.map((s) => [s.id, s])) as Record<string, Syllable>;

/** The syllable as shown, with either mark. */
export function shown(s: Syllable, mark: "kamatz" | "patach") {
  return s.base + (mark === "kamatz" ? KAMATZ : PATACH);
}

/**
 * First words to read alone: only kamatz/patach, only letters from the letters world.
 * Each part is a syllable chip; `syl` = the open syllable it sounds like (so tapping it plays that sound).
 */
export type ReadWord = { id: string; word: string; emoji: string; parts: { text: string; syl?: string }[] };

export const READ_WORDS: ReadWord[] = [
  { id: "aba", word: "אַבָּא", emoji: "👨", parts: [{ text: "אַ", syl: "alef" }, { text: "בָּא", syl: "bet" }] },
  { id: "saba", word: "סַבָּא", emoji: "👴", parts: [{ text: "סַ", syl: "samekh" }, { text: "בָּא", syl: "bet" }] },
  { id: "mapa", word: "מַפָּה", emoji: "🗺️", parts: [{ text: "מַ", syl: "mem" }, { text: "פָּה", syl: "pe" }] },
  { id: "banana", word: "בַּנָּנָה", emoji: "🍌", parts: [{ text: "בַּ", syl: "bet" }, { text: "נָּ", syl: "nun" }, { text: "נָה", syl: "nun" }] },
  { id: "dag", word: "דָּג", emoji: "🐟", parts: [{ text: "דָּ", syl: "dalet" }, { text: "ג" }] },
  { id: "yad", word: "יָד", emoji: "✋", parts: [{ text: "יָ", syl: "yod" }, { text: "ד" }] },
  { id: "yam", word: "יָם", emoji: "🌊", parts: [{ text: "יָ", syl: "yod" }, { text: "ם" }] },
  { id: "tsav", word: "צָב", emoji: "🐢", parts: [{ text: "צָ", syl: "tsadi" }, { text: "ב" }] },
  { id: "kaf", word: "כַּף", emoji: "🥄", parts: [{ text: "כַּ", syl: "kaf" }, { text: "ף" }] },
  { id: "kad", word: "כַּד", emoji: "🏺", parts: [{ text: "כַּ", syl: "kaf" }, { text: "ד" }] },
];

export const READ_WORD_BY_ID = Object.fromEntries(READ_WORDS.map((w) => [w.id, w])) as Record<string, ReadWord>;

export type KamatzStation = {
  id: string;
  title: string;
  kind: "syllables" | "words";
  /** Syllable ids (kind "syllables") or word ids (kind "words"). */
  itemIds: string[];
};

export const KAMATZ_STATIONS: KamatzStation[] = [
  { id: "k1", title: "אָ מָ לָ בָּ", kind: "syllables", itemIds: ["alef", "mem", "lamed", "bet"] },
  { id: "k2", title: "דָּ גָּ רָ נָ", kind: "syllables", itemIds: ["dalet", "gimel", "resh", "nun"] },
  { id: "k3", title: "שָׁ תָּ סָ כָּ", kind: "syllables", itemIds: ["shin", "tav", "samekh", "kaf"] },
  { id: "k4", title: "פָּ יָ חָ צָ", kind: "syllables", itemIds: ["pe", "yod", "het", "tsadi"] },
  { id: "k5", title: "קוֹרְאִים מִלִּים", kind: "words", itemIds: READ_WORDS.map((w) => w.id) },
];

/** Syllables taught in this station and every station before it. */
export function syllablesUpTo(stationId: string): string[] {
  const idx = KAMATZ_STATIONS.findIndex((s) => s.id === stationId);
  return KAMATZ_STATIONS.slice(0, idx + 1)
    .filter((s) => s.kind === "syllables")
    .flatMap((s) => s.itemIds);
}
