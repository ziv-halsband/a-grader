"use client";

import Link from "next/link";
import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { line } from "@/content/voice";
import { useRequiredChild } from "@/lib/useChild";

/** The letters world: small groups of letters, opened one after another. Done stations can be replayed. */
export default function LettersWorldPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const stations: MapStation[] = LETTER_STATIONS.map((s, i) => {
    const key = `letters/${s.id}`;
    const done = child.done.includes(key);
    const prevDone = i === 0 || child.done.includes(`letters/${LETTER_STATIONS[i - 1].id}`);
    return {
      key,
      label: s.title,
      icon: world.stationIcons[i % world.stationIcons.length],
      badge: s.title.split(" ")[0],
      state: done ? "done" : prevDone ? "open" : "locked",
      href: `/play/letters/${s.id}`,
      sticker: world.stickers[i % world.stickers.length],
    };
  });

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה הגדולה" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">עוֹלַם הָאוֹתִיּוֹת</h1>
      <div className="mt-4">
        <Guide compact lines={[line("letters-map", child.gender)]} />
      </div>
      <div className="mt-5 flex justify-center">
        <Link href="/play/letters/write" className="btn-3d nikud bg-white px-6 py-3 text-xl font-extrabold">
          ✍️ הַמַּחְבֶּרֶת שֶׁלִּי
        </Link>
      </div>
      <div className="mt-6">
        <AdventureMap stations={stations} />
      </div>
    </WorldShell>
  );
}
