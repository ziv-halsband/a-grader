"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { buildFindItems } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { line } from "@/content/voice";
import { actions, type Child } from "@/lib/store";

/** "Where is the letter X?": the check that the child knows the letters by name. */
export function FindGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [items] = useState(() =>
    buildFindItems(stationId).map((it) => ({ ...it, prompt: ["find-prompt", `letter-${it.target}`] })),
  );
  return (
    <ChoiceGame
      items={items}
      intro={[line("find-intro", child.gender)]}
      gender={child.gender}
      renderOption={(id) => LETTER_BY_ID[id].char}
      optionLabel={(id) => `האות ${LETTER_BY_ID[id].name}`}
      reveal={(t) => ["here-it-is", `letter-${t}`]}
      onAnswer={(t, result, misses) => actions.recordLetter(child.id, t, result, misses)}
      onDone={onDone}
    />
  );
}
