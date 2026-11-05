// 🌱 The letter garden: every letter is a plant the child grows, so progress is something they can SEE.
// seed (new) → sprout (practicing) → flower (knows). The island world grows palm trees from coconuts.
// Nothing ever wilts: a missed day changes nothing (retention by "mounting value", never by fear of loss).

import type { Mastery } from "../lib/mastery.ts";
import type { World } from "./worlds.ts";

export type GardenLook = {
  /** Screen title (and the map button). */
  title: string;
  /** Voice line said once when the garden opens (gendered, see voice.ts). */
  intro: string;
  /** Said when letters bloom for the first time. */
  bloomLine: string;
  seed: string;
  sprout: string;
  /** Grown plants, picked per letter so the garden looks varied. */
  blooms: string[];
  /** One for every day played this week (no empty slots: nothing to "miss"). */
  dayIcon: string;
  /** The ground under each plant. */
  soil: string;
};

export const GARDEN: Record<World["id"], GardenLook> = {
  garden: {
    title: "הַגִּנָּה שֶׁלִּי",
    intro: "garden-intro",
    bloomLine: "garden-bloom",
    seed: "🌰",
    sprout: "🌱",
    blooms: ["🌷", "🌻", "🌸", "🌼", "🌺"],
    dayIcon: "💧",
    soil: "#a16207",
  },
  island: {
    title: "הָאִי שֶׁלִּי",
    intro: "island-intro",
    bloomLine: "island-bloom",
    seed: "🥥",
    sprout: "🌱",
    blooms: ["🌴"],
    dayIcon: "☀️",
    soil: "#f59e0b",
  },
};

/** The plant for a letter at its stage (`index` = the letter's place, for varied flowers). */
export function plantFor(look: GardenLook, mastery: Mastery, index: number): string {
  if (mastery === "knows") return look.blooms[index % look.blooms.length];
  return mastery === "practicing" ? look.sprout : look.seed;
}
