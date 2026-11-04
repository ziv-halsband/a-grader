"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { buildStartsItems } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { line } from "@/content/voice";
import { type Child } from "@/lib/store";

/** "Which word starts with X?": letter → sound at the start of a word. Practice only (not scored). */
export function StartsGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [items] = useState(() =>
    buildStartsItems(stationId).map((it) => {
      const l = LETTER_BY_ID[it.target];
      return {
        ...it,
        prompt: [l.final ? "ends-prompt" : "starts-prompt", `letter-${it.target}`],
        cue: (
          <span className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/80 text-8xl font-extrabold text-accent-2 shadow">
            {l.char}
          </span>
        ),
      };
    }),
  );
  return (
    <ChoiceGame
      items={items}
      intro={[line("starts-intro", child.gender)]}
      gender={child.gender}
      size="picture"
      renderOption={(id) => <span aria-hidden>{LETTER_BY_ID[id].emoji}</span>}
      optionLabel={(id) => LETTER_BY_ID[id].word}
      reveal={(t) => ["here-word", `word-${t}`]}
      onSolved={(t) => [`word-${t}`]}
      onAnswer={() => {}}
      onDone={onDone}
    />
  );
}
