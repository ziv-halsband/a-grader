// The child's buddy for the trip (inspired by Teach Your Monster to Read / Kriakala pets):
// picked by the child, sits in the corner of every game, reacts, and gets dressed with what the child earns.

export type Buddy = { id: string; emoji: string; name: string };

export const BUDDIES: Buddy[] = [
  { id: "fox", emoji: "🦊", name: "שׁוּעָל" },
  { id: "panda", emoji: "🐼", name: "פַּנְדָּה" },
  { id: "unicorn", emoji: "🦄", name: "חַד־קֶרֶן" },
  { id: "dragon", emoji: "🐲", name: "דְּרָקוֹן" },
  { id: "frog", emoji: "🐸", name: "צְפַרְדֵּעַ" },
  { id: "penguin", emoji: "🐧", name: "פִּינְגְּוִין" },
];

/**
 * Heroes: more friends who join the child at milestones (a review station, a whole world…). A hero is earned
 * when its `milestone` station is finished, so a child who finished it before heroes existed has it too.
 * To add one: a line here with the station key ("<world>/<station id>") and the `hint` shown on the locked
 * silhouette (the milestone station's own badge on the map).
 */
export type Hero = Buddy & { milestone: string; hint: string };

export const HEROES: Hero[] = [
  { id: "owl", emoji: "🦉", name: "יַנְשׁוּף", milestone: "letters/m1", hint: "🔀" },
  { id: "lion", emoji: "🦁", name: "אַרְיֵה", milestone: "letters/m2", hint: "🏆" },
  { id: "whale", emoji: "🐳", name: "לִוְיָתָן", milestone: "kamatz-patach/k5", hint: "בָּ" },
  // Next vowel world, e.g.: { id: "tiger", emoji: "🐯", name: "טִיגְרִיס", milestone: "tsere-segol/<last>", hint: "בֵּ" },
];

export const BUDDY_BY_ID = Object.fromEntries([...BUDDIES, ...HEROES].map((b) => [b.id, b])) as Record<string, Buddy>;

/** The hero this station brings, if it is a milestone. */
export function heroForStation(stationKey: string): Hero | undefined {
  return HEROES.find((h) => h.milestone === stationKey);
}

/** Every friend this child has: the one picked first, then the heroes earned. */
export function ownedBuddies(child: { buddy?: string; starter?: string; done: string[] }): string[] {
  const heroes = HEROES.filter((h) => child.done.includes(h.milestone)).map((h) => h.id);
  const starter = child.starter ?? child.buddy;
  return starter && !heroes.includes(starter) ? [starter, ...heroes] : heroes;
}

export type Accessory = { id: string; emoji: string; spot: "head" | "face" | "hand" };

/** Every gift for the buddy. Each station gives one specific gift (content/rewards.ts). */
export const ACCESSORIES: Accessory[] = [
  { id: "cap", emoji: "🧢", spot: "head" },
  { id: "glasses", emoji: "🕶️", spot: "face" },
  { id: "crown", emoji: "👑", spot: "head" },
  { id: "balloon", emoji: "🎈", spot: "hand" },
  { id: "tophat", emoji: "🎩", spot: "head" },
  { id: "bow", emoji: "🎀", spot: "head" },
  { id: "star", emoji: "⭐", spot: "hand" },
  { id: "party", emoji: "🥳", spot: "face" },
  { id: "sunhat", emoji: "👒", spot: "head" },
  { id: "wand", emoji: "🪄", spot: "hand" },
  { id: "goggles", emoji: "🥽", spot: "face" },
  { id: "gradcap", emoji: "🎓", spot: "head" },
  { id: "lollipop", emoji: "🍭", spot: "hand" },
  { id: "umbrella", emoji: "🌂", spot: "hand" },
];

export const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORIES.map((a) => [a.id, a])) as Record<string, Accessory>;
