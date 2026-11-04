"use client";

import Link from "next/link";
import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { BuddyPicker } from "@/components/BuddyPicker";
import { BuddyTour } from "@/components/BuddyTour";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { TOPICS } from "@/content/curriculum";
import { WORLDS } from "@/content/worlds";
import { openAll, topicsDone } from "@/lib/progress";
import { nameLineId } from "@/content/names";
import { audioUrl, registerLine } from "@/lib/audio";
import { readNameRecording } from "@/lib/nameRecording";
import { actions } from "@/lib/store";
import { line } from "@/content/voice";
import { useRequiredChild } from "@/lib/useChild";

/** The whole adventure: one station per topic of mom's year; all the vowels are one "nikud" station. */
export default function AdventurePage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const done = topicsDone(child);
  const firstVisit = child.done.length === 0;
  // "בֹּקֶר טוֹב, נוֹעָה! מוּכָנָה לָאִמּוּן הַיּוֹמִי?" (the name is spoken only if a parent recorded it).
  // A parent's recording first; else the name ready-made in the guide's voice (content/names.ts); else caption only.
  const recorded = readNameRecording(child.id);
  const ready = nameLineId(child.nickname);
  registerLine("child-name", `${child.nickname}!`, recorded ?? (ready ? audioUrl(ready) : undefined));
  const hour = new Date().getHours();
  const greet = hour >= 5 && hour < 12 ? "good-morning" : hour >= 12 && hour < 17 ? "good-noon" : "good-evening";
  const greeting = [greet, "child-name", line("ready-daily", child.gender)];

  // A topic opens when the one before it is done (or a parent opened all worlds). Topics not built yet stay locked.
  const stations: MapStation[] = TOPICS.map((t, i) => {
    const prev = TOPICS[i - 1];
    const open = !!t.href && (i === 0 || done[prev.id] || openAll(child));
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
        {/* Quiet while the buddy picker / tour talks, so the greeting isn't cut off. */}
        <Guide compact once lines={!child.buddy || !child.tourSeen ? [] : firstVisit ? ["welcome"] : greeting} />
      </div>
      <div className="mt-5 flex justify-center">
        <Link href="/play/letters/review" className="btn-3d nikud anim-glow bg-accent px-7 py-3 text-2xl font-extrabold text-white">
          🎲 הָאִמּוּן הַיּוֹמִי
        </Link>
      </div>
      <div className="mt-8">
        <AdventureMap stations={stations} />
      </div>
      {!child.buddy ? (
        <BuddyPicker gender={child.gender} onPick={(id) => actions.updateChild(child.id, { buddy: id, starter: id })} />
      ) : (
        !child.tourSeen && <BuddyTour child={child} onDone={() => actions.updateChild(child.id, { tourSeen: true })} />
      )}
    </WorldShell>
  );
}
