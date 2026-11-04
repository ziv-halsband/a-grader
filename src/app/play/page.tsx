"use client";

import Link from "next/link";
import { AdventureMap, type MapStation } from "@/components/AdventureMap";
import { BuddyPicker } from "@/components/BuddyPicker";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { TOPICS } from "@/content/curriculum";
import { WORLDS } from "@/content/worlds";
import { openAll, topicsDone } from "@/lib/progress";
import { registerLine } from "@/lib/audio";
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
  registerLine("child-name", `${child.nickname}!`, readNameRecording(child.id));
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
        <Guide compact once lines={firstVisit ? ["welcome"] : greeting} />
      </div>
      <div className="mt-5 flex justify-center">
        <Link href="/play/letters/review" className="btn-3d nikud anim-glow bg-accent px-7 py-3 text-2xl font-extrabold text-white">
          🎲 הָאִמּוּן הַיּוֹמִי
        </Link>
      </div>
      <div className="mt-8">
        <AdventureMap stations={stations} />
      </div>
      {!child.buddy && <BuddyPicker gender={child.gender} onPick={(id) => actions.updateChild(child.id, { buddy: id })} />}
    </WorldShell>
  );
}
