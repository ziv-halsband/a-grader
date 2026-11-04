// What each station gives, in one place: its sticker (per visual world) + one specific gift for the buddy,
// and on milestone stations a new hero. The maps, the end-of-station surprise and "my room" all read this,
// so the child always sees the same pair for the same station.

import { heroForStation, type Hero } from "./buddies.ts";
import { KAMATZ_STATIONS } from "./kamatz.ts";
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
  "kamatz-patach/k1": "goggles",
  "kamatz-patach/k2": "lollipop",
  "kamatz-patach/k3": "party",
  "kamatz-patach/k4": "umbrella",
  "kamatz-patach/k5": "gradcap",
};

export type StationReward = {
  key: string;
  /** Which part of the journey (a heading in my room). */
  section: "letters" | "kamatz-patach";
  /** The station's name as on the map, readable (mix stations get their badge). */
  title: string;
  /** The station's badge on the map (a letter, 🔀, 🏆, a syllable…). */
  badge: string;
  sticker: string;
  gift: string;
  hero?: Hero;
};

/** Every station's reward, in map order (letters, then kamatz/patach). */
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
  const kamatz = KAMATZ_STATIONS.map((s, i): StationReward => {
    const key = `kamatz-patach/${s.id}`;
    return {
      key,
      section: "kamatz-patach",
      title: s.title,
      badge: s.kind === "words" ? "📖" : s.title.split(" ")[0],
      sticker: world.kpStickers[i % world.kpStickers.length],
      gift: GIFTS[key],
      hero: heroForStation(key),
    };
  });
  return [...letters, ...kamatz];
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
