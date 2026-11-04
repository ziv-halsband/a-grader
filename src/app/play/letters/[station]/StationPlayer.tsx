"use client";

import Link from "next/link";
import { useState } from "react";
import { StationSteps, type Step } from "@/components/StationSteps";
import { WorldShell } from "@/components/WorldShell";
import { LETTER_BY_ID, LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { useRequiredChild } from "@/lib/useChild";
import { BubblesGame } from "./BubblesGame";
import { Meet } from "./Meet";
import { MemoryGame } from "./MemoryGame";
import { WriteStep } from "./WriteStep";
import { LetterQuiz } from "@/components/LetterQuiz";
import { StationDone } from "@/components/StationDone";
import { buildQuizItems } from "@/content/games";
import { PRACTICE_MODE } from "@/lib/progress";

// 5 short steps (a station ≈ 5–8 minutes).
const STEPS: Step[] = [
  { id: "meet", icon: "📖", label: "לוֹמְדִים" },
  { id: "quiz", icon: "🎯", label: "מוֹצְאִים" },
  { id: "write", icon: "✍️", label: "כּוֹתְבִים" },
  { id: "play", icon: "🎮", label: "מְשַׂחֲקִים" },
  { id: "done", icon: "🎁", label: "הַפְתָּעָה" },
];

/** One station: learn the letters → mixed quiz → write them → a fun game → the surprise. */
export function StationPlayer({ stationId }: { stationId: string }) {
  const child = useRequiredChild();
  const [phase, setPhase] = useState("meet");
  const [reached, setReached] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  /** How many times the "play" step was opened: alternates bubbles / memory. */
  const [plays, setPlays] = useState(() => Math.floor(Math.random() * 2));

  if (!child) return <WorldShell>{null}</WorldShell>;

  const index = LETTER_STATIONS.findIndex((s) => s.id === stationId);
  const station = LETTER_STATIONS[index];
  const letters = station.letterIds.map((id) => LETTER_BY_ID[id]);
  const world = WORLDS[child.worldId];
  // A station done before: every game is open right away (replay any part).
  // Practice mode: every step is open, in any order. Otherwise: a station done before opens all its games.
  const furthest = PRACTICE_MODE
    ? STEPS.length - 1
    : (reached ?? (child.done.includes(`letters/${stationId}`) ? STEPS.length - 2 : 0));

  const go = (id: string) => {
    const i = STEPS.findIndex((s) => s.id === id);
    setReached(Math.max(furthest, i));
    setPhase(id);
    setRun((r) => r + 1);
    if (id === "play") setPlays((p) => p + 1);
  };

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <StationSteps steps={STEPS} current={phase} reached={furthest} completed={PRACTICE_MODE ? (reached ?? 0) : furthest} onPick={go} />

      <div key={run} className="flex flex-1 flex-col">
        {phase === "meet" && <Meet letters={letters} onDone={() => go("quiz")} />}
        {phase === "quiz" && <LetterQuiz build={() => buildQuizItems(stationId)} child={child} onDone={() => go("write")} />}
        {phase === "write" && <WriteStep letterIds={station.letterIds} child={child} onDone={() => go("play")} />}
        {phase === "play" &&
          // Alternate the fun game each time the step is played: bubbles, then memory pairs.
          (plays % 2 === 0 ? (
            <BubblesGame stationId={stationId} gender={child.gender} onDone={() => go("done")} />
          ) : (
            <MemoryGame letterIds={station.letterIds} gender={child.gender} worldId={child.worldId} onDone={() => go("done")} />
          ))}
        {phase === "done" && (
          <StationDone
            child={child}
            stationKey={`letters/${stationId}`}
            sticker={world.stickers[index % world.stickers.length]}
            items={letters.map((l) => ({ id: l.id, label: l.char }))}
            mapHref="/play/letters"
            onReplay={() => go("meet")}
            next={
              LETTER_STATIONS[index + 1] ? (
                <Link
                  href={`/play/letters/${LETTER_STATIONS[index + 1].id}`}
                  className="btn-3d flex-1 bg-accent px-5 py-4 text-center text-2xl font-extrabold text-white"
                >
                  לַתַּחֲנָה הַבָּאָה ←
                </Link>
              ) : (
                <Link
                  href="/play"
                  className="btn-3d flex-1 bg-accent px-5 py-4 text-center text-2xl font-extrabold text-white"
                >
                  לַמַּפָּה הַגְּדוֹלָה ←
                </Link>
              )
            }
          />
        )}
      </div>
    </WorldShell>
  );
}
