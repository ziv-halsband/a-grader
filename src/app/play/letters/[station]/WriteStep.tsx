"use client";

import { useState } from "react";
import { LetterWriter } from "@/components/LetterWriter";
import { LETTER_BY_ID } from "@/content/letters";
import { actions, type Child } from "@/lib/store";

/** The station's letters, one after another: watch → trace → write alone. */
export function WriteStep({ letterIds, child, onDone }: { letterIds: string[]; child: Child; onDone: () => void }) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-2 flex justify-center gap-2" aria-hidden>
        {letterIds.map((id, j) => (
          <span
            key={id}
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl font-extrabold ${
              j < i ? "bg-accent text-white" : j === i ? "bg-white ring-2 ring-accent" : "bg-white/50"
            }`}
          >
            {LETTER_BY_ID[id].char}
          </span>
        ))}
      </div>
      <LetterWriter
        key={letterIds[i]}
        letterId={letterIds[i]}
        gender={child.gender}
        onDone={(helped) => {
          actions.recordItem(child.id, `write:${letterIds[i]}`, helped ? "withHelp" : "firstTry", 0);
          if (i + 1 < letterIds.length) setI(i + 1);
          else onDone();
        }}
      />
    </div>
  );
}
