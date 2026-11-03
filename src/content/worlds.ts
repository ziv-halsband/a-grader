// Two visual worlds over the same learning content. The child (via the parent) picks one;
// the default follows the child's grammatical gender, but any child can play in any world.

export type Gender = "m" | "f";

export type World = {
  id: "island" | "garden";
  name: string;
  tagline: string;
  /** Emoji shown on each station of the map, in order (cycled when there are more stations). */
  stationIcons: string[];
  /** Sticker earned per station, in order. */
  stickers: string[];
  decor: string[];
  /** CSS variables applied to the page. */
  theme: Record<string, string>;
};

export const WORLDS: Record<World["id"], World> = {
  island: {
    id: "island",
    name: "אִי הָאוֹצָר",
    tagline: "מַסָּע בַּסְּפִינָה בֵּין אִיִּים, וּבְכָל אִי מְחַכֶּה אוֹצָר",
    stationIcons: ["🏝️", "⛵", "🗺️", "🌋", "🏰", "⚓", "🐙", "🦈", "🧭", "🏴‍☠️"],
    stickers: ["💎", "🪙", "🗝️", "🦜", "🧭", "⚓", "👑"],
    decor: ["🌴", "🐚", "🦀", "☁️", "🐬"],
    theme: {
      "--sky": "#7dd3fc",
      "--sky-2": "#e0f2fe",
      "--ground": "#fde68a",
      "--accent": "#f97316",
      "--accent-2": "#0ea5e9",
      "--ink": "#0c4a6e",
      "--card": "#fffbeb",
      "--path": "#fb923c",
    },
  },
  garden: {
    id: "garden",
    name: "גַּן הַקְּסָמִים",
    tagline: "טִיּוּל בֵּין פְּרָחִים וּבָתֵּי פְּיוֹת, וּבְכָל בַּיִת מְחַכָּה הַפְתָּעָה",
    stationIcons: ["🌷", "🍄", "🦋", "🌈", "🏡", "🌻", "🐞", "🫖", "🧚", "🏰"],
    stickers: ["🌸", "🦋", "🌈", "🍓", "🐞", "🌻", "🧚"],
    decor: ["🌼", "🍀", "🐝", "☁️", "✨"],
    theme: {
      "--sky": "#f5d0fe",
      "--sky-2": "#fdf4ff",
      "--ground": "#bbf7d0",
      "--accent": "#db2777",
      "--accent-2": "#8b5cf6",
      "--ink": "#581c87",
      "--card": "#fff7fb",
      "--path": "#f472b6",
    },
  },
};

export function defaultWorldFor(gender: Gender): World["id"] {
  return gender === "f" ? "garden" : "island";
}

/** The guide's display name. Placeholder until we decide what the kids call mom. */
export const GUIDE_NAME = "הַמּוֹרָה";
