"use client";

import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { KAMATZ_STATIONS } from "@/content/kamatz";
import { WORLDS } from "@/content/worlds";
import { line } from "@/content/voice";
import { useRequiredChild } from "@/lib/useChild";

/** The kamatz/patach world: syllables in small groups, then first words to read alone. */
export default function KamatzWorldPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const stations: MapStation[] = KAMATZ_STATIONS.map((s, i) => {
    const key = `kamatz-patach/${s.id}`;
    const done = child.done.includes(key);
    const prevDone = i === 0 || child.done.includes(`kamatz-patach/${KAMATZ_STATIONS[i - 1].id}`);
    return {
      key,
      label: s.title,
      icon: world.stationIcons[(i + 2) % world.stationIcons.length],
      badge: s.kind === "words" ? "📖" : s.title.split(" ")[0],
      state: done ? "done" : prevDone || child.unlockAll ? "open" : "locked",
      href: `/play/kamatz-patach/${s.id}`,
      sticker: world.stickers[(i + 7) % world.stickers.length],
    };
  });

  return (
    <WorldShell child={child} back={{ href: "/play/nikud", label: "לעולם הניקוד" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">עוֹלַם הַקָּמָץ וְהַפַּתָּח</h1>
      <div className="mt-4">
        <Guide compact lines={[line("kp-world", child.gender)]} />
      </div>
      <div className="mt-8">
        <AdventureMap stations={stations} />
      </div>
    </WorldShell>
  );
}
