// The whole adventure: every topic of mom's grade-1 year, as stations on one map.
// DRAFT order: replaced by mom's year map (docs/01-year-map.md).
// The vowels are grouped in one "נִקּוּד" station; tapping it opens a small map with every vowel world.

export type Topic = {
  id: string;
  title: string;
  /** Short line for parents: what the child can do after this topic. */
  goal: string;
  icon: string;
  href?: string;
};

/** Every vowel world, in teaching order (content: content/nikud.ts; screens: /play/nikud/<id>). */
export const NIKUD_TOPICS: Topic[] = ([
  { id: "kamatz-patach", title: "קָמָץ וּפַתָּח", goal: "קורא צירופים עם קמץ ופתח", icon: "בָּ" },
  { id: "tsere-segol", title: "צֵירֵה וְסֶגּוֹל", goal: "קורא צירופים עם צירה וסגול", icon: "בֵּ" },
  { id: "hiriq", title: "חִירִיק", goal: "קורא צירופים עם חיריק", icon: "בִּ" },
  { id: "holam", title: "חוֹלָם", goal: "קורא צירופים עם חולם", icon: "בֹּ" },
  { id: "shuruk-kubutz", title: "שׁוּרוּק וְקֻבּוּץ", goal: "קורא צירופים עם שורוק וקובוץ", icon: "בּוּ" },
  { id: "shva", title: "שְׁוָא", goal: "קורא מילים עם שווא", icon: "בְּ" },
] as Topic[]).map((t) => ({ ...t, href: `/play/nikud/${t.id}` }));

/**
 * The big map: 3 chapters (founder, 6 Nov). Each nikud world already teaches syllables → words → short stories,
 * so there are no separate "words", "sentences" or "stories" topics; /play/stories stays as an all-shelves page.
 */
export const TOPICS: Topic[] = [
  { id: "letters", title: "מַכִּירִים אוֹתִיּוֹת", goal: "מזהה את כל האותיות, כולל סופיות", icon: "אב", href: "/play/letters" },
  { id: "nikud", title: "נִקּוּד", goal: "קורא צירופים, מילים וסיפורים קצרים בכל הניקוד", icon: "בָּ", href: "/play/nikud" },
  { id: "i-read", title: "אֲנִי קוֹרֵא", goal: "קורא ספרונים לבד", icon: "📗", href: "/play/i-read" },
];
