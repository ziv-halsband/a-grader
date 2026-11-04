"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { ACCESSORY_BY_ID, accessoryForCount } from "@/content/buddies";
import { line } from "@/content/voice";
import { WORLDS } from "@/content/worlds";
import { sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions, type Child } from "@/lib/store";

/**
 * End of a station. The first time: a chest (island) / an egg (garden) to tap open, out fly the sticker
 * and a gift for the buddy. Replays: straight to the choices. Stopping is always fine.
 */
export function StationDone({
  child,
  stationKey,
  sticker,
  items,
  mapHref,
  onReplay,
  next,
}: {
  child: Child;
  stationKey: string;
  sticker: string;
  /** What we practiced in this station (letters, syllables…). */
  items: { id: string; label: string }[];
  mapHref: string;
  onReplay: () => void;
  next: ReactNode;
}) {
  // Read once, before completing, so a replay doesn't pretend to give a new sticker.
  const [isNew] = useState(() => !child.done.includes(stationKey));
  const [gift] = useState(() => accessoryForCount(child.done.length).id);
  const [stage, setStage] = useState<"closed" | "opening" | "open">(isNew ? "closed" : "open");
  const world = WORLDS[child.worldId];
  const g = child.gender;

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    sparkleSound();
    setTimeout(() => {
      actions.completeStation(child.id, stationKey, sticker, gift);
      setStage("open");
      cheer("party");
    }, 900);
  };

  if (stage !== "open") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6">
        <Guide compact lines={["chest-what"]} />
        <button
          onClick={open}
          aria-label={world.surprise.label}
          className={`relative flex h-56 w-56 items-center justify-center text-[10rem] leading-none drop-shadow-xl ${
            stage === "opening" ? "anim-chest" : "anim-bob"
          }`}
        >
          {world.surprise.closed}
          {stage === "closed" && <PointHand className="-bottom-2 -left-2" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-6">
      <Confetti count={60} />
      <Guide
        compact
        lines={isNew ? [line("station-done", g), "buddy-gift"] : [line("station-done", g)]}
      />

      {isNew ? (
        <div className="flex items-end gap-6">
          <div className="anim-fly flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[6rem] shadow-2xl">
            {sticker}
          </div>
          <div
            className="anim-fly flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white/80 text-6xl shadow-xl"
            style={{ animationDelay: "250ms" }}
            aria-label="מתנה לחבר"
          >
            {ACCESSORY_BY_ID[gift].emoji}
          </div>
        </div>
      ) : (
        <div className="anim-sticker flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[6rem] shadow-2xl">
          {world.surprise.open}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3" aria-label="מה תרגלנו">
        {items.map((x) => (
          <span
            key={x.id}
            className="nikud flex h-16 min-w-16 items-center justify-center rounded-2xl bg-white px-2 text-4xl font-extrabold shadow"
          >
            {x.label}
          </span>
        ))}
      </div>

      <div className="mt-auto flex w-full max-w-md flex-col gap-3 pb-24">
        {next}
        <div className="flex gap-3">
          <button onClick={onReplay} className="btn-3d flex-1 bg-white px-5 py-4 text-xl font-bold">
            🔁 עוֹד פַּעַם
          </button>
          <Link href={mapHref} className="btn-3d flex-1 bg-white px-5 py-4 text-center text-xl font-bold">
            🗺️ לַמַּפָּה
          </Link>
        </div>
      </div>
    </div>
  );
}
