// 🔎 Letter hunt: a picture scene (a kitchen, a park, the sea) full of things; "what starts with מ?"
// 2–3 things in the scene start with the letter, among about 8. Tapping a thing says its name.
// DRAFT words (mom to check): only objects whose emoji is clear to a 5-year-old, and only words that start
// with the letter's usual sound (word-initial בּ כּ פּ always have the dot, so ב says "b" here).
//
// Positions are in % of the scene (x from the left, y from the top), placed by hand so nothing overlaps.

import { shuffle } from "../lib/random.ts";
import { LETTER_BY_ID, LETTER_STATIONS, LETTERS, lettersUpTo, soundsAlike } from "./letters.ts";

export type SceneObject = {
  id: string;
  emoji: string;
  /** The word with full nikud. */
  word: string;
  /** The letter it starts with. */
  letter: string;
  x: number;
  y: number;
};

export type Scene = { id: "kitchen" | "park" | "sea"; label: string; objects: SceneObject[] };

const o = (id: string, emoji: string, word: string, letter: string, x: number, y: number): SceneObject => ({
  id,
  emoji,
  word,
  letter,
  x,
  y,
});

export const SCENES: Scene[] = [
  {
    id: "kitchen",
    label: "מִטְבָּח",
    objects: [
      // On the shelf.
      o("honey", "🍯", "דְּבַשׁ", "dalet", 12, 17),
      o("salt", "🧂", "מֶלַח", "mem", 31, 17),
      o("milk", "🥛", "חָלָב", "het", 50, 17),
      o("butter", "🧈", "חֶמְאָה", "het", 69, 17),
      o("cheese", "🧀", "גְּבִינָה", "gimel", 88, 17),
      // On the counter.
      o("bread", "🍞", "לֶחֶם", "lamed", 9, 50),
      o("banana", "🍌", "בָּנָנָה", "bet", 25, 50),
      o("egg", "🥚", "בֵּיצָה", "bet", 41, 50),
      o("carrot", "🥕", "גֶּזֶר", "gimel", 57, 50),
      o("lemon", "🍋", "לִימוֹן", "lamed", 73, 50),
      o("spoon", "🥄", "כַּף", "kaf", 89, 50),
      // On the table.
      o("apple", "🍎", "תַּפּוּחַ", "tav", 9, 82),
      o("strawberry", "🍓", "תּוּת", "tav", 25, 82),
      o("cucumber", "🥒", "מְלָפְפוֹן", "mem", 41, 82),
      o("grapes", "🍇", "עֲנָבִים", "ayin", 57, 82),
      o("cake", "🍰", "עוּגָה", "ayin", 73, 82),
      o("pizza", "🍕", "פִּיצָה", "pe", 89, 82),
    ],
  },
  {
    id: "park",
    label: "גִּנָּה",
    objects: [
      // In the sky.
      o("sun", "☀️", "שֶׁמֶשׁ", "shin", 10, 13),
      o("cloud", "☁️", "עָנָן", "ayin", 30, 13),
      o("rainbow", "🌈", "קֶשֶׁת", "qof", 50, 13),
      o("bird", "🐦", "צִפּוֹר", "tsadi", 70, 13),
      o("balloon", "🎈", "בַּלּוֹן", "bet", 90, 13),
      // In the air, and the tree.
      o("butterfly", "🦋", "פַּרְפַּר", "pe", 18, 38),
      o("bee", "🐝", "דְּבוֹרָה", "dalet", 42, 38),
      o("tree", "🌳", "עֵץ", "ayin", 68, 38),
      // On the grass.
      o("dog", "🐶", "כֶּלֶב", "kaf", 10, 63),
      o("cat", "🐱", "חָתוּל", "het", 30, 63),
      o("ball", "⚽", "כַּדּוּר", "kaf", 50, 63),
      o("flower", "🌸", "פֶּרַח", "pe", 70, 63),
      o("duck", "🦆", "בַּרְוָז", "bet", 90, 63),
      o("snail", "🐌", "חִלָּזוֹן", "het", 20, 86),
      o("frog", "🐸", "צְפַרְדֵּעַ", "tsadi", 46, 86),
      o("ant", "🐜", "נְמָלָה", "nun", 72, 86),
    ],
  },
  {
    id: "sea",
    label: "יָם",
    objects: [
      // Sky and sea.
      o("sun", "☀️", "שֶׁמֶשׁ", "shin", 88, 11),
      o("boat", "⛵", "סִירָה", "samekh", 30, 16),
      o("dolphin", "🐬", "דּוֹלְפִין", "dalet", 10, 39),
      o("whale", "🐋", "לַוְיָתָן", "lamed", 37, 39),
      o("shark", "🦈", "כָּרִישׁ", "kaf", 64, 39),
      o("turtle", "🐢", "צָב", "tsadi", 90, 39),
      o("octopus", "🐙", "תְּמָנוּן", "tav", 18, 60),
      o("fish", "🐟", "דָּג", "dalet", 46, 60),
      o("anchor", "⚓", "עֹגֶן", "ayin", 74, 60),
      // On the sand.
      o("crab", "🦀", "סַרְטָן", "samekh", 10, 85),
      o("shell", "🐚", "צֶדֶף", "tsadi", 29, 85),
      o("bucket", "🪣", "דְּלִי", "dalet", 48, 85),
      o("umbrella", "⛱️", "שִׁמְשִׁיָּה", "shin", 68, 85),
      o("icecream", "🍦", "גְּלִידָה", "gimel", 88, 85),
    ],
  },
];

/**
 * The audio id of a thing's name: the letters world's word when it is the same word (already recorded),
 * otherwise its own line, `hunt-<id>` (the sun appears in two scenes and has one line).
 */
export function huntWordId(obj: SceneObject): string {
  const same = LETTERS.find((l) => l.word === obj.word);
  return same ? `word-${same.id}` : `hunt-${obj.id}`;
}

/** The scene words that need a voice line of their own (one per word). */
export function huntWordLines(): { id: string; text: string }[] {
  const seen = new Map<string, string>();
  for (const s of SCENES) for (const obj of s.objects) if (!huntWordId(obj).startsWith("word-")) seen.set(huntWordId(obj), obj.word);
  return [...seen].map(([id, text]) => ({ id, text }));
}

export type HuntRound = { key: string; scene: Scene["id"]; target: string; objects: SceneObject[] };

/** Letters with at least 2 things in this scene (enough for a hunt). */
function huntableLetters(scene: Scene): string[] {
  const count = new Map<string, number>();
  for (const obj of scene.objects) count.set(obj.letter, (count.get(obj.letter) ?? 0) + 1);
  return [...count].filter(([, n]) => n >= 2).map(([id]) => id);
}

/**
 * One hunt per scene (up to 3): the target is a letter of this station when the scene has enough things for it,
 * otherwise a letter learned before; never the same letter in two scenes. 2–3 targets among 8 things.
 * Things that start with a sound-alike letter (ט/ת, כּ/ק, א/ע) are left out: tapping them can't be "wrong".
 */
export function buildHuntRounds(stationId: string, size = 8): HuntRound[] {
  const station = LETTER_STATIONS.find((s) => s.id === stationId)!;
  const known = lettersUpTo(stationId).filter((id) => !LETTER_BY_ID[id].final);
  const own = station.letterIds.filter((id) => !LETTER_BY_ID[id].final);
  const used: string[] = [];
  const rounds: HuntRound[] = [];
  // Scenes with the fewest letters to hunt pick first, so each scene still finds a letter of its own.
  const options = (sc: Scene) => huntableLetters(sc).filter((id) => known.includes(id)).length;
  for (const scene of shuffle(SCENES).sort((a, b) => options(a) - options(b))) {
    const ok = huntableLetters(scene).filter((id) => known.includes(id) && !used.includes(id));
    const mine = ok.filter((id) => own.includes(id));
    const pool = mine.length ? mine : ok;
    if (!pool.length) continue;
    const target = shuffle(pool)[0];
    used.push(target);
    const hits = shuffle(scene.objects.filter((x) => x.letter === target)).slice(0, 3);
    const rest = shuffle(scene.objects.filter((x) => x.letter !== target && !soundsAlike(x.letter, target)));
    rounds.push({ key: `h-${scene.id}`, scene: scene.id, target, objects: [...hits, ...rest.slice(0, size - hits.length)] });
  }
  return rounds;
}

/** Shown in the menu only when there are at least 2 scenes to hunt in. */
export function hasHunt(stationId: string): boolean {
  return buildHuntRounds(stationId).length >= 2;
}
