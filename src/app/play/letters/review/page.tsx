"use client";

import Link from "next/link";
import { useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { LetterQuiz } from "@/components/LetterQuiz";
import { WorldShell } from "@/components/WorldShell";
import { buildReviewItems } from "@/content/games";
import { LETTERS, LETTER_STATIONS } from "@/content/letters";
import { line } from "@/content/voice";
import { sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { useRequiredChild } from "@/lib/useChild";
import { openAll } from "@/lib/progress";

/** 🎲 The surprise round: 6 quick questions chosen for this child (struggles first, then spaced review). */
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
