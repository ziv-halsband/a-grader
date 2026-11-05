"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { gardenPlants, unseenBlooms, WeekDays, type GardenPlant } from "@/components/LetterGarden";
import { PointHand } from "@/components/PointHand";
import { WorldShell } from "@/components/WorldShell";
import { GARDEN } from "@/content/garden";
import { line } from "@/content/voice";
import { boingSound, say, sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions, type Child } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";

/**
 * 🌱 The letter garden (🌴 the island, in the island world): every letter is a plant the child owns.
 * seed = not met yet, sprout = practicing, flower = knows it (lib/mastery.ts). Tap a plant: it wiggles and says
 * its name. A first bloom is celebrated once (confetti, the buddy dances). This week's days played are shown as
 * 💧/☀️, never as a streak that can break.
 */
export default function GardenPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <Garden child={child} />
    </WorldShell>
  );
}

function Garden({ child }: { child: Child }) {
  const look = GARDEN[child.worldId];
  // Captured when the garden opens, so the celebration stays on screen after the blooms are marked seen.
  const [fresh] = useState(() => unseenBlooms(child));
  const [now] = useState(() => Date.now());
  const [tapped, setTapped] = useState<{ id: string; n: number } | null>(null);
  const plants = gardenPlants(child);

  useEffect(() => {
    if (!fresh.length) return;
    // After the buddy (rendered after this) starts listening.
    const t = setTimeout(() => {
      sparkleSound();
      cheer("party");
      actions.markBloomsSeen(child.id, fresh);
    }, 700);
    return () => clearTimeout(t);
  }, [fresh, child.id]);

  const tap = (p: GardenPlant) => {
    boingSound();
    cheer("giggle");
    setTapped((t) => ({ id: p.id, n: (t?.n ?? 0) + 1 }));
    say(`letter-${p.id}`);
  };

  const bed = (list: GardenPlant[]) => (
    <div className="mx-3 flex max-w-[39rem] flex-wrap justify-center gap-x-1 gap-y-3 rounded-[2rem] bg-white/35 px-2 py-3 shadow-inner">
      {list.map((p) => (
        <Plant
          key={p.id}
          p={p}
          soil={look.soil}
          fresh={fresh.includes(p.id)}
          wiggle={tapped?.id === p.id ? tapped.n : 0}
          hand={fresh[0] === p.id}
          onTap={() => tap(p)}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-4 py-4 pb-28">
      {fresh.length > 0 && <Confetti count={60} />}
      <h1 className="nikud text-center text-3xl font-extrabold">{look.title}</h1>
      <Guide compact once={!fresh.length} lines={[fresh.length ? look.bloomLine : line(look.intro, child.gender)]} />
      <WeekDays child={child} look={look} now={now} />
      {bed(plants.filter((p) => !p.final))}
      {bed(plants.filter((p) => p.final))}
      <Link href="/play/letters/review" className="btn-3d nikud mt-2 bg-white px-6 py-3 text-xl font-extrabold">
        🎲 הָאִמּוּן הַיּוֹמִי
      </Link>
    </div>
  );
}

/** One letter's plant: the plant on a mound of earth (sand), the letter on a little sign. */
function Plant({
  p,
  soil,
  fresh,
  wiggle,
  hand,
  onTap,
}: {
  p: GardenPlant;
  soil: string;
  fresh: boolean;
  wiggle: number;
  hand: boolean;
  onTap: () => void;
}) {
  const stage = { new: "seed", practicing: "sprout", knows: "bloom" }[p.mastery];
  const size = p.mastery === "knows" ? "text-5xl sm:text-6xl" : p.mastery === "practicing" ? "text-4xl sm:text-5xl" : "text-xl sm:text-2xl";
  return (
    <button
      onClick={onTap}
      aria-label={`${p.char}: ${{ new: "זרע", practicing: "נבט", knows: "פרח" }[p.mastery]}`}
      data-stage={stage}
      className="relative flex min-h-28 w-[4.5rem] flex-col items-center justify-end rounded-3xl pt-2 active:scale-95 sm:w-24"
    >
      {fresh && (
        <span aria-hidden className="anim-twinkle absolute top-0 right-1 text-2xl">
          ✨
        </span>
      )}
      <span
        key={wiggle}
        aria-hidden
        className={`inline-block origin-bottom leading-none ${size} ${wiggle ? "anim-wiggle" : fresh ? "anim-bloom" : ""} ${
          p.mastery === "new" ? "opacity-70" : ""
        }`}
      >
        {p.plant}
      </span>
      {/* the mound */}
      <span aria-hidden className="-mt-1 block h-3 w-16 rounded-[50%] opacity-60" style={{ background: soil }} />
      <span className="mt-1 rounded-lg bg-white/90 px-2 text-2xl font-extrabold shadow-sm">{p.char}</span>
      {hand && <PointHand className="-bottom-5 -left-1" />}
    </button>
  );
}
