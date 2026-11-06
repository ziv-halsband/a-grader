"use client";

import Link from "next/link";
import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { Guide } from "@/components/Guide";
import { GardenPreview } from "@/components/LetterGarden";
import { PointHand } from "@/components/PointHand";
import { WorldShell } from "@/components/WorldShell";
import { line } from "@/content/voice";
import { LETTER_STATIONS } from "@/content/letters";
import { rewardFor } from "@/content/rewards";
import { WORLDS } from "@/content/worlds";
import { useRequiredChild } from "@/lib/useChild";
import { openAll } from "@/lib/progress";

/** The letters world: small groups of letters, opened one after another. Done stations can be replayed. */
export default function LettersWorldPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const stations: MapStation[] = LETTER_STATIONS.map((s, i) => {
    const key = `letters/${s.id}`;
    const done = child.done.includes(key);
    const reward = rewardFor(world, key);
    const hero = reward?.hero;
    const prevDone = i === 0 || child.done.includes(`letters/${LETTER_STATIONS[i - 1].id}`);
    return {
      key,
      label: s.title,
      icon: world.stationIcons[i % world.stationIcons.length],
      badge: s.mix ? (i === LETTER_STATIONS.length - 1 ? "🏆" : "🔀") : s.title.split(" ")[0],
      state: done ? "done" : prevDone || openAll(child) ? "open" : "locked",
      href: `/play/letters/${s.id}`,
      sticker: reward?.sticker,
      hero: hero && { emoji: hero.emoji, owned: done },
    };
  });

  const allDone = stations.every((s) => s.state === "done");
  const canPractice = openAll(child) || child.done.some((d) => d.startsWith("letters/"));

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה הגדולה" }}>
      <h1 className="nikud mt-3 text-center text-4xl font-extrabold drop-shadow-[0_2px_0_rgb(255_255_255/0.8)]">עוֹלַם הָאוֹתִיּוֹת</h1>
      <div className="mt-3">
        {/* What now? The next station (the 👆 is on it), or, at the end of the world, the daily practice. */}
        <Guide compact once lines={allDone ? [line("world-done", child.gender)] : ["letters-map", line("go-next", child.gender)]} />
      </div>
      <div className="mx-auto mt-5 grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_19rem] lg:items-start">
        {/* Side things (portrait: a row on top; landscape: a column beside the map, so the map stays on the first screen). */}
        <div className="flex flex-col gap-4 px-4 lg:sticky lg:top-4 lg:order-last">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/play/letters/write" className="btn-3d tile nikud flex flex-col items-center gap-1 px-3 py-3 text-xl font-extrabold">
              <span aria-hidden className="text-4xl">✍️</span>
              הַמַּחְבֶּרֶת שֶׁלִּי
            </Link>
            {canPractice && (
              <Link
                href="/play/letters/review"
                className={`btn-3d nikud relative flex flex-col items-center gap-1 px-3 py-3 text-xl font-extrabold ${
                  allDone ? "tile-accent anim-glow" : "tile"
                }`}
              >
                <span aria-hidden className="text-4xl">🎲</span>
                הָאִמּוּן הַיּוֹמִי
                {allDone && <PointHand className="-bottom-6 -left-4" />}
              </Link>
            )}
            {/* 📄 Printable worksheets for this station (for the grown-up). */}
            <Link
              href={`/print?src=letters:${LETTER_STATIONS.find((s) => !child.done.includes(`letters/${s.id}`))?.id ?? "m2"}&type=all`}
              className="btn-3d tile nikud col-span-2 flex items-center justify-center gap-2 px-3 py-2 text-lg font-bold"
              data-worksheets-tile
            >
              <span aria-hidden className="text-2xl">📄</span>
              דַּפֵּי עֲבוֹדָה
            </Link>
          </div>
          <GardenPreview child={child} />
        </div>
        <AdventureMap stations={stations} here={{ buddy: child.buddy, wearing: child.wearing }} />
      </div>
    </WorldShell>
  );
}
