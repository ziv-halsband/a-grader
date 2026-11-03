"use client";

import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { TOPICS } from "@/content/curriculum";
import { LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { line } from "@/content/voice";
import { useRequiredChild } from "@/lib/useChild";

/** The whole adventure: one station per topic of mom's year. Only "letters" is open for now. */
export default function AdventurePage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const lettersDone = LETTER_STATIONS.every((s) => child.done.includes(`letters/${s.id}`));
  const firstVisit = child.done.length === 0;

  const stations: MapStation[] = TOPICS.map((t, i) => ({
    key: t.id,
    label: t.title,
    icon: world.stationIcons[i % world.stationIcons.length],
    badge: t.icon,
    href: t.href,
    state: t.id === "letters" ? (lettersDone ? "done" : "open") : "locked",
  }));

  return (
    <WorldShell child={child} back={{ href: "/", label: "מסך הבית" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold drop-shadow-sm">{world.name}</h1>
      <div className="mt-4">
        <Guide compact lines={[line(firstVisit ? "welcome" : "map-pick", child.gender)]} />
      </div>
      <div className="mt-8">
        <AdventureMap stations={stations} />
      </div>
    </WorldShell>
  );
}
