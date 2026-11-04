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

export const BUDDY_BY_ID = Object.fromEntries(BUDDIES.map((b) => [b.id, b])) as Record<string, Buddy>;

export type Accessory = { id: string; emoji: string; spot: "head" | "face" | "hand" };

/** One accessory per finished station, in this order (cycled). */
export const ACCESSORIES: Accessory[] = [
  { id: "cap", emoji: "🧢", spot: "head" },
  { id: "glasses", emoji: "🕶️", spot: "face" },
  { id: "crown", emoji: "👑", spot: "head" },
  { id: "balloon", emoji: "🎈", spot: "hand" },
  { id: "tophat", emoji: "🎩", spot: "head" },
  { id: "bow", emoji: "🎀", spot: "head" },
  { id: "star", emoji: "⭐", spot: "hand" },
  { id: "party", emoji: "🥳", spot: "face" },
];

export const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORIES.map((a) => [a.id, a])) as Record<string, Accessory>;

/** The accessory earned for the n-th finished station (0-based), so it never depends on which station. */
export function accessoryForCount(n: number): Accessory {
  return ACCESSORIES[n % ACCESSORIES.length];
}
