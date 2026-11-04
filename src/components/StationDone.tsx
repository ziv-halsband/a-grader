"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { line } from "@/content/voice";
import { actions, type Child } from "@/lib/store";

/** End of a station: sticker (first time only), what we practiced, and three clear choices. Stopping is fine. */
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
  useEffect(() => {
    actions.completeStation(child.id, stationKey, sticker);
  }, [child.id, stationKey, sticker]);

  const g = child.gender;
  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-6">
      <Confetti count={60} />
      <Guide compact lines={isNew ? [line("sticker", g), line("station-done", g)] : [line("station-done", g)]} />

      <div className="anim-sticker flex h-44 w-44 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[7rem] shadow-2xl">
        {sticker}
      </div>

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

      <div className="mt-auto flex w-full max-w-md flex-col gap-3">
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
