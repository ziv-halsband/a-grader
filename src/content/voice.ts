// Every line the guide says. Each line becomes one audio file: public/audio/<id>.m4a.
// Pipeline: generate (placeholder voice now, mom's ElevenLabs voice later) → mom approves → frozen.
// Gendered lines exist twice: <id>-m and <id>-f.

import { KAMATZ, READ_WORDS, SYLLABLES } from "./kamatz.ts";
import { LETTERS } from "./letters.ts";
import type { Gender } from "./worlds.ts";

export type VoiceLine = {
  id: string;
  /** What the caption shows. */
  text: string;
  group: string;
  /** What the voice reads, when it differs from the caption (e.g. a bare syllable). */
  spoken?: string;
};

const gendered: Record<string, { m: string; f: string }> = {
  welcome: {
    m: "שָׁלוֹם! אֲנִי הַמּוֹרָה. בּוֹא נֵצֵא יַחַד לְמַסָּע שֶׁל קְרִיאָה!",
    f: "שָׁלוֹם! אֲנִי הַמּוֹרָה. בּוֹאִי נֵצֵא יַחַד לְמַסָּע שֶׁל קְרִיאָה!",
  },
  "map-pick": {
    m: "לְאָן נוֹסְעִים הַיּוֹם? לְחַץ עַל הַתַּחֲנָה שֶׁמְּחַכָּה לְךָ.",
    f: "לְאָן נוֹסְעִים הַיּוֹם? לַחֲצִי עַל הַתַּחֲנָה שֶׁמְּחַכָּה לָךְ.",
  },
  "letters-map": {
    m: "בָּרוּךְ הַבָּא לְעוֹלַם הָאוֹתִיּוֹת! בְּכָל תַּחֲנָה נַכִּיר אוֹתִיּוֹת חֲדָשׁוֹת.",
    f: "בְּרוּכָה הַבָּאָה לְעוֹלַם הָאוֹתִיּוֹת! בְּכָל תַּחֲנָה נַכִּיר אוֹתִיּוֹת חֲדָשׁוֹת.",
  },
  "meet-intro": {
    m: "בּוֹא נַכִּיר אוֹתִיּוֹת חֲדָשׁוֹת. לְחַץ עַל הָאוֹת כְּדֵי לִשְׁמֹעַ אוֹתָהּ שׁוּב.",
    f: "בּוֹאִי נַכִּיר אוֹתִיּוֹת חֲדָשׁוֹת. לַחֲצִי עַל הָאוֹת כְּדֵי לִשְׁמֹעַ אוֹתָהּ שׁוּב.",
  },
  "find-intro": {
    m: "עַכְשָׁו מִשְׂחָק! אֲנִי אוֹמֶרֶת אוֹת, וְאַתָּה מוֹצֵא אוֹתָהּ.",
    f: "עַכְשָׁו מִשְׂחָק! אֲנִי אוֹמֶרֶת אוֹת, וְאַתְּ מוֹצֵאת אוֹתָהּ.",
  },
  "bubbles-intro": {
    m: "פּוֹצֵץ אֶת כָּל הַבּוּעוֹת שֶׁל הָאוֹת",
    f: "פּוֹצְצִי אֶת כָּל הַבּוּעוֹת שֶׁל הָאוֹת",
  },
  "try-again": { m: "כִּמְעַט! נַסֵּה שׁוּב.", f: "כִּמְעַט! נַסִּי שׁוּב." },
  "your-turn": { m: "עַכְשָׁו אַתָּה.", f: "עַכְשָׁו אַתְּ." },
  champ: { m: "אַלּוּף!", f: "אַלּוּפָה!" },
  sticker: { m: "קִבַּלְתָּ מַדְבֵּקָה חֲדָשָׁה!", f: "קִבַּלְתְּ מַדְבֵּקָה חֲדָשָׁה!" },
  "starts-intro": {
    m: "עַכְשָׁו מִשְׂחַק תְּמוּנוֹת! תַּגִּיד בְּשֶׁקֶט אֶת שֵׁם הַתְּמוּנָה, וְתַקְשִׁיב אֵיךְ הִיא מַתְחִילָה.",
    f: "עַכְשָׁו מִשְׂחַק תְּמוּנוֹת! תַּגִּידִי בְּשֶׁקֶט אֶת שֵׁם הַתְּמוּנָה, וְתַקְשִׁיבִי אֵיךְ הִיא מַתְחִילָה.",
  },
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
  "station-done": {
    m: "סִיַּמְתָּ אֶת הַתַּחֲנָה! אֶפְשָׁר לְשַׂחֵק שׁוּב, אוֹ לְהַמְשִׁיךְ הָלְאָה.",
    f: "סִיַּמְתְּ אֶת הַתַּחֲנָה! אֶפְשָׁר לְשַׂחֵק שׁוּב, אוֹ לְהַמְשִׁיךְ הָלְאָה.",
  },
};

const neutral: Record<string, string> = {
  "find-prompt": "אֵיפֹה הָאוֹת",
  like: "כְּמוֹ",
  "here-it-is": "הִנֵּה הִיא! זֹאת הָאוֹת",
  "not-this": "זֹאת לֹא הָאוֹת. נְחַפֵּשׂ עוֹד.",
  "praise-1": "יֹפִי!",
  "praise-2": "כָּל הַכָּבוֹד!",
  "praise-3": "מְצֻיָּן!",
  locked: "הַתַּחֲנָה הַזֹּאת עוֹד סְגוּרָה. נִפְתַּח אוֹתָהּ בְּקָרוֹב!",
  "starts-prompt": "אֵיזוֹ מִלָּה מַתְחִילָה בָּאוֹת",
  "ends-prompt": "אֵיזוֹ מִלָּה נִגְמֶרֶת בָּאוֹת",
  where: "אֵיפֹה",
  "kamatz-is": "זֶה קָמָץ: קַו, וּמִתַּחְתָּיו נְקֻדָּה קְטַנָּה.",
  "patach-is": "וְזֶה פַּתָּח: רַק קַו.",
  "both-say-a": "קָמָץ וּפַתָּח אוֹמְרִים אוֹתוֹ דָּבָר: אָ!",
  "syl-starts-prompt": "אֵיזוֹ מִלָּה מַתְחִילָה כְּמוֹ",
  "read-prompt": "מָה כָּתוּב כָּאן?",
  "it-says": "כָּתוּב",
  "here-word": "הִנֵּה! זֹאת הַמִּלָּה",
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

export const PRAISE = ["praise-1", "praise-2", "praise-3", "champ"];
