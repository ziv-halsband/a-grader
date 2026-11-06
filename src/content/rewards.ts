// What each station gives, in one place: its sticker (per visual world) + one specific gift for the buddy,
// and on milestone stations a new hero. The maps, the end-of-station surprise and "my room" all read this,
// so the child always sees the same pair for the same station.

import { heroForStation, type Hero } from "./buddies.ts";
import { NIKUD_WORLDS, stationTitle } from "./nikud.ts";
import { LETTER_STATIONS } from "./letters.ts";
import type { World } from "./worlds.ts";

/** The buddy's gift per station key (an id from ACCESSORIES). Every station has its own. */
const GIFTS: Record<string, string> = {
  "letters/s1": "cap",
  "letters/s2": "glasses",
  "letters/s3": "balloon",
  "letters/m1": "tophat",
  "letters/s4": "bow",
  "letters/s5": "star",
  "letters/s6": "sunhat",
  "letters/s7": "wand",
  "letters/m2": "crown",
  // The nikud worlds' gifts are in content/nikud.ts (one per station, in order).
};

export type StationReward = {
  key: string;
  /** Which part of the journey (a heading in my room). */
  /** "letters", or a nikud world's id. */
  section: string;
  /** The station's name as on the map, readable (mix stations get their badge). */
  title: string;
  /** The station's badge on the map (a letter, 🔀, 🏆, a syllable…). */
  badge: string;
  sticker: string;
  gift: string;
  hero?: Hero;
};

/** Every station's reward, in map order (letters, then each nikud world). */
export function rewardPath(world: World): StationReward[] {
  const letters = LETTER_STATIONS.map((s, i): StationReward => {
    const key = `letters/${s.id}`;
    const badge = s.mix ? (i === LETTER_STATIONS.length - 1 ? "🏆" : "🔀") : s.title.split(" ")[0];
    return {
      key,
      section: "letters",
      title: s.mix ? `${badge} ${s.id === "m1" ? "חֲזָרָה" : s.title}` : s.title,
      badge,
      sticker: world.stickers[i % world.stickers.length],
      gift: GIFTS[key],
      hero: heroForStation(key),
    };
  });
  // The nikud worlds: kamatz keeps its stickers per visual world (from before), the others have their own set.
  const nikud = NIKUD_WORLDS.flatMap((w) =>
    w.stations.map((s, i): StationReward => {
      const key = `${w.id}/${s.id}`;
      const stickers = w.stickers.length ? w.stickers : world.kpStickers;
      return {
        key,
        section: w.id,
        title: stationTitle(s),
        badge: s.kind === "words" ? "📖" : stationTitle(s).split(" ")[0],
        sticker: stickers[i % stickers.length],
        gift: w.gifts[i % w.gifts.length],
        hero: heroForStation(key),
      };
    }),
  );
  return [...letters, ...nikud];
}

export function rewardFor(world: World, stationKey: string): StationReward | undefined {
  return rewardPath(world).find((r) => r.key === stationKey);
}

/**
 * Gifts the child owns: what is in the wardrobe (older saves got gifts by count) plus the gift of every
 * finished station, so a collected station always shows its own gift as owned.
 */
export function ownedGifts(world: World, child: { done: string[]; wardrobe?: string[] }): string[] {
  const fromStations = rewardPath(world)
    .filter((r) => child.done.includes(r.key))
    .map((r) => r.gift);
  return [...new Set([...(child.wardrobe ?? []), ...fromStations])];
}
