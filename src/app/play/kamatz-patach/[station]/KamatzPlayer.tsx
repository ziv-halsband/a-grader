"use client";

import Link from "next/link";
import { useState } from "react";
import { StationDone } from "@/components/StationDone";
import { StationSteps, type Step } from "@/components/StationSteps";
import { WorldShell } from "@/components/WorldShell";
import { KAMATZ, KAMATZ_STATIONS, READ_WORD_BY_ID, SYLLABLE_BY_ID } from "@/content/kamatz";
import { WORLDS } from "@/content/worlds";
import { useRequiredChild } from "@/lib/useChild";
import { ReadGame } from "./ReadGame";
import { SyllableFind, SyllableStarts } from "./SyllableGames";
import { SyllableLearn } from "./SyllableLearn";
import { WordsLearn } from "./WordsLearn";

const SYLLABLE_STEPS: Step[] = [
  { id: "learn", icon: "📖", label: "לוֹמְדִים" },
  { id: "find", icon: "👂", label: "שׁוֹמְעִים" },
  { id: "starts", icon: "🖼️", label: "מִלִּים" },
  { id: "done", icon: "🎁", label: "פְּרָס" },
];
const WORD_STEPS: Step[] = [
  { id: "learn", icon: "📖", label: "לוֹמְדִים" },
  { id: "read", icon: "🔍", label: "קוֹרְאִים" },
  { id: "done", icon: "🎁", label: "פְּרָס" },
];

export function KamatzPlayer({ stationId }: { stationId: string }) {
  const child = useRequiredChild();
  const [phase, setPhase] = useState("learn");
  const [reached, setReached] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  if (!child) return <WorldShell>{null}</WorldShell>;

  const index = KAMATZ_STATIONS.findIndex((s) => s.id === stationId);
  const station = KAMATZ_STATIONS[index];
  const steps = station.kind === "words" ? WORD_STEPS : SYLLABLE_STEPS;
  const key = `kamatz-patach/${stationId}`;
  const world = WORLDS[child.worldId];
  const furthest = reached ?? (child.done.includes(key) ? steps.length - 2 : 0);
  const order = steps.map((s) => s.id);
  const go = (id: string) => {
    setReached(Math.max(furthest, order.indexOf(id)));
    setPhase(id);
    setRun((r) => r + 1);
  };
  const after = (id: string) => () => go(order[order.indexOf(id) + 1]);
  const nextStation = KAMATZ_STATIONS[index + 1];

  return (
    <WorldShell child={child} back={{ href: "/play/kamatz-patach", label: "לעולם הקמץ והפתח" }}>
      <StationSteps steps={steps} current={phase} reached={furthest} onPick={go} />
      <div key={run} className="flex flex-1 flex-col">
        {phase === "learn" &&
          (station.kind === "words" ? (
            <WordsLearn wordIds={station.itemIds} gender={child.gender} onDone={after("learn")} />
          ) : (
            <SyllableLearn
              syllableIds={station.itemIds}
              withMarksIntro={index === 0}
              gender={child.gender}
              onDone={after("learn")}
            />
          ))}
        {phase === "find" && <SyllableFind stationId={stationId} child={child} onDone={after("find")} />}
        {phase === "starts" && <SyllableStarts stationId={stationId} child={child} onDone={after("starts")} />}
        {phase === "read" && <ReadGame wordIds={station.itemIds} child={child} onDone={after("read")} />}
        {phase === "done" && (
          <StationDone
            child={child}
            stationKey={key}
            sticker={world.stickers[(index + 7) % world.stickers.length]}
            items={station.itemIds.map((id) =>
              station.kind === "words"
                ? { id, label: READ_WORD_BY_ID[id].emoji }
                : { id, label: SYLLABLE_BY_ID[id].base + KAMATZ },
            )}
            mapHref="/play/kamatz-patach"
            onReplay={() => go("learn")}
            next={
              <Link
                href={nextStation ? `/play/kamatz-patach/${nextStation.id}` : "/play"}
                className="btn-3d flex-1 bg-accent px-5 py-4 text-center text-2xl font-extrabold text-white"
              >
                {nextStation ? "לַתַּחֲנָה הַבָּאָה ←" : "לַמַּפָּה הַגְּדוֹלָה ←"}
              </Link>
            }
          />
        )}
      </div>
    </WorldShell>
  );
}
