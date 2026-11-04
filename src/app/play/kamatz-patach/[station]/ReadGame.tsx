"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { buildReadItems } from "@/content/games";
import { READ_WORD_BY_ID } from "@/content/kamatz";
import { line } from "@/content/voice";
import { actions, type Child } from "@/lib/store";

/**
 * Real reading: the word is shown and NOT spoken. The child reads it and taps the picture.
 * The word is spoken only after the answer (or when the guide shows it).
 */
export function ReadGame({ wordIds, child, onDone }: { wordIds: string[]; child: Child; onDone: () => void }) {
  const [items] = useState(() =>
    buildReadItems(wordIds).map((it) => ({
      ...it,
      prompt: ["read-prompt"],
      cue: (
        <span className="nikud rounded-[2rem] bg-white px-8 py-2 text-7xl font-extrabold shadow sm:text-8xl">
          {READ_WORD_BY_ID[it.target].word}
        </span>
      ),
    })),
  );
  return (
    <ChoiceGame
      items={items}
      intro={[line("read-intro", child.gender)]}
      gender={child.gender}
      size="picture"
      renderOption={(id) => <span aria-hidden>{READ_WORD_BY_ID[id].emoji}</span>}
      optionLabel={(id) => `תמונה ${wordIds.indexOf(id) + 1}`}
      reveal={({ target: t }) => ["it-says", `rw-${t}`]}
      explainWrong={(_, tapped) => ["almost", READ_WORD_BY_ID[tapped].f ? "this-is" : "it-is", `rw-${tapped}`]}
      onSolved={({ target: t }) => [`rw-${t}`]}
      onAnswer={({ target: t }, result, misses) => actions.recordItem(child.id, `read:${t}`, result, misses)}
      onDone={onDone}
    />
  );
}
