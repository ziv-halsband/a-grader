"use client";

import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { NIKUD_TOPICS } from "@/content/curriculum";
import { WORLDS } from "@/content/worlds";
import { topicsDone } from "@/lib/progress";
import { useRequiredChild } from "@/lib/useChild";

/** The nikud station opened up: every vowel world on its own small map, in teaching order. */
export default function NikudMapPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const done = topicsDone(child);
  const stations: MapStation[] = NIKUD_TOPICS.map((t, i) => {
    const prev = NIKUD_TOPICS[i - 1];
    const open = !!t.href && (i === 0 || done[prev.id] || !!child.unlockAll);
    return {
      key: t.id,
      label: t.title,
      icon: world.stationIcons[(i + 1) % world.stationIcons.length],
      badge: t.icon,
      href: t.href,
      state: done[t.id] ? "done" : open ? "open" : "locked",
    };
  });

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה הגדולה" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">עוֹלַם הַנִּקּוּד</h1>
      <div className="mt-4">
        <Guide compact once lines={["nikud-map"]} />
      </div>
      <div className="mt-8">
        <AdventureMap stations={stations} />
      </div>
    </WorldShell>
  );
}
