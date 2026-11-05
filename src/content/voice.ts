// Every line the guide says. Each line becomes one audio file: public/audio/<id>.m4a.
// Pipeline: generate (placeholder voice now, mom's ElevenLabs voice later) → mom approves → frozen.
// Gendered lines exist twice: <id>-m and <id>-f.

import { KAMATZ, READ_WORDS, SYLLABLES } from "./kamatz.ts";
import { LETTERS } from "./letters.ts";
import { NAMES } from "./names.ts";
import type { Gender } from "./worlds.ts";

export type VoiceLine = {
  id: string;
  /** What the caption shows. */
  text: string;
  group: string;
  /** What the voice reads, when it differs from the caption (e.g. a bare syllable). */
  spoken?: string;
};

// Rule (founder feedback, 4 Nov): talk less, show more. One instruction ≤ ~5 words;
// a pointing hand and sounds do the explaining. Intros are said once per session (see Guide `once`).
const gendered: Record<string, { m: string; f: string }> = {
  "bubbles-intro": { m: "פּוֹצֵץ אֶת הַבּוּעוֹת שֶׁל", f: "פּוֹצְצִי אֶת הַבּוּעוֹת שֶׁל" },
  "try-again": { m: "נַסֵּה שׁוּב", f: "נַסִּי שׁוּב" },
  // "עַכְשָׁו אַתָּה" came out slurred in every take; "תּוֹרְךָ" is clear (4 Nov).
  "your-turn": { m: "תּוֹרְךָ!", f: "תּוֹרֵךְ!" },
  champ: { m: "אַלּוּף!", f: "אַלּוּפָה!" },
  "station-done": { m: "סִיַּמְתָּ! כָּל הַכָּבוֹד!", f: "סִיַּמְתְּ! כָּל הַכָּבוֹד!" },
  // Free writing (🖍️ round), followed by the letter's name.
  "write-free": { m: "כְּתֹב אֶת הָאוֹת", f: "כִּתְבִי אֶת הָאוֹת" },
  // ✍️ Write my name: the intro, then at the end "you wrote the name!" + the child's name (if we have it).
  "name-intro": { m: "כְּתֹב אֶת הַשֵּׁם שֶׁלְּךָ!", f: "כִּתְבִי אֶת הַשֵּׁם שֶׁלָּךְ!" },
  "name-done": { m: "כָּתַבְתָּ אֶת הַשֵּׁם!", f: "כָּתַבְתְּ אֶת הַשֵּׁם!" },
  "pick-buddy": { m: "בְּחַר חָבֵר לַמַּסָּע!", f: "בַּחֲרִי חָבֵר לַמַּסָּע!" },
  "memory-intro": { m: "מְצָא זוּגוֹת!", f: "מִצְאִי זוּגוֹת!" },
  "pick-game": { m: "בְּחַר מִשְׂחָק!", f: "בַּחֲרִי מִשְׂחָק!" },
  "ready-daily": { m: "מוּכָן לָאִמּוּן הַיּוֹמִי?", f: "מוּכָנָה לָאִמּוּן הַיּוֹמִי?" },
  "kp-world": {
    m: "בָּרוּךְ הַבָּא לְעוֹלַם הַקָּמָץ וְהַפַּתָּח! כָּאן הָאוֹתִיּוֹת מַתְחִילוֹת לְדַבֵּר.",
    f: "בְּרוּכָה הַבָּאָה לְעוֹלַם הַקָּמָץ וְהַפַּתָּח! כָּאן הָאוֹתִיּוֹת מַתְחִילוֹת לְדַבֵּר.",
  },
  "builder-intro": {
    m: "לְחַץ עַל הַקָּמָץ, וְהוּא יִקְפֹּץ מִתַּחַת לָאוֹת. נִשְׁמַע מָה יוֹצֵא!",
    f: "לַחֲצִי עַל הַקָּמָץ, וְהוּא יִקְפֹּץ מִתַּחַת לָאוֹת. נִשְׁמַע מָה יוֹצֵא!",
  },
  "syl-find-intro": {
    m: "עַכְשָׁו אֲנִי אוֹמֶרֶת צְלִיל, וְאַתָּה מוֹצֵא אוֹתוֹ.",
    f: "עַכְשָׁו אֲנִי אוֹמֶרֶת צְלִיל, וְאַתְּ מוֹצֵאת אוֹתוֹ.",
  },
  "read-intro": {
    m: "עַכְשָׁו אַתָּה קוֹרֵא לְבַד! קְרָא אֶת הַמִּלָּה, וּבְחַר אֶת הַתְּמוּנָה.",
    f: "עַכְשָׁו אַתְּ קוֹרֵאת לְבַד! קִרְאִי אֶת הַמִּלָּה, וּבַחֲרִי אֶת הַתְּמוּנָה.",
  },
  "learn-words-intro": {
    m: "בּוֹא נִקְרָא מִלִּים רִאשׁוֹנוֹת. לְחַץ עַל כָּל חֵלֶק, וְאַחַר כָּךְ עַל כָּל הַמִּלָּה.",
    f: "בּוֹאִי נִקְרָא מִלִּים רִאשׁוֹנוֹת. לַחֲצִי עַל כָּל חֵלֶק, וְאַחַר כָּךְ עַל כָּל הַמִּלָּה.",
  },
};

const neutral: Record<string, string> = {
  welcome: "שָׁלוֹם! אֲנִי הַמּוֹרָה. יוֹצְאִים לְמַסָּע!",
  "map-pick": "לְאָן הַיּוֹם?",
  "letters-map": "עוֹלַם הָאוֹתִיּוֹת!",
  "nikud-map": "עוֹלַם הַנִּקּוּד!",
  "meet-intro": "אוֹתִיּוֹת חֲדָשׁוֹת!",
  "find-prompt": "אֵיפֹה הָאוֹת",
  like: "כְּמוֹ",
  "here-it-is": "הִנֵּה הִיא!",
  "praise-1": "יֹפִי!",
  "praise-2": "כָּל הַכָּבוֹד!",
  "praise-3": "מְצֻיָּן!",
  "praise-4": "וָאוּ!",
  "praise-5": "בְּדִיּוּק!",
  locked: "עוֹד סָגוּר!",
  "starts-prompt": "מָה מַתְחִיל בָּאוֹת",
  "ends-prompt": "מָה נִגְמָר בָּאוֹת",
  "write-watch": "כָּכָה כּוֹתְבִים",
  "write-alone": "עַכְשָׁו לְבַד!",
  "write-start-here": "מַתְחִילִים כָּאן!",
  "write-free-almost": "כִּמְעַט! עוֹד פַּעַם",
  notebook: "אֵיזוֹ אוֹת נִכְתֹּב?",
  "chest-what": "מָה יֵשׁ בִּפְנִים?",
  "review-intro": "יוֹצְאִים לָאִמּוּן הַיּוֹמִי!",
  // Greeting by time of day, then the child's name (recorded by a parent, on the device only).
  "good-morning": "בֹּקֶר טוֹב!",
  "good-noon": "צָהֳרַיִם טוֹבִים!",
  "good-evening": "עֶרֶב טוֹב!",
  // Explaining a wrong tap (founder, 5 Nov): "כִּמְעַט! קוֹף מַתְחִיל בָּאוֹת קוֹף. נַסֵּה שׁוּב".
  almost: "כִּמְעַט!",
  "this-is": "זֹאת",
  "it-is": "זֶה",
  "starts-like-m": "מַתְחִיל בַּצְּלִיל",
  "starts-like-f": "מַתְחִילָה בַּצְּלִיל",
  "starts-with-m": "מַתְחִיל בָּאוֹת",
  "starts-with-f": "מַתְחִילָה בָּאוֹת",
  "ends-with-m": "נִגְמָר בָּאוֹת",
  "ends-with-f": "נִגְמֶרֶת בָּאוֹת",
  "mix-intro": "כָּל הָאוֹתִיּוֹת בְּיַחַד!",
  "buddy-gift": "וְגַם מַתָּנָה לֶחָבֵר!",
  "here-word": "הִנֵּה!",
  // The tour right after picking the buddy (once per child), and a hero joining at a milestone.
  "tour-friend": "הִנֵּה הֶחָבֵר לַמַּסָּע!",
  "tour-surprise": "בְּכָל תַּחֲנָה הַפְתָּעָה!",
  "tour-heroes": "וְעוֹד חֲבֵרִים מְחַכִּים!",
  "tour-go": "יוֹצְאִים לַדֶּרֶךְ!",
  "new-hero": "חָבֵר חָדָשׁ הִצְטָרֵף!",
  // Games menu: quiz show, wheel of luck, surprise boxes.
  "show-intro": "מַתְחִילִים אֶת הַשַּׁעֲשׁוּעוֹן!",
  "show-end": "אֵיזוֹ הוֹפָעָה!",
  "wheel-intro": "מְסוֹבְבִים אֶת הַגַּלְגַּל!",
  "box-intro": "פּוֹתְחִים תֵּבָה!",
  "box-which": "מָה הָאוֹת הָרִאשׁוֹנָה?",
  "box-which-end": "מָה הָאוֹת הָאַחֲרוֹנָה?",
  // Kamatz/patach world (paused; to be reworked with mom).
  where: "אֵיפֹה",
  "kamatz-is": "זֶה קָמָץ: קַו, וּמִתַּחְתָּיו נְקֻדָּה קְטַנָּה.",
  "patach-is": "וְזֶה פַּתָּח: רַק קַו.",
  "both-say-a": "קָמָץ וּפַתָּח אוֹמְרִים אוֹתוֹ דָּבָר: אָ!",
  "syl-starts-prompt": "אֵיזוֹ מִלָּה מַתְחִילָה כְּמוֹ",
  "read-prompt": "מָה כָּתוּב כָּאן?",
  "it-says": "כָּתוּב",
  "here-sound": "הִנֵּה! זֶה הַצְּלִיל",
};

export const VOICE_LINES: VoiceLine[] = [
  ...Object.entries(gendered).flatMap(([id, v]) => [
    { id: `${id}-m`, text: v.m, group: "guide" },
    { id: `${id}-f`, text: v.f, group: "guide" },
  ]),
  ...Object.entries(neutral).map(([id, text]) => ({ id, text, group: "guide" })),
  ...LETTERS.map((l) => ({ id: `letter-${l.id}`, text: l.name, group: "letter" })),
  ...LETTERS.map((l) => ({ id: `word-${l.id}`, text: l.word, group: "word" })),
  ...SYLLABLES.map((x) => ({ id: `syl-${x.id}`, text: x.base + KAMATZ, group: "syllable" })),
  ...SYLLABLES.flatMap((x) =>
    x.starts && !LETTERS.some((l) => l.word === x.starts!.word)
      ? [{ id: `sw-${x.id}`, text: x.starts.word, group: "word" }]
      : [],
  ),
  ...READ_WORDS.map((w) => ({ id: `rw-${w.id}`, text: w.word, group: "read" })),
  ...NAMES.map((n) => ({ id: `name-${n.id}`, text: `${n.text}!`, group: "name" })),
];

/** Audio id of the picture word that starts like this syllable (reuses the letters-world word when it is the same). */
export function startsWordId(syllableId: string): string {
  const x = SYLLABLES.find((s) => s.id === syllableId)!;
  const same = LETTERS.find((l) => l.word === x.starts?.word);
  return same ? `word-${same.id}` : `sw-${x.id}`;
}

export const VOICE_BY_ID = Object.fromEntries(VOICE_LINES.map((l) => [l.id, l])) as Record<string, VoiceLine>;

/** Resolves a line id for this child: gendered ids get the -m / -f suffix. */
export function line(id: string, gender: Gender): string {
  return id in gendered ? `${id}-${gender}` : id;
}

export const PRAISE = ["praise-1", "praise-2", "praise-3", "praise-4", "praise-5", "champ"];
