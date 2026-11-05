"use client";

import Link from "next/link";
import { useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { gardenPlants, unseenBlooms } from "@/components/LetterGarden";
import { PointHand } from "@/components/PointHand";
import { LetterQuiz } from "@/components/LetterQuiz";
import { WorldShell } from "@/components/WorldShell";
import { GARDEN } from "@/content/garden";
import { buildReviewItems } from "@/content/games";
import { LETTERS, LETTER_STATIONS } from "@/content/letters";
import { line } from "@/content/voice";
import { sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import type { Child } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";
import { openAll } from "@/lib/progress";

/**
 * 🎲 The daily practice: 6 quick questions chosen for this child (weak letters first, then spaced review).
 * At the end, a letter that just bloomed shows up with a hand pointing to the garden.
 */
export default function ReviewPage() {
  const child = useRequiredChild();
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  if (!child) return <WorldShell>{null}</WorldShell>;

  const finished = [
    ...new Set(LETTER_STATIONS.filter((s) => child.done.includes(`letters/${s.id}`)).flatMap((s) => s.letterIds)),
  ];
  // Practice mode with little played yet: review the whole alphabet.
  const reached = openAll(child) && finished.length < 3 ? LETTERS.map((l) => l.id) : finished;

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      {reached.length < 3 ? (
        <p className="nikud m-auto text-2xl font-bold">🎲 עוֹד תַּחֲנָה אַחַת, וְהַהַפְתָּעָה נִפְתַּחַת!</p>
      ) : done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24">
          <Confetti count={60} />
          <Guide compact lines={[line("champ", child.gender)]} />
          <span className="anim-sticker text-[8rem] leading-none">🎲</span>
          <NewBlooms child={child} />
          <div className="flex w-full max-w-md gap-3">
            <button
              onClick={() => {
                setDone(false);
                setRound((r) => r + 1);
              }}
              className="btn-3d flex-1 bg-accent px-5 py-4 text-xl font-extrabold text-white"
            >
              🔁 עוֹד סִבּוּב
            </button>
            <Link href="/play/letters" className="btn-3d flex-1 bg-white px-5 py-4 text-center text-xl font-bold">
              🗺️ לַמַּפָּה
            </Link>
          </div>
        </div>
      ) : (
        <>
          <LetterQuiz
            key={round}
            intro={["review-intro"]}
            build={() => buildReviewItems(reached, child.letters, Date.now())}
            child={child}
            onDone={() => {
              sparkleSound();
              cheer("party");
              setDone(true);
            }}
          />
        </>
      )}
    </WorldShell>
  );
}

/** Letters that bloomed and weren't celebrated in the garden yet: a glowing button to go and see them. */
function NewBlooms({ child }: { child: Child }) {
  const fresh = unseenBlooms(child);
  if (!fresh.length) return null;
  const look = GARDEN[child.worldId];
  const plants = gardenPlants(child).filter((p) => fresh.includes(p.id));
  return (
    <Link
      href="/play/letters/garden"
      aria-label={look.title}
      className="btn-3d anim-glow relative flex items-center gap-3 bg-white px-6 py-3 text-4xl"
    >
      {plants.slice(0, 4).map((p) => (
        <span key={p.id} className="flex flex-col items-center">
          <span aria-hidden>{p.plant}</span>
          <span className="text-2xl font-extrabold">{p.char}</span>
        </span>
      ))}
      <PointHand className="-bottom-6 -left-4" />
    </Link>
  );
}
