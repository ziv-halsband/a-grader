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

/** Vowels allowed in a world: its own and every world's before it. */
export function allowedVowels(world: Vowel): Set<Vowel> {
  return new Set(VOWEL_ORDER.slice(0, VOWEL_ORDER.indexOf(world) + 1));
}

/** Problems of one sentence for a world (empty = decodable). */
export function checkText(text: string, world: Vowel): string[] {
  const allowed = allowedVowels(world);
  return text
    .split(/\s+/)
    .filter((w) => w.replace(PUNCT, ""))
    .flatMap((w) => {
      const { vowels, problems } = analyzeWord(w);
      const extra = [...vowels].filter((v) => !allowed.has(v));
      return [...problems, ...extra.map((v) => `uses ${v}`)].map((p) => `"${w}": ${p}`);
    });
}

/** Does this text use the world's own new vowel at least once? */
export function usesVowel(text: string, vowel: Vowel): boolean {
  return text.split(/\s+/).some((w) => analyzeWord(w).vowels.has(vowel));
}
