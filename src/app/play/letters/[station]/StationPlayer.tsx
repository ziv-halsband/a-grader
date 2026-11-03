"use client";

import Link from "next/link";
import { useState } from "react";
import { WorldShell } from "@/components/WorldShell";
import { LETTER_BY_ID, LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { useRequiredChild } from "@/lib/useChild";
import { BubblesGame } from "./BubblesGame";
import { FindGame } from "./FindGame";
import { Meet } from "./Meet";
import { StationDone } from "./StationDone";

type Phase = "meet" | "find" | "bubbles" | "done";
const PHASES: { id: Phase; icon: string }[] = [
  { id: "meet", icon: "👀" },
  { id: "find", icon: "🎯" },
  { id: "bubbles", icon: "🫧" },
  { id: "done", icon: "🎁" },
];

/** One station: meet the letters → find the letter → pop the bubbles → sticker. */
export function StationPlayer({ stationId }: { stationId: string }) {
  const child = useRequiredChild();
  const [phase, setPhase] = useState<Phase>("meet");
  const [run, setRun] = useState(0);

  if (!child) return <WorldShell>{null}</WorldShell>;

  const index = LETTER_STATIONS.findIndex((s) => s.id === stationId);
  const station = LETTER_STATIONS[index];
  const letters = station.letterIds.map((id) => LETTER_BY_ID[id]);
  const world = WORLDS[child.worldId];

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <nav aria-label="שלבי התחנה" className="mt-3 flex justify-center gap-2">
        {PHASES.map((p) => {
          const at = PHASES.findIndex((x) => x.id === phase);
          const i = PHASES.findIndex((x) => x.id === p.id);
          return (
            <span
              key={p.id}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition ${
                i === at ? "scale-125 bg-white shadow" : i < at ? "bg-white/70" : "bg-white/30 grayscale"
              }`}
            >
              {p.icon}
            </span>
          );
        })}
      </nav>

      <div key={run} className="flex flex-1 flex-col">
        {phase === "meet" && <Meet letters={letters} gender={child.gender} onDone={() => setPhase("find")} />}
        {phase === "find" && (
          <FindGame stationId={stationId} child={child} onDone={() => setPhase("bubbles")} />
        )}
        {phase === "bubbles" && (
          <BubblesGame stationId={stationId} gender={child.gender} onDone={() => setPhase("done")} />
        )}
        {phase === "done" && (
          <StationDone
            child={child}
            stationKey={`letters/${stationId}`}
            sticker={world.stickers[index % world.stickers.length]}
            letters={letters}
            onReplay={() => {
              setRun((r) => r + 1);
              setPhase("meet");
            }}
            next={
              LETTER_STATIONS[index + 1] ? (
                <Link
                  href={`/play/letters/${LETTER_STATIONS[index + 1].id}`}
                  className="btn-3d flex-1 bg-accent px-5 py-4 text-center text-2xl font-extrabold text-white"
                >
                  הָלְאָה ←
                </Link>
              ) : null
            }
          />
        )}
      </div>
    </WorldShell>
  );
}
