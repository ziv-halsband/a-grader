// Every line the guide says. Each line becomes one audio file: public/audio/<id>.m4a.
// Pipeline: generate (placeholder voice now, mom's ElevenLabs voice later) → mom approves → frozen.
// Gendered lines exist twice: <id>-m and <id>-f.

import { LETTERS } from "./letters.ts";
import type { Gender } from "./worlds.ts";

export type VoiceLine = { id: string; text: string; group: string };

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
};

export const VOICE_LINES: VoiceLine[] = [
  ...Object.entries(gendered).flatMap(([id, v]) => [
    { id: `${id}-m`, text: v.m, group: "guide" },
    { id: `${id}-f`, text: v.f, group: "guide" },
  ]),
  ...Object.entries(neutral).map(([id, text]) => ({ id, text, group: "guide" })),
  ...LETTERS.map((l) => ({ id: `letter-${l.id}`, text: l.name, group: "letter" })),
  ...LETTERS.map((l) => ({ id: `word-${l.id}`, text: l.word, group: "word" })),
];

export const VOICE_BY_ID = Object.fromEntries(VOICE_LINES.map((l) => [l.id, l])) as Record<string, VoiceLine>;

/** Resolves a line id for this child: gendered ids get the -m / -f suffix. */
export function line(id: string, gender: Gender): string {
  return id in gendered ? `${id}-${gender}` : id;
}

export const PRAISE = ["praise-1", "praise-2", "praise-3", "champ"];
