// Is a Hebrew word decodable with the vowels taught so far? (content/stories.ts)
// Pure, no imports: used by e2e/stories.spec.ts and scripts/gen-story-audio.ts (refuses to spend credits on a bad story).
//
// Every letter must carry a vowel (full nikud), except:
//   - the last letter of the word ("דָּג", "דָּנָה");
//   - a letter right before a vowel-vav (holam male וֹ, shuruk וּ): "יוֹם", "כַּדּוּר";
//   - a yod after ִ ֵ ֶ (hiriq/tsere male): "פִּיל", "בֵּיצָה";
//   - a silent alef after a vowel: "קוֹרֵאת", "פִּתְאוֹם".
// Every ש needs its shin or sin dot.

export type Vowel = "kamatz-patach" | "tsere-segol" | "hiriq" | "holam" | "shuruk-kubutz" | "shva";

/** Teaching order (NIKUD_TOPICS): a world allows its own vowels and every vowel before it. */
export const VOWEL_ORDER: Vowel[] = ["kamatz-patach", "tsere-segol", "hiriq", "holam", "shuruk-kubutz", "shva"];

const MARK: Record<string, Vowel> = {
  "ְ": "shva",
  "ֱ": "shva", // hataf segol
  "ֲ": "shva", // hataf patach
  "ֳ": "shva", // hataf kamatz
  "ִ": "hiriq",
  "ֵ": "tsere-segol",
  "ֶ": "tsere-segol",
  "ַ": "kamatz-patach",
  "ָ": "kamatz-patach",
  "ֹ": "holam",
  "ֺ": "holam", // holam haser for vav
  "ֻ": "shuruk-kubutz",
};
const DAGESH = "ּ";
const SHIN_DOT = "ׁ";
const SIN_DOT = "ׂ";
const LETTER = /[א-ת]/;
/** Punctuation a story may use (stripped before checking). */
const PUNCT = /[!?.,:;…"'״׳()\-–]/g;

type Cluster = { letter: string; marks: string[]; vowels: Vowel[] };

function clusters(word: string): { list: Cluster[]; bad: string[] } {
  const list: Cluster[] = [];
  const bad: string[] = [];
  for (const ch of word) {
    if (LETTER.test(ch)) list.push({ letter: ch, marks: [], vowels: [] });
    else if (MARK[ch] || ch === DAGESH || ch === SHIN_DOT || ch === SIN_DOT) {
      const c = list.at(-1);
      if (!c) bad.push(`mark before any letter`);
      else {
        c.marks.push(ch);
        if (MARK[ch]) c.vowels.push(MARK[ch]);
      }
    } else bad.push(`unexpected character "${ch}" (U+${ch.codePointAt(0)!.toString(16).toUpperCase()})`);
  }
  return { list, bad };
}

/** A vav that is itself the vowel: וֹ (holam male) or וּ (shuruk). */
function vowelVav(c: Cluster | undefined): Vowel | null {
  if (!c || c.letter !== "ו") return null;
  const others = c.vowels.filter((v) => v !== "holam");
  if (c.vowels.includes("holam") && !others.length) return "holam";
  if (c.marks.includes(DAGESH) && !c.vowels.length) return "shuruk-kubutz";
  return null;
}

/** The vowels a word uses, and what's wrong with its nikud (empty = fine). */
export function analyzeWord(raw: string): { vowels: Set<Vowel>; problems: string[] } {
  const word = raw.replace(PUNCT, "");
  const { list, bad } = clusters(word);
  const problems = [...bad];
  const vowels = new Set<Vowel>();
  list.forEach((c, i) => {
    const vav = vowelVav(c);
    if (vav) {
      vowels.add(vav);
      return;
    }
    c.vowels.forEach((v) => vowels.add(v));
    if (c.vowels.length > 1) problems.push(`${c.letter} has two vowels`);
    if (c.letter === "ש" && !c.marks.includes(SHIN_DOT) && !c.marks.includes(SIN_DOT)) problems.push(`ש without its dot`);
    if (c.vowels.length) return;
    const prev = list[i - 1];
    const last = i === list.length - 1;
    const beforeVav = !!vowelVav(list[i + 1]);
    const materYod = c.letter === "י" && !!prev?.vowels.some((v) => v === "hiriq" || v === "tsere-segol") && !vowelVav(prev);
    const silentAlef = c.letter === "א" && !!prev && (prev.vowels.length > 0 || !!vowelVav(prev));
    if (!last && !beforeVav && !materYod && !silentAlef) problems.push(`${c.letter} (letter ${i + 1}) has no vowel`);
  });
  if (!list.length) problems.push("no letters");
  return { vowels, problems };
}

/** A story shelf: a nikud world, or "all-nikud" (the last shelf: every vowel). */
export type VowelWorld = Vowel | "all-nikud";

/** Vowels allowed in a world: its own and every world's before it ("all-nikud": all of them). */
export function allowedVowels(world: VowelWorld): Set<Vowel> {
  if (world === "all-nikud") return new Set(VOWEL_ORDER);
  return new Set(VOWEL_ORDER.slice(0, VOWEL_ORDER.indexOf(world) + 1));
}

/** Problems of one sentence for a world (empty = decodable). */
export function checkText(text: string, world: VowelWorld): string[] {
  return checkAllowed(text, allowedVowels(world));
}

/** Problems of one sentence given the vowels a reader knows (empty = decodable). */
export function checkAllowed(text: string, allowed: Set<Vowel>): string[] {
  return text
    .split(/\s+/)
    .filter((w) => w.replace(PUNCT, ""))
    .flatMap((w) => {
      const { vowels, problems } = analyzeWord(w);
      const extra = [...vowels].filter((v) => !allowed.has(v));
      return [...problems, ...extra.map((v) => `uses ${v}`)].map((p) => `"${w}": ${p}`);
    });
}

/** The 9 vowel shapes a child learns to see (finer than Vowel: kamatz ≠ patach, shuruk ≠ kubutz). */
export const VOWEL_SHAPES = ["kamatz", "patach", "tsere", "segol", "hiriq", "holam", "shuruk", "kubutz", "shva"] as const;
export type VowelShape = (typeof VOWEL_SHAPES)[number];

const SHAPE: Record<string, VowelShape> = {
  "ָ": "kamatz",
  "ַ": "patach",
  "ֵ": "tsere",
  "ֶ": "segol",
  "ִ": "hiriq",
  "ֹ": "holam",
  "ֺ": "holam",
  "ֻ": "kubutz",
  "ְ": "shva",
};

/** Every vowel shape this text shows (holam male וֹ counts as holam, a vowel-vav וּ as shuruk). Hatafs don't count. */
export function vowelShapes(text: string): Set<VowelShape> {
  const out = new Set<VowelShape>();
  for (const raw of text.split(/\s+/)) {
    const { list } = clusters(raw.replace(PUNCT, ""));
    for (const c of list) {
      if (vowelVav(c) === "shuruk-kubutz") out.add("shuruk");
      for (const m of c.marks) if (SHAPE[m]) out.add(SHAPE[m]);
    }
  }
  return out;
}

/** Does this text use the world's own new vowel at least once? */
export function usesVowel(text: string, vowel: Vowel): boolean {
  return text.split(/\s+/).some((w) => analyzeWord(w).vowels.has(vowel));
}

// ── 📗 "אֲנִי קוֹרֵא" (content/library.ts): the library's reading stages ──────────────────────────────────
// DRAFT (mom): stage order from a published series; mom decides.
// It differs from the nikud worlds' order (VOWEL_ORDER): the shva comes first, with kamatz/patach.
// Each stage adds its vowels to every stage before it.

export type ReadingStage = {
  id: "a" | "b" | "c" | "d" | "e";
  title: string;
  /** The vowels this stage adds. */
  adds: Vowel[];
  /** The new marks, shown on the shelf (on a ב). */
  marks: string;
};

export const READING_STAGES: ReadingStage[] = [
  { id: "a", title: "שָׁלָב א׳", adds: ["kamatz-patach", "shva"], marks: "בָּ בַּ בְּ" },
  { id: "b", title: "שָׁלָב ב׳", adds: ["holam"], marks: "בֹּ בּוֹ" },
  { id: "c", title: "שָׁלָב ג׳", adds: ["hiriq"], marks: "בִּ בִּי" },
  { id: "d", title: "שָׁלָב ד׳", adds: ["tsere-segol"], marks: "בֵּ בֶּ" },
  { id: "e", title: "שָׁלָב ה׳", adds: ["shuruk-kubutz"], marks: "בּוּ בֻּ" },
];

export type StageId = ReadingStage["id"];

/** Vowels a reader knows at this stage: its own and every stage's before it. */
export function stageVowels(stage: StageId): Set<Vowel> {
  const i = READING_STAGES.findIndex((s) => s.id === stage);
  return new Set(READING_STAGES.slice(0, i + 1).flatMap((s) => s.adds));
}

/** Problems of one line for a library stage (empty = decodable). */
export function checkStage(text: string, stage: StageId): string[] {
  return checkAllowed(text, stageVowels(stage));
}
