"use client";

import Link from "next/link";
import { useState } from "react";
import { StationSteps, type Step } from "@/components/StationSteps";
import { WorldShell } from "@/components/WorldShell";
import { LETTER_BY_ID, LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { useRequiredChild } from "@/lib/useChild";
import { BubblesGame } from "./BubblesGame";
import { FindGame } from "./FindGame";
import { Meet } from "./Meet";
import { StartsGame } from "./StartsGame";
import { StationDone } from "@/components/StationDone";

const STEPS: Step[] = [
  { id: "meet", icon: "📖", label: "לוֹמְדִים" },
  { id: "find", icon: "🎯", label: "מוֹצְאִים" },
  { id: "starts", icon: "🖼️", label: "מִלִּים" },
  { id: "bubbles", icon: "🫧", label: "בּוּעוֹת" },
  { id: "done", icon: "🎁", label: "פְּרָס" },
];

/** One station: learn the letters → find the letter → which word starts with it → bubbles → sticker. */
export function StationPlayer({ stationId }: { stationId: string }) {
  const child = useRequiredChild();
  const [phase, setPhase] = useState("meet");
  const [reached, setReached] = useState<number | null>(null);
  const [run, setRun] = useState(0);

  if (!child) return <WorldShell>{null}</WorldShell>;

  const index = LETTER_STATIONS.findIndex((s) => s.id === stationId);
  const station = LETTER_STATIONS[index];
  const letters = station.letterIds.map((id) => LETTER_BY_ID[id]);
  const world = WORLDS[child.worldId];
  // A station done before: every game is open right away (replay any part).
  const furthest = reached ?? (child.done.includes(`letters/${stationId}`) ? STEPS.length - 2 : 0);

  const go = (id: string) => {
    const i = STEPS.findIndex((s) => s.id === id);
    setReached(Math.max(furthest, i));
    setPhase(id);
    setRun((r) => r + 1);
  };

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <StationSteps steps={STEPS} current={phase} reached={furthest} onPick={go} />

      <div key={run} className="flex flex-1 flex-col">
        {phase === "meet" && <Meet letters={letters} gender={child.gender} onDone={() => go("find")} />}
        {phase === "find" && <FindGame stationId={stationId} child={child} onDone={() => go("starts")} />}
        {phase === "starts" && <StartsGame stationId={stationId} child={child} onDone={() => go("bubbles")} />}
        {phase === "bubbles" && <BubblesGame stationId={stationId} gender={child.gender} onDone={() => go("done")} />}
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
