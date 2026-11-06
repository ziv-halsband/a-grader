// The nikud worlds: one entry per vowel world, in teaching order. Every screen of every world is built from this.
// DRAFT (mom): the order of the vowels, which letters each station teaches, the memory hooks, the picture words
// and the reading words are all placeholders until mom's topic card. Nothing here is her method yet.
//
// Rules (checked by e2e/nikud-content.spec.ts):
//  - a reading word uses ONLY vowels learned so far (cumulative: a → e → i → o → u → shva), and the world's own vowel;
//  - a syllable's picture word really starts with that syllable;
//  - a picture word's text is shown only if the child can already read it (`decodable`), else just the picture.

import { LETTER_BY_ID, LETTERS } from "./letters.ts";

export type VowelKey = "a" | "e" | "i" | "o" | "u" | "shva";
/** Teaching order of the vowel sounds (cumulative: each world may use everything before it). */
export const VOWEL_ORDER: VowelKey[] = ["a", "e", "i", "o", "u", "shva"];

export type Mark = {
  id: string;
  /** Its name with nikud ("קָמָץ"). */
  name: string;
  /** What is written after the letter: a combining mark ("ָ"), or a vav with its dot ("וֹ", "וּ"). */
  sign: string;
  /** Audio id of "this is X: <how it looks>" (DRAFT hook for mom). */
  line: string;
};

export type NikudSyllable = {
  /** "a-bet", "e-kaf"…; the shva world's closed syllables are "v-<word id>". Stored as "syl:<id>". */
  id: string;
  worldId: string;
  /** The letter that gets the vowel (in the shva world: the closing letter that gets the shva). */
  letterId: string;
  /** Shva world only: the open syllable already read before the closing letter ("מַ" in מַזְ). */
  pre?: string;
  /** The letter with its dagesh / shin dot, before the vowel. */
  base: string;
  /** Which of the world's marks it is shown with by default (the one in its picture word). */
  mark: string;
  /** Picture word that starts with this syllable (a NIKUD_WORDS id). */
  word: string;
  /** Audio id. */
  audio: string;
};

export type NikudWord = {
  id: string;
  word: string;
  emoji: string;
  /** Feminine ("זֹאת", "מַתְחִילָה"). */
  f?: boolean;
  /** Audio id: the letters world's line when it is the same word, else "rw-<id>". */
  audio: string;
};

export type NikudStation = {
  id: string;
  kind: "syllables" | "words";
  /** Syllable ids (kind "syllables") or word ids (kind "words"). */
  itemIds: string[];
};

export type NikudWorld = {
  /** Same id as NIKUD_TOPICS in curriculum.ts. */
  id: string;
  vowel: VowelKey;
  /** "קָמָץ וּפַתָּח" */
  title: string;
  /** "עוֹלַם הַקָּמָץ וְהַפַּתָּח" */
  mapTitle: string;
  marks: Mark[];
  /** The sound both marks make, as shown ("אָ"). */
  sound: string;
  /** Audio id of "they both say: אָ" (said after the marks in "meet the vowel"). */
  soundLine: string;
  /** Map icon: a syllable with the vowel. */
  icon: string;
  /** The world's own color (accent and path on its screens). */
  color: string;
  /** A lighter tint of the color (card backgrounds). */
  tint: string;
  /** Sticker per station, in order (shared by the island and the garden, except kamatz which predates this). */
  stickers: string[];
  /** Buddy gift per station, in order (ids from ACCESSORIES). */
  gifts: string[];
  stations: NikudStation[];
};

export const MARKS = {
  kamatz: { id: "kamatz", name: "קָמָץ", sign: "ָ", line: "kamatz-is" },
  patach: { id: "patach", name: "פַּתָּח", sign: "ַ", line: "patach-is" },
  tsere: { id: "tsere", name: "צֵירֵה", sign: "ֵ", line: "tsere-is" },
  segol: { id: "segol", name: "סֶגּוֹל", sign: "ֶ", line: "segol-is" },
  hiriq: { id: "hiriq", name: "חִירִיק", sign: "ִ", line: "hiriq-is" },
  holam: { id: "holam", name: "חוֹלָם", sign: "וֹ", line: "holam-is" },
  holamHaser: { id: "holamHaser", name: "חוֹלָם חָסֵר", sign: "ֹ", line: "holam-haser-is" },
  shuruk: { id: "shuruk", name: "שׁוּרוּק", sign: "וּ", line: "shuruk-is" },
  kubutz: { id: "kubutz", name: "קֻבּוּץ", sign: "ֻ", line: "kubutz-is" },
  shva: { id: "shva", name: "שְׁוָא", sign: "ְ", line: "shva-is" },
} satisfies Record<string, Mark>;

// ---------------------------------------------------------------- words (DRAFT (mom): every word and picture)

/** A letters-world example word is reused with its audio; any other word gets its own line "rw-<id>". */
function W(id: string, word: string, emoji: string, f?: boolean): NikudWord {
  const same = LETTERS.find((l) => l.word === word);
  return { id, word, emoji, f, audio: same ? `word-${same.id}` : `rw-${id}` };
}

export const NIKUD_WORDS: NikudWord[] = [
  // The letters world's example words (pictures for the kamatz/patach syllables).
  ...LETTERS.filter((l) => !l.final).map((l) => W(`l-${l.id}`, l.word, l.emoji, l.wordF)),
  // קָמָץ וּפַתָּח
  W("aba", "אַבָּא", "👨"),
  W("saba", "סַבָּא", "👴"),
  W("mapa", "מַפָּה", "🗺️", true),
  W("banana", "בַּנָּנָה", "🍌", true),
  W("yam", "יָם", "🌊"),
  // צֵירֵה וְסֶגּוֹל
  W("beytsa", "בֵּיצָה", "🥚", true),
  W("kelev", "כֶּלֶב", "🐕"),
  W("sefer", "סֵפֶר", "📕"),
  W("shemesh", "שֶׁמֶשׁ", "☀️", true),
  W("geshem", "גֶּשֶׁם", "🌧️"),
  W("lechem", "לֶחֶם", "🍞"),
  W("perach", "פֶּרַח", "🌸"),
  W("ner", "נֵר", "🕯️"),
  W("delet", "דֶּלֶת", "🚪", true),
  W("regel", "רֶגֶל", "🦵", true),
  W("te", "תֵּה", "🍵"),
  W("yeled", "יֶלֶד", "👦"),
  W("gezer", "גֶּזֶר", "🥕"),
  W("shen", "שֵׁן", "🦷", true),
  W("yareach", "יָרֵחַ", "🌙"),
  W("keshet", "קֶשֶׁת", "🌈", true),
  W("keves", "כֶּבֶשׂ", "🐑"),
  // חִירִיק
  W("ima", "אִמָּא", "👩", true),
  W("pil", "פִּיל", "🐘"),
  W("kise", "כִּיסֵּא", "🪑"),
  W("mita", "מִטָּה", "🛏️", true),
  W("gitara", "גִּיטָרָה", "🎸", true),
  W("tik", "תִּיק", "🎒"),
  W("sira", "סִירָה", "🚤", true),
  W("til", "טִיל", "🚀"),
  W("zikit", "זִיקִית", "🦎", true),
  W("shinayim", "שִׁנַּיִם", "🦷"),
  W("limon", "לִימוֹן", "🍋"),
  W("tsipor", "צִפּוֹר", "🐦", true),
  W("pitsa", "פִּיצָה", "🍕", true),
  W("chatsil", "חָצִיל", "🍆"),
  W("tanin", "תַּנִּין", "🐊"),
  // חוֹלָם
  W("dov", "דּוֹב", "🐻"),
  W("kochav", "כּוֹכָב", "⭐"),
  W("gozal", "גּוֹזָל", "🐣"),
  W("tof", "תּוֹף", "🥁"),
  W("robot", "רוֹבּוֹט", "🤖"),
  W("monit", "מוֹנִית", "🚕", true),
  W("yona", "יוֹנָה", "🕊️", true),
  W("kof", "קוֹף", "🐒"),
  W("ozen", "אֹזֶן", "👂", true),
  W("boten", "בּוֹטֵן", "🥜"),
  W("shokolad", "שׁוֹקוֹלָד", "🍫"),
  W("chof", "חוֹף", "🏖️"),
  W("kova", "כּוֹבַע", "🎩"),
  W("ofanayim", "אוֹפַנַּיִם", "🚲"),
  // שׁוּרוּק וְקֻבּוּץ
  W("sus", "סוּס", "🐴"),
  W("tut", "תּוּת", "🍓"),
  W("uga", "עוּגָה", "🎂", true),
  W("shum", "שׁוּם", "🧄"),
  W("dubi", "דֻּבִּי", "🧸"),
  W("chut", "חוּט", "🧵"),
  W("muzika", "מוּזִיקָה", "🎵", true),
  W("bua", "בּוּעָה", "🫧", true),
  W("gur", "גּוּר", "🐶"),
  W("nura", "נוּרָה", "💡", true),
  W("kubiya", "קֻבִּיָּה", "🎲", true),
  W("ruach", "רוּחַ", "🌬️", true),
  W("sukariya", "סֻכָּרִיָּה", "🍬", true),
  W("tuki", "תֻּכִּי", "🦜"),
  // שְׁוָא
  W("savta", "סַבְתָּא", "👵", true),
  W("mazleg", "מַזְלֵג", "🍴"),
  W("simla", "שִׂמְלָה", "👗", true),
  W("masait", "מַשְׁאִית", "🚚", true),
  W("daleat", "דַּלְעַת", "🎃", true),
  W("yalda", "יַלְדָּה", "👧", true),
  W("ramzor", "רַמְזוֹר", "🚦"),
  W("bakbuk", "בַּקְבּוּק", "🍼"),
  W("magnet", "מַגְנֵט", "🧲"),
  W("avatiach", "אַבְטִיחַ", "🍉"),
  W("mishkafayim", "מִשְׁקָפַיִם", "👓"),
  W("arnav", "אַרְנָב", "🐰"),
  W("michnasayim", "מִכְנָסַיִם", "👖"),
];

export const NIKUD_WORD_BY_ID = Object.fromEntries(NIKUD_WORDS.map((w) => [w.id, w])) as Record<string, NikudWord>;

// ---------------------------------------------------------------- syllables

const DAGESH = "ּ";
const KAMATZ = MARKS.kamatz.sign;

/** A letter's base as written at the start of a syllable: dagesh in בּ גּ דּ כּ פּ תּ, the dot on שׁ. */
function baseOf(letterId: string): string {
  const c = LETTER_BY_ID[letterId].char;
  if ("בגדכפת".includes(c)) return c + DAGESH;
  if (c === "ש") return "שׁ";
  return c;
}

/** One open syllable: letter + this world's vowel, with the picture word that starts with it. */
function S(worldId: string, vowel: VowelKey, letterId: string, mark: string, word: string): NikudSyllable {
  const base = baseOf(letterId);
  // Kamatz syllables keep their old audio ids ("syl-bet"), recorded before this engine.
  const id = `${vowel}-${letterId}`;
  return { id, worldId, letterId, base, mark, word, audio: vowel === "a" ? `syl-${letterId}` : `syl-${id}` };
}

/** Shva world: a closed syllable, an open one + a letter with shva ("מַ" + "זְ" → "מַזְ"). */
function C(pre: string, letterId: string, word: string, base = LETTER_BY_ID[letterId].char): NikudSyllable {
  const id = `v-${word}`;
  return { id, worldId: "shva", letterId, pre, base, mark: "shva", word, audio: `syl-${id}` };
}

const A = (l: string, m: "kamatz" | "patach") => S("kamatz-patach", "a", l, m, `l-${l}`);
const E = (l: string, m: "tsere" | "segol", w: string) => S("tsere-segol", "e", l, m, w);
const I = (l: string, w: string) => S("hiriq", "i", l, "hiriq", w);
const O = (l: string, m: "holam" | "holamHaser", w: string) => S("holam", "o", l, m, w);
const U = (l: string, m: "shuruk" | "kubutz", w: string) => S("shuruk-kubutz", "u", l, m, w);

export const NIKUD_SYLLABLES: NikudSyllable[] = [
  // קָמָץ וּפַתָּח: the picture is each letter's example word from the letters world (DRAFT (mom)).
  A("alef", "patach"),
  A("mem", "patach"),
  A("lamed", "patach"),
  A("bet", "patach"),
  A("dalet", "kamatz"),
  A("gimel", "kamatz"),
  A("resh", "patach"),
  A("nun", "kamatz"),
  A("shin", "kamatz"),
  A("tav", "patach"),
  A("samekh", "patach"),
  A("kaf", "patach"),
  A("pe", "patach"),
  A("yod", "kamatz"),
  A("het", "kamatz"),
  A("tsadi", "kamatz"),
  // צֵירֵה וְסֶגּוֹל
  E("bet", "tsere", "beytsa"),
  E("kaf", "segol", "kelev"),
  E("samekh", "tsere", "sefer"),
  E("shin", "segol", "shemesh"),
  E("gimel", "segol", "geshem"),
  E("lamed", "segol", "lechem"),
  E("pe", "segol", "perach"),
  E("nun", "tsere", "ner"),
  E("dalet", "segol", "delet"),
  E("resh", "segol", "regel"),
  E("tav", "tsere", "te"),
  E("yod", "segol", "yeled"),
  // חִירִיק
  I("alef", "ima"),
  I("pe", "pil"),
  I("kaf", "kise"),
  I("mem", "mita"),
  I("gimel", "gitara"),
  I("tav", "tik"),
  I("samekh", "sira"),
  I("tet", "til"),
  I("zayin", "zikit"),
  I("shin", "shinayim"),
  I("lamed", "limon"),
  I("tsadi", "tsipor"),
  // חוֹלָם (אֹזֶן shows the holam without a vav)
  O("dalet", "holam", "dov"),
  O("kaf", "holam", "kochav"),
  O("gimel", "holam", "gozal"),
  O("tav", "holam", "tof"),
  O("resh", "holam", "robot"),
  O("mem", "holam", "monit"),
  O("yod", "holam", "yona"),
  O("qof", "holam", "kof"),
  O("alef", "holamHaser", "ozen"),
  O("bet", "holam", "boten"),
  O("shin", "holam", "shokolad"),
  O("het", "holam", "chof"),
  // שׁוּרוּק וְקֻבּוּץ
  U("samekh", "shuruk", "sus"),
  U("tav", "shuruk", "tut"),
  U("ayin", "shuruk", "uga"),
  U("shin", "shuruk", "shum"),
  U("dalet", "kubutz", "dubi"),
  U("het", "shuruk", "chut"),
  U("mem", "shuruk", "muzika"),
  U("bet", "shuruk", "bua"),
  U("gimel", "shuruk", "gur"),
  U("nun", "shuruk", "nura"),
  U("qof", "kubutz", "kubiya"),
  U("resh", "shuruk", "ruach"),
  // שְׁוָא, DRAFT (mom): only the "closing" shva (שְׁוָא נָח) for now: מַ + זְ → מַזְ.
  C("סַ", "bet", "savta"),
  C("מַ", "zayin", "mazleg"),
  C("שִׂ", "mem", "simla"),
  C("מַ", "shin", "masait", "שׁ"),
  C("פַּ", "resh", "l-pe"),
  C("סַ", "nun", "l-samekh"),
  C("דַּ", "lamed", "daleat"),
  C("יַ", "lamed", "yalda"),
  C("רַ", "mem", "ramzor"),
  C("בַּ", "qof", "bakbuk"),
  C("מַ", "gimel", "magnet"),
  C("אַ", "bet", "avatiach"),
];

export const NIKUD_SYLLABLE_BY_ID = Object.fromEntries(NIKUD_SYLLABLES.map((s) => [s.id, s])) as Record<
  string,
  NikudSyllable
>;

/** What the voice reads for a syllable: a bare "בֵּ" is often slurred or read as the letter's name. */
export function spokenSyllable(s: NikudSyllable): string {
  const w = NIKUD_WORLD_BY_ID[s.worldId];
  switch (w.vowel) {
    case "a":
      return `${s.base}${KAMATZ}ה`; // "בָּה" (the silent ה makes the voice say just "ba")
    case "e":
      return `${s.base}ֵה`; // "בֵּה"
    case "i":
      return `${s.base}ִי`; // "בִּי"
    case "o":
      return `${s.base}וֹ`; // "בּוֹ"
    case "u":
      return `${s.base}וּ`; // "בּוּ"
    case "shva": {
      // The closed syllable as a little word: "מַז", "סַן", "שִׂים" (final forms at the end).
      const finals: Record<string, string> = { מ: "ם", נ: "ן", צ: "ץ", פ: "ף", כ: "ך" };
      const pre = s.pre!.startsWith("שִׂ") ? "שִׂי" : s.pre!;
      return pre + (finals[s.base] ?? s.base);
    }
  }
}

/** The syllable as shown, with its default mark or another of the world's marks. */
export function shownSyllable(s: NikudSyllable, markId = s.mark): string {
  const m = (MARKS as Record<string, Mark>)[markId];
  return (s.pre ?? "") + s.base + m.sign;
}

// ---------------------------------------------------------------- worlds and stations

const syl = (worldId: string, ...ids: string[]) => ids.map((x) => `${worldId}-${x}`);

export const NIKUD_WORLDS: NikudWorld[] = [
  {
    id: "kamatz-patach",
    vowel: "a",
    title: "קָמָץ וּפַתָּח",
    mapTitle: "עוֹלַם הַקָּמָץ וְהַפַּתָּח",
    marks: [MARKS.kamatz, MARKS.patach],
    sound: "אָ",
    soundLine: "both-say-a",
    icon: "בָּ",
    color: "#f97316",
    tint: "#ffedd5",
    stickers: [], // per visual world: WORLDS[...].kpStickers (rewards.ts)
    gifts: ["goggles", "lollipop", "party", "umbrella", "gradcap"],
    stations: [
      { id: "k1", kind: "syllables", itemIds: syl("a", "alef", "mem", "lamed", "bet") },
      { id: "k2", kind: "syllables", itemIds: syl("a", "dalet", "gimel", "resh", "nun") },
      { id: "k3", kind: "syllables", itemIds: syl("a", "shin", "tav", "samekh", "kaf") },
      { id: "k4", kind: "syllables", itemIds: syl("a", "pe", "yod", "het", "tsadi") },
      { id: "k5", kind: "words", itemIds: ["aba", "saba", "mapa", "banana", "l-dalet", "l-yod", "yam", "l-gimel"] },
    ],
  },
  {
    id: "tsere-segol",
    vowel: "e",
    title: "צֵירֵה וְסֶגּוֹל",
    mapTitle: "עוֹלַם הַצֵּירֵה וְהַסֶּגּוֹל",
    marks: [MARKS.tsere, MARKS.segol],
    sound: "אֵ",
    soundLine: "both-say-e",
    icon: "בֵּ",
    color: "#0ea5e9",
    tint: "#e0f2fe",
    stickers: ["🪐", "🌠", "🛸", "👽"],
    gifts: ["headphones", "kite", "snorkel", "icecream"],
    stations: [
      { id: "e1", kind: "syllables", itemIds: syl("e", "bet", "kaf", "samekh", "shin") },
      { id: "e2", kind: "syllables", itemIds: syl("e", "gimel", "lamed", "pe", "nun") },
      { id: "e3", kind: "syllables", itemIds: syl("e", "dalet", "resh", "tav", "yod") },
      { id: "e4", kind: "words", itemIds: ["kelev", "gezer", "delet", "shen", "beytsa", "yareach", "keshet", "keves"] },
    ],
  },
  {
    id: "hiriq",
    vowel: "i",
    title: "חִירִיק",
    mapTitle: "עוֹלַם הַחִירִיק",
    marks: [MARKS.hiriq],
    sound: "אִ",
    soundLine: "hiriq-says",
    icon: "בִּ",
    color: "#16a34a",
    tint: "#dcfce7",
    stickers: ["🐠", "🐙", "🦀", "🐳"],
    gifts: ["helmet", "yoyo", "flower", "magnifier"],
    stations: [
      { id: "i1", kind: "syllables", itemIds: syl("i", "alef", "pe", "kaf", "mem") },
      { id: "i2", kind: "syllables", itemIds: syl("i", "gimel", "tav", "samekh", "tet") },
      { id: "i3", kind: "syllables", itemIds: syl("i", "zayin", "shin", "lamed", "tsadi") },
      { id: "i4", kind: "words", itemIds: ["pil", "kise", "pitsa", "mita", "gitara", "tik", "chatsil", "tanin"] },
    ],
  },
  {
    id: "holam",
    vowel: "o",
    title: "חוֹלָם",
    mapTitle: "עוֹלַם הַחוֹלָם",
    marks: [MARKS.holam, MARKS.holamHaser],
    sound: "אוֹ",
    soundLine: "holam-says",
    icon: "בּוֹ",
    color: "#9333ea",
    tint: "#f3e8ff",
    stickers: ["🦖", "🦕", "🌋", "🦴"],
    gifts: ["sunflower", "flag", "paddle", "trumpet"],
    stations: [
      { id: "o1", kind: "syllables", itemIds: syl("o", "dalet", "kaf", "gimel", "tav") },
      { id: "o2", kind: "syllables", itemIds: syl("o", "resh", "mem", "yod", "qof") },
      { id: "o3", kind: "syllables", itemIds: syl("o", "alef", "bet", "shin", "het") },
      { id: "o4", kind: "words", itemIds: ["dov", "kochav", "tof", "robot", "monit", "kova", "ofanayim", "l-shin"] },
    ],
  },
  {
    id: "shuruk-kubutz",
    vowel: "u",
    title: "שׁוּרוּק וְקֻבּוּץ",
    mapTitle: "עוֹלַם הַשּׁוּרוּק וְהַקֻּבּוּץ",
    marks: [MARKS.shuruk, MARKS.kubutz],
    sound: "אוּ",
    soundLine: "both-say-u",
    icon: "בּוּ",
    color: "#db2777",
    tint: "#fce7f3",
    stickers: ["🎠", "🎡", "🎪", "🤹"],
    gifts: ["cupcake", "lantern", "cap", "popcorn"],
    stations: [
      { id: "u1", kind: "syllables", itemIds: syl("u", "samekh", "tav", "ayin", "shin") },
      { id: "u2", kind: "syllables", itemIds: syl("u", "dalet", "het", "mem", "bet") },
      { id: "u3", kind: "syllables", itemIds: syl("u", "gimel", "nun", "qof", "resh") },
      { id: "u4", kind: "words", itemIds: ["sus", "tut", "uga", "dubi", "nura", "sukariya", "tuki", "l-kaf"] },
    ],
  },
  {
    id: "shva",
    vowel: "shva",
    title: "שְׁוָא",
    mapTitle: "עוֹלַם הַשְּׁוָא",
    marks: [MARKS.shva],
    sound: "",
    soundLine: "shva-says",
    icon: "בְּ",
    color: "#ca8a04",
    tint: "#fef9c3",
    stickers: ["🏰", "🛡️", "💍", "🧙"],
    gifts: ["crown", "wand", "tophat", "star"],
    stations: [
      { id: "v1", kind: "syllables", itemIds: ["v-savta", "v-mazleg", "v-simla", "v-masait"] },
      { id: "v2", kind: "syllables", itemIds: ["v-l-pe", "v-l-samekh", "v-daleat", "v-yalda"] },
      { id: "v3", kind: "syllables", itemIds: ["v-ramzor", "v-bakbuk", "v-magnet", "v-avatiach"] },
      {
        id: "v4",
        kind: "words",
        itemIds: ["mishkafayim", "arnav", "michnasayim", "l-ayin", "l-mem", "savta", "avatiach", "masait"],
      },
    ],
  },
];

export const NIKUD_WORLD_BY_ID = Object.fromEntries(NIKUD_WORLDS.map((w) => [w.id, w])) as Record<string, NikudWorld>;

export function nikudStation(worldId: string, stationId: string): NikudStation | undefined {
  return NIKUD_WORLD_BY_ID[worldId]?.stations.find((s) => s.id === stationId);
}

/** The station's title on the map: its syllables ("בֵּ כֶּ סֵ שֶׁ"), or 📖 for reading words. */
export function stationTitle(st: NikudStation): string {
  return st.kind === "words"
    ? "קוֹרְאִים מִלִּים"
    : st.itemIds.map((id) => shownSyllable(NIKUD_SYLLABLE_BY_ID[id])).join(" ");
}

/** Syllables taught in this world up to and including this station. */
export function syllablesUpTo(worldId: string, stationId: string): string[] {
  const w = NIKUD_WORLD_BY_ID[worldId];
  const idx = w.stations.findIndex((s) => s.id === stationId);
  return w.stations
    .slice(0, idx + 1)
    .filter((s) => s.kind === "syllables")
    .flatMap((s) => s.itemIds);
}

/** Vowels a child knows in this world (everything up to and including it). */
export function allowedVowels(worldId: string): VowelKey[] {
  const v = NIKUD_WORLD_BY_ID[worldId].vowel;
  return VOWEL_ORDER.slice(0, VOWEL_ORDER.indexOf(v) + 1);
}

// ---------------------------------------------------------------- reading a word (the validator, and the chips)

const VOWEL_OF: Record<string, VowelKey> = {
  "ְ": "shva",
  "ֱ": "shva", // hataf segol, hataf patach, hataf kamatz: a shva with a vowel (only from the shva world)
  "ֲ": "shva",
  "ֳ": "shva",
  "ִ": "i",
  "ֵ": "e",
  "ֶ": "e",
  "ַ": "a",
  "ָ": "a",
  "ֹ": "o",
  "ֺ": "o",
  "ֻ": "u",
};
const HOLAM = /[ֹֺ]/;

type Cluster = { ch: string; marks: string };

function clusters(word: string): Cluster[] {
  const out: Cluster[] = [];
  for (const c of word.normalize("NFC")) {
    if (/[א-ת]/.test(c)) out.push({ ch: c, marks: "" });
    else if (out.length && /[֑-ׇ]/.test(c)) out[out.length - 1].marks += c;
  }
  return out;
}

export type WordReading = {
  /** Every vowel the word uses. */
  vowels: VowelKey[];
  /** Why it can't be read with nikud alone (empty = fine). */
  problems: string[];
  /** The word in reading chips: one per spoken syllable, with its vowel ("שׁוֹ|קוֹ|לָד"). */
  chips: { text: string; vowel?: VowelKey; closed: boolean }[];
};

/**
 * Reads a word the way a child decodes it: each letter has a vowel, or is a vav carrying the vowel of the letter
 * before it (וֹ, וּ), a silent א/ה/י after a vowel, or the last letter (it closes the syllable).
 * A letter in the middle with no vowel needs a written shva.
 */
export function readWord(word: string): WordReading {
  const cs = clusters(word);
  const vowels = new Set<VowelKey>();
  const problems: string[] = [];
  const chips: WordReading["chips"] = [];
  for (let i = 0; i < cs.length; i++) {
    const { ch, marks } = cs[i];
    const last = i === cs.length - 1;
    const vs = [...marks].filter((m) => m in VOWEL_OF).map((m) => VOWEL_OF[m]);
    if ([...marks].some((m) => !(m in VOWEL_OF) && !"ּׁׂ".includes(m) && m !== "ׇ")) problems.push(`unknown mark on ${ch}`);
    if (marks.includes("ׇ")) problems.push(`kamatz katan on ${ch}`);
    const text = ch + marks;
    const prevChip = chips[chips.length - 1];

    // A vav carrying the vowel of the letter before it: holam male (וֹ) or shuruk (וּ).
    const prevBare = i > 0 && ![...cs[i - 1].marks].some((m) => m in VOWEL_OF);
    if (ch === "ו" && i > 0 && prevBare && (HOLAM.test(marks) || marks === "ּ")) {
      const v: VowelKey = HOLAM.test(marks) ? "o" : "u";
      vowels.add(v);
      prevChip.text += text;
      prevChip.vowel = v;
      prevChip.closed = false;
      continue;
    }
    if (vs.length > 1) problems.push(`two vowels on ${ch}`);
    const v = vs[0];
    if (v) vowels.add(v);

    if (v && v !== "shva") {
      // A patach under a final ח / ע is read before the letter ("תַּפּוּחַ" = tapu-ach): it joins the syllable before.
      if (last && v === "a" && "חע".includes(ch) && prevChip && !prevChip.closed && marks.includes("ַ")) {
        prevChip.text += text;
        prevChip.closed = true;
        continue;
      }
      chips.push({ text, vowel: v, closed: false });
      continue;
    }
    if (v === "shva") {
      // At the start, a shva is read with the next syllable (שְׁוָא נָע): DRAFT, not used in our words yet.
      if (!prevChip) chips.push({ text, vowel: "shva", closed: false });
      else {
        prevChip.text += text;
        prevChip.closed = true;
      }
      continue;
    }
    // No vowel on this letter.
    const next = cs[i + 1];
    const vavNext = next && next.ch === "ו" && (HOLAM.test(next.marks) || next.marks === "ּ");
    if (vavNext) {
      chips.push({ text, closed: false });
      continue;
    }
    if (last) {
      if (prevChip) {
        prevChip.text += text;
        // A silent letter at the end doesn't close the syllable (אַבָּא, מַפָּה).
        const silent = "אה".includes(ch) || (ch === "י" && (prevChip.vowel === "i" || prevChip.vowel === "e"));
        if (!silent) prevChip.closed = true;
      } else chips.push({ text, closed: true });
      continue;
    }
    if ("אי".includes(ch) && prevChip && !prevChip.closed) {
      prevChip.text += text; // silent: בֵּיצָה, פִּיל, רֹאשׁ
      continue;
    }
    problems.push(`no vowel on ${ch} (needs a shva)`);
    if (prevChip) prevChip.text += text;
  }
  return { vowels: [...vowels], problems, chips };
}

/** Can a child in this world read the word with what they know? */
export function decodable(word: string, worldId: string): boolean {
  const r = readWord(word);
  const ok = allowedVowels(worldId);
  return r.problems.length === 0 && r.vowels.every((v) => ok.includes(v));
}

/** Marks put back in a fixed order, so two spellings of the same syllable compare equal. */
export function normalizeNikud(s: string): string {
  return clusters(s)
    .map((c) => c.ch + [...c.marks].sort().join(""))
    .join("");
}

/** Every syllable of every world, by how it sounds ("בּ|e"), to play a reading chip's sound. */
export function chipSound(text: string, upToWorld: string): string | undefined {
  const order = NIKUD_WORLDS.map((w) => w.id);
  const known = NIKUD_SYLLABLES.filter((s) => order.indexOf(s.worldId) <= order.indexOf(upToWorld));
  const norm = normalizeNikud(text);
  // A closed shva syllable is matched as written ("סַבְ").
  const exact = known.find((s) => normalizeNikud(shownSyllable(s)) === norm);
  if (exact) return exact.audio;
  const r = readWord(text);
  const chip = r.chips[0];
  if (!chip || chip.closed || !chip.vowel || r.chips.length !== 1) return undefined;
  const first = clusters(text)[0];
  const head = first.ch + (/[בכפ]/.test(first.ch) && first.marks.includes("ּ") ? "ּ" : "") + (first.marks.match(/[ׁׂ]/)?.[0] ?? "");
  const match = known.find((s) => {
    if (s.pre) return false;
    const b = clusters(s.base)[0];
    const sHead = b.ch + (/[בכפ]/.test(b.ch) && b.marks.includes("ּ") ? "ּ" : "") + (b.marks.match(/[ׁׂ]/)?.[0] ?? "");
    return sHead === head && NIKUD_WORLD_BY_ID[s.worldId].vowel === chip.vowel;
  });
  return match?.audio;
}
