"use client";

import { useState } from "react";
import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { NIKUD_WORLD_BY_ID, stationTitle } from "@/content/nikud";
import { rewardFor } from "@/content/rewards";
import { WORLDS } from "@/content/worlds";
import { boingSound, say } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { openAll } from "@/lib/progress";
import { useRequiredChild } from "@/lib/useChild";
import { Glyph } from "./Glyph";
import { worldStyle } from "./NikudPlayer";

/** One vowel world's map: its syllable stations, the reading-words station, then 📚 the stories. */
export function NikudWorldMap({ worldId }: { worldId: string }) {
  const child = useRequiredChild();
  const [taps, setTaps] = useState(0);
  if (!child) return <WorldShell>{null}</WorldShell>;

  const vw = NIKUD_WORLD_BY_ID[worldId];
  const world = WORLDS[child.worldId];
  const stations: MapStation[] = vw.stations.map((s, i) => {
    const key = `${worldId}/${s.id}`;
    const done = child.done.includes(key);
    const reward = rewardFor(world, key);
    const prevDone = i === 0 || child.done.includes(`${worldId}/${vw.stations[i - 1].id}`);
    return {
      key,
      label: stationTitle(s),
      icon: world.stationIcons[(i + 2) % world.stationIcons.length],
      badge: s.kind === "words" ? "📖" : stationTitle(s).split(" ")[0],
      state: done ? "done" : prevDone || openAll(child) ? "open" : "locked",
      href: `/play/nikud/${worldId}/${s.id}`,
      sticker: reward?.sticker,
      hero: reward?.hero && { emoji: reward.hero.emoji, owned: done },
    };
  });
  // 📚 Stories built from this world's words (another part of the app, at /play/stories/<world>).
  const wordsDone = child.done.includes(`${worldId}/${vw.stations[vw.stations.length - 1].id}`);
  stations.push({
    key: `stories/${worldId}`,
    label: "סִפּוּרִים",
    icon: "📚",
    badge: "📚",
    state: wordsDone || openAll(child) ? "open" : "locked",
    href: `/play/stories/${worldId}`,
  });

  return (
    <WorldShell child={child} back={{ href: "/play/nikud", label: "לעולם הניקוד" }}>
      <div style={worldStyle(worldId)} className="flex flex-1 flex-col" data-world={worldId}>
        <div className="mt-3 flex flex-col items-center gap-2">
          <button
            onClick={() => {
              boingSound();
              cheer("giggle");
              setTaps((t) => t + 1);
              say(...vw.marks.map((m) => m.line), vw.soundLine);
            }}
            aria-label={vw.title}
            className="btn-3d flex h-28 min-w-28 items-center justify-center gap-1 rounded-full border-4 border-white bg-white px-5 pb-3 text-7xl font-extrabold shadow-xl"
          >
            <span key={taps} className={`inline-block ${taps ? "anim-wiggle" : ""}`}>
              <Glyph s={{ base: "א", mark: vw.marks[0].id }} />
            </span>
          </button>
          <h1 className="nikud text-center text-3xl font-extrabold drop-shadow-sm">{vw.mapTitle}</h1>
        </div>
        <div className="mt-3">
          <Guide compact once lines={[`nw-${worldId}`]} />
        </div>
        <div className="mt-6">
          <AdventureMap stations={stations} />
        </div>
      </div>
    </WorldShell>
  );
}
