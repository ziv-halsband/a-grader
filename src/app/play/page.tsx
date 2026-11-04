"use client";

import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { TOPICS } from "@/content/curriculum";
import { KAMATZ_STATIONS } from "@/content/kamatz";
import { LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { line } from "@/content/voice";
import { useRequiredChild } from "@/lib/useChild";

/** The whole adventure: one station per topic of mom's year. Letters and kamatz/patach are built so far. */
export default function AdventurePage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const allDone = (prefix: string, ids: { id: string }[]) => ids.every((s) => child.done.includes(`${prefix}/${s.id}`));
  const done: Record<string, boolean> = {
    letters: allDone("letters", LETTER_STATIONS),
    "kamatz-patach": allDone("kamatz-patach", KAMATZ_STATIONS),
  };
  const firstVisit = child.done.length === 0;

  // A topic opens when the one before it is done (or a parent opened all worlds). Topics not built yet stay locked.
  const stations: MapStation[] = TOPICS.map((t, i) => {
    const prev = TOPICS[i - 1];
    const open = !!t.href && (i === 0 || done[prev.id] || !!child.unlockAll);
    return {
      key: t.id,
      label: t.title,
      icon: world.stationIcons[i % world.stationIcons.length],
      badge: t.icon,
      href: t.href,
      state: done[t.id] ? "done" : open ? "open" : "locked",
    };
  });

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
