"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { StationDone } from "@/components/StationDone";
import { PRIZE, prizeLocked, StationSteps, stepAfter, type Step } from "@/components/StationSteps";
import { WorldShell } from "@/components/WorldShell";
import { NIKUD_SYLLABLE_BY_ID, NIKUD_WORD_BY_ID, NIKUD_WORLD_BY_ID, NIKUD_WORLDS, shownSyllable } from "@/content/nikud";
import { PRACTICE_MODE } from "@/lib/progress";
import { useRequiredChild } from "@/lib/useChild";
import { BlendGame } from "./BlendGame";
import { StepSplash } from "./StepSplash";
import { FindGame, ReadGame, StartsGame } from "./SyllableGames";
import { SyllableLearn } from "./SyllableLearn";
import { WordsLearn } from "./WordsLearn";

type NikudStep = Step & { splash: string };

// A syllables station: 5 short steps (≈ 5–8 minutes). DRAFT (mom): the steps and their order.
const SYLLABLE_STEPS: NikudStep[] = [
  { id: "learn", icon: "📖", label: "לוֹמְדִים", splash: "מַכִּירִים צְלִילִים" },
  { id: "blend", icon: "🐢", label: "מְחַבְּרִים", splash: "לְאַט… וּמַהֵר!" },
  { id: "find", icon: "👂", label: "שׁוֹמְעִים", splash: "שׁוֹמְעִים וּמוֹצְאִים" },
  { id: "starts", icon: "🖼️", label: "תְּמוּנוֹת", splash: "בְּמָה זֶה מַתְחִיל?" },
  { id: "done", icon: "🎁", label: "פְּרָס", splash: "הַפְתָּעָה!" },
];
// The reading-words station: read together, then alone, then the surprise (the 📚 stories come after).
const WORD_STEPS: NikudStep[] = [
  { id: "learn", icon: "📖", label: "קוֹרְאִים יַחַד", splash: "קוֹרְאִים יַחַד" },
  { id: "read", icon: "🔍", label: "לְבַד", splash: "קוֹרְאִים לְבַד!" },
  { id: "done", icon: "🎁", label: "פְּרָס", splash: "הַפְתָּעָה!" },
];

/** The world's own color on every screen of it (the accent and the map path). */
export function worldStyle(worldId: string): CSSProperties {
  const w = NIKUD_WORLD_BY_ID[worldId];
  return { "--accent": w.color, "--path": w.color } as CSSProperties;
}

/** One station of a nikud world: the same flow as the letters stations (steps bar, earned prize). */
export function NikudPlayer({ worldId, stationId }: { worldId: string; stationId: string }) {
  const child = useRequiredChild();
  const [phase, setPhase] = useState("learn");
  const [reached, setReached] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  /** The splash before the step (each time a step starts). */
  const [splash, setSplash] = useState(true);
  /** Steps finished in this visit (✓ in the steps bar). */
  const [finished, setFinished] = useState<string[]>([]);
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = NIKUD_WORLD_BY_ID[worldId];
  const index = world.stations.findIndex((s) => s.id === stationId);
  const station = world.stations[index];
  const steps = station.kind === "words" ? WORD_STEPS : SYLLABLE_STEPS;
  const key = `${worldId}/${stationId}`;
  const wasDone = child.done.includes(key);
  const furthest = PRACTICE_MODE ? steps.length - 1 : (reached ?? (wasDone ? steps.length - 2 : 0));
  const order = steps.map((s) => s.id);
  const go = (id: string) => {
    setReached(Math.max(furthest, order.indexOf(id)));
    setPhase(id);
    setSplash(true);
    setRun((r) => r + 1);
  };
  const after = (id: string) => () => {
    const now = finished.includes(id) ? finished : [...finished, id];
    setFinished(now);
    // The shared rule (StationSteps): every step done → the 🎁; a step still missing → that step first.
    go(stepAfter(steps, now, order[order.indexOf(id) + 1], wasDone));
  };
  const step = steps.find((s) => s.id === phase)!;
  const mapHref = `/play/nikud/${worldId}`;
  const nextStation = world.stations[index + 1];
  const nextWorld = NIKUD_WORLDS[NIKUD_WORLDS.indexOf(world) + 1];

  return (
    <WorldShell child={child} back={{ href: mapHref, label: `ל${world.mapTitle}` }}>
      <div style={worldStyle(worldId)} className="flex flex-1 flex-col" data-world={worldId}>
        <StationSteps
          steps={steps}
          current={phase}
          reached={furthest}
          finished={finished}
          // The prize is earned: it opens only after every other step (or if the station was finished before).
          locked={prizeLocked(steps, finished, wasDone) ? [PRIZE] : []}
          onPick={go}
        />
        {splash ? (
          <StepSplash
            key={run}
            icon={step.icon}
            title={step.splash}
            index={order.indexOf(phase)}
            total={steps.length}
            onDone={() => setSplash(false)}
          />
        ) : (
          <div key={run} className="flex flex-1 flex-col">
            {phase === "learn" &&
              (station.kind === "words" ? (
                <WordsLearn
                  worldId={worldId}
                  wordIds={station.itemIds.slice(0, 4)}
                  gender={child.gender}
                  onDone={after("learn")}
                />
              ) : (
                <SyllableLearn
                  world={world}
                  syllableIds={station.itemIds}
                  withMeet={index === 0}
                  gender={child.gender}
                  onDone={after("learn")}
                />
              ))}
            {phase === "blend" && <BlendGame world={world} syllableIds={station.itemIds} onDone={after("blend")} />}
            {phase === "find" && <FindGame worldId={worldId} stationId={stationId} child={child} onDone={after("find")} />}
            {phase === "starts" && (
              <StartsGame worldId={worldId} stationId={stationId} child={child} onDone={after("starts")} />
            )}
            {phase === "read" && <ReadGame wordIds={station.itemIds} child={child} onDone={after("read")} />}
            {phase === PRIZE && !prizeLocked(steps, finished, wasDone) && (
              <StationDone
                stars={steps.length - 1}
                child={child}
                stationKey={key}
                items={station.itemIds.map((id) =>
                  station.kind === "words"
                    ? { id, label: NIKUD_WORD_BY_ID[id].emoji }
                    : { id, label: shownSyllable(NIKUD_SYLLABLE_BY_ID[id]) },
                )}
                mapHref={mapHref}
                onReplay={() => go("learn")}
                next={
                  nextStation ? (
                    <Link
                      href={`/play/nikud/${worldId}/${nextStation.id}`}
                      className="btn-3d flex-1 bg-accent px-5 py-4 text-center text-2xl font-extrabold text-white"
                    >
                      לַתַּחֲנָה הַבָּאָה ←
                    </Link>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href={`/play/stories/${worldId}`}
                        className="btn-3d flex-1 bg-accent px-5 py-4 text-center text-2xl font-extrabold text-white"
                      >
                        📚 לַסִּפּוּרִים ←
                      </Link>
                      {nextWorld && (
                        <Link
                          href={`/play/nikud/${nextWorld.id}`}
                          aria-label={nextWorld.mapTitle}
                          className="btn-3d nikud flex items-center justify-center bg-white px-5 py-4 text-3xl font-extrabold"
                        >
                          {nextWorld.icon} ←
                        </Link>
                      )}
                    </div>
                  )
                }
              />
            )}
          </div>
        )}
      </div>
    </WorldShell>
  );
}
