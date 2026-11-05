"use client";

import Link from "next/link";
import { useState } from "react";
import { StationSteps, type Step } from "@/components/StationSteps";
import { WorldShell } from "@/components/WorldShell";
import { LETTER_BY_ID, LETTER_STATIONS } from "@/content/letters";
import { shuffle } from "@/lib/random";
import { say, wrongSound } from "@/lib/audio";
import { useRequiredChild } from "@/lib/useChild";
import { GamePicker } from "./GamePicker";
import { LetterWall } from "./LetterWall";
import { Meet } from "./Meet";
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

/**
 * One station: learn the letters → mixed quiz → write them → games (the child picks) → the surprise.
 * A mixed station (station.mix): a wall of all letters so far, a 10-question mixed quiz, 3 random letters to write.
 */
export function StationPlayer({ stationId }: { stationId: string }) {
  const child = useRequiredChild();
  const [phase, setPhase] = useState("meet");
  const [reached, setReached] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  /** Steps finished in this visit (✓ in the steps bar). */
  const [finished, setFinished] = useState<string[]>([]);
  /** A mixed station writes 3 letters picked at random from everything so far. */
  const [writeIds] = useState(() => {
    const st = LETTER_STATIONS.find((s) => s.id === stationId);
    return st?.mix ? shuffle(st.letterIds).slice(0, 3) : (st?.letterIds ?? []);
  });

  if (!child) return <WorldShell>{null}</WorldShell>;

  const index = LETTER_STATIONS.findIndex((s) => s.id === stationId);
  const station = LETTER_STATIONS[index];
  const letters = station.letterIds.map((id) => LETTER_BY_ID[id]);
  // A station done before: every game is open right away (replay any part).
  // Practice mode: every step is open, in any order. Otherwise: a station done before opens all its games.
  const furthest = PRACTICE_MODE
    ? STEPS.length - 1
    : (reached ?? (child.done.includes(`letters/${stationId}`) ? STEPS.length - 2 : 0));

  /** A step was completed (not just left): mark it ✓ and move on. */
  const finish = (from: string, to: string) => {
    const now = finished.includes(from) ? finished : [...finished, from];
    setFinished(now);
    // Steps skipped in practice mode come before the prize: go to the first one not done yet.
    const missing = STEPS.find((st) => st.id !== "done" && !now.includes(st.id));
    go(to === "done" && missing && !child.done.includes(`letters/${stationId}`) ? missing.id : to);
  };
  const go = (id: string) => {
    const i = STEPS.findIndex((s) => s.id === id);
    setReached(Math.max(furthest, i));
    setPhase(id);
    setRun((r) => r + 1);
  };

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <StationSteps
        steps={STEPS}
        current={phase}
        reached={furthest}
        finished={finished}
        // The prize is earned: it opens only after every other step (or if the station was finished before).
        locked={
          child.done.includes(`letters/${stationId}`) || STEPS.every((s) => s.id === "done" || finished.includes(s.id)) ? [] : ["done"]
        }
        onLocked={() => {
          wrongSound();
          say("locked");
        }}
        onPick={go}
      />

      <div key={run} className="flex flex-1 flex-col">
        {phase === "meet" &&
          (station.mix ? (
            <LetterWall letterIds={station.letterIds} onDone={() => finish("meet", "quiz")} />
          ) : (
            <Meet letters={letters} onDone={() => finish("meet", "quiz")} />
          ))}
        {phase === "quiz" && <LetterQuiz build={() => buildQuizItems(stationId)} child={child} onDone={() => finish("quiz", "write")} />}
        {phase === "write" && <WriteStep letterIds={writeIds} child={child} onDone={() => finish("write", "play")} />}
        {phase === "play" && (
          <GamePicker stationId={stationId} letterIds={station.letterIds} child={child} onFinish={() => finish("play", "done")} />
        )}
        {phase === "done" && (
          <StationDone
            child={child}
            stationKey={`letters/${stationId}`}
            items={station.mix ? [] : letters.map((l) => ({ id: l.id, label: l.char }))}
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
