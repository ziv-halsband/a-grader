// The letters world. DRAFT content: the order, names, example words and confusable
// pairs are placeholders until mom fills in her topic card (docs/02-topic-card-template.md).

export type Letter = {
  id: string;
  char: string;
  /** Letter name with nikud, as spoken. */
  name: string;
  /** Example word with nikud; it starts with this letter (or ends with it, for final letters). */
  word: string;
  emoji: string;
  final?: boolean;
};

export const LETTERS: Letter[] = [
  { id: "alef", char: "א", name: "אָלֶף", word: "אַרְיֵה", emoji: "🦁" },
  { id: "bet", char: "ב", name: "בֵּית", word: "בַּיִת", emoji: "🏠" },
  { id: "gimel", char: "ג", name: "גִּימֶל", word: "גָּמָל", emoji: "🐫" },
  { id: "dalet", char: "ד", name: "דָּלֶת", word: "דָּג", emoji: "🐟" },
  { id: "he", char: "ה", name: "הֵא", word: "הֶלִיקוֹפְּטֶר", emoji: "🚁" },
  { id: "vav", char: "ו", name: "וָו", word: "וֶרֶד", emoji: "🌹" },
  { id: "zayin", char: "ז", name: "זַיִן", word: "זֶבְּרָה", emoji: "🦓" },
  { id: "het", char: "ח", name: "חֵית", word: "חָתוּל", emoji: "🐱" },
  { id: "tet", char: "ט", name: "טֵית", word: "טִיל", emoji: "🚀" },
  { id: "yod", char: "י", name: "יוֹד", word: "יָד", emoji: "✋" },
  { id: "kaf", char: "כ", name: "כַּף", word: "כַּדּוּר", emoji: "⚽" },
  { id: "lamed", char: "ל", name: "לָמֶד", word: "לִימוֹן", emoji: "🍋" },
  { id: "mem", char: "מ", name: "מֵם", word: "מְכוֹנִית", emoji: "🚗" },
  { id: "nun", char: "נ", name: "נוּן", word: "נָחָשׁ", emoji: "🐍" },
  { id: "samekh", char: "ס", name: "סָמֶךְ", word: "סוּס", emoji: "🐴" },
  { id: "ayin", char: "ע", name: "עַיִן", word: "עַכְבָּר", emoji: "🐭" },
  { id: "pe", char: "פ", name: "פֵּא", word: "פִּיל", emoji: "🐘" },
  { id: "tsadi", char: "צ", name: "צָדִי", word: "צָב", emoji: "🐢" },
  { id: "qof", char: "ק", name: "קוֹף", word: "קוֹף", emoji: "🐒" },
  { id: "resh", char: "ר", name: "רֵישׁ", word: "רַכֶּבֶת", emoji: "🚂" },
  { id: "shin", char: "ש", name: "שִׁין", word: "שֶׁמֶשׁ", emoji: "☀️" },
  { id: "tav", char: "ת", name: "תָּו", word: "תַּפּוּחַ", emoji: "🍎" },
  { id: "kaf-sofit", char: "ך", name: "כַּף סוֹפִית", word: "מֶלֶךְ", emoji: "👑", final: true },
  { id: "mem-sofit", char: "ם", name: "מֵם סוֹפִית", word: "יָם", emoji: "🌊", final: true },
  { id: "nun-sofit", char: "ן", name: "נוּן סוֹפִית", word: "בַּלּוֹן", emoji: "🎈", final: true },
  { id: "pe-sofit", char: "ף", name: "פֵּא סוֹפִית", word: "כַּף", emoji: "🥄", final: true },
  { id: "tsadi-sofit", char: "ץ", name: "צָדִי סוֹפִית", word: "עֵץ", emoji: "🌳", final: true },
];

export const LETTER_BY_ID = Object.fromEntries(LETTERS.map((l) => [l.id, l])) as Record<string, Letter>;

/** Letters kids commonly mix up by shape. Used to pick tricky distractors once both are learned. */
export const CONFUSABLE: string[][] = [
  ["bet", "kaf"],
  ["dalet", "resh", "kaf-sofit"],
  ["he", "het", "tav"],
  ["vav", "zayin", "nun-sofit"],
  ["gimel", "nun"],
  ["samekh", "mem-sofit"],
  ["ayin", "tsadi"],
  ["tet", "mem"],
];

export type LetterStation = {
  id: string;
  /** Title spoken / shown on the station. */
  title: string;
  letterIds: string[];
};

// Alphabet order in small groups: a placeholder until mom's teaching order arrives.
export const LETTER_STATIONS: LetterStation[] = [
  { id: "s1", title: "א ב ג ד", letterIds: ["alef", "bet", "gimel", "dalet"] },
  { id: "s2", title: "ה ו ז ח", letterIds: ["he", "vav", "zayin", "het"] },
  { id: "s3", title: "ט י כ ל", letterIds: ["tet", "yod", "kaf", "lamed"] },
  { id: "s4", title: "מ נ ס ע", letterIds: ["mem", "nun", "samekh", "ayin"] },
  { id: "s5", title: "פ צ ק ר", letterIds: ["pe", "tsadi", "qof", "resh"] },
  { id: "s6", title: "ש ת", letterIds: ["shin", "tav"] },
  { id: "s7", title: "ך ם ן ף ץ", letterIds: ["kaf-sofit", "mem-sofit", "nun-sofit", "pe-sofit", "tsadi-sofit"] },
];

/** Letters introduced in this station and every station before it. */
export function lettersUpTo(stationId: string): string[] {
  const idx = LETTER_STATIONS.findIndex((s) => s.id === stationId);
  return LETTER_STATIONS.slice(0, idx + 1).flatMap((s) => s.letterIds);
}
