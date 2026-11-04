"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { buildSyllableItems, buildSyllableStartsItems } from "@/content/games";
import { KAMATZ, SYLLABLE_BY_ID } from "@/content/kamatz";
import { line, startsWordId } from "@/content/voice";
import { actions, type Child } from "@/lib/store";
import { Syllable } from "./Syllable";

/** "Where is בָּ?": hear a sound, tap the syllable. Scored (this is the real check). */
export function SyllableFind({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [items] = useState(() =>
    buildSyllableItems(stationId).map((it) => ({ ...it, prompt: ["where", `syl-${it.target}`] })),
  );
  // One mark per syllable for the whole game, so a card doesn't change shape between questions.
  const marks = items[0].marks;
  return (
    <ChoiceGame
      items={items}
      intro={[line("syl-find-intro", child.gender)]}
      gender={child.gender}
      renderOption={(id) => <Syllable base={SYLLABLE_BY_ID[id].base} mark={marks[id]} className="pb-4" />}
      optionLabel={(id) => SYLLABLE_BY_ID[id].base + KAMATZ}
      reveal={({ target: t }) => ["here-sound", `syl-${t}`]}
      explainWrong={(_, tapped) => ["it-is", `syl-${tapped}`]}
      onAnswer={({ target: t }, result, misses) => actions.recordItem(child.id, `syl:${t}`, result, misses)}
      onDone={onDone}
    />
  );
}

/** "Which word starts like בָּ?": the sound at the start of a word. Practice (not scored). */
export function SyllableStarts({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [items] = useState(() =>
    buildSyllableStartsItems(stationId).map((it) => ({
      ...it,
      prompt: ["syl-starts-prompt", `syl-${it.target}`],
      cue: (
        <span className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-white/80 pb-4 text-8xl font-extrabold shadow">
          <Syllable base={SYLLABLE_BY_ID[it.target].base} mark="kamatz" />
        </span>
      ),
    })),
  );
  return (
    <ChoiceGame
      items={items}
      gender={child.gender}
      size="picture"
      renderOption={(id) => <span aria-hidden>{SYLLABLE_BY_ID[id].starts!.emoji}</span>}
      optionLabel={(id) => SYLLABLE_BY_ID[id].starts!.word}
      reveal={({ target: t }) => ["here-word", startsWordId(t)]}
      explainWrong={(_, tapped) => {
        const x = SYLLABLE_BY_ID[tapped];
        return ["almost", startsWordId(tapped), x.starts?.f ? "starts-like-f" : "starts-like-m", `syl-${tapped}`];
      }}
      onSolved={({ target: t }) => [startsWordId(t)]}
      onAnswer={() => {}}
      onDone={onDone}
    />
  );
}
