"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import type { QuizItem } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { actions, type Child } from "@/lib/store";

/**
 * A letters quiz (station quiz, surprise round), mixing two kinds of questions:
 *  🎯 "where is ב?" (letter by its name; scored, it feeds "knows on their own")
 *  🖼️ "what starts with ב?" (letter → the sound at the start of a word; practice)
 */
export function LetterQuiz({
  build,
  child,
  intro,
  onDone,
}: {
  build: () => QuizItem[];
  child: Child;
  /** Said before the first question. */
  intro?: string[];
  onDone: () => void;
}) {
  const [items] = useState(() =>
    build().map((it) => {
      const l = LETTER_BY_ID[it.target];
      if (it.kind === "find") return { ...it, prompt: ["find-prompt", `letter-${it.target}`], size: "big" as const };
      return {
        ...it,
        prompt: [l.final ? "ends-prompt" : "starts-prompt", `letter-${it.target}`],
        size: "picture" as const,
        cue: (
          <span className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/80 text-7xl font-extrabold text-accent-2 shadow">
            {l.char}
          </span>
        ),
      };
    }),
  );
  const pic = (it: QuizItem) => it.kind === "starts";
  return (
    <ChoiceGame
      items={items}
      intro={intro}
      gender={child.gender}
      renderOption={(id, it) => (pic(it) ? <span aria-hidden>{LETTER_BY_ID[id].emoji}</span> : LETTER_BY_ID[id].char)}
      optionLabel={(id, it) => (pic(it) ? LETTER_BY_ID[id].word : `האות ${LETTER_BY_ID[id].name}`)}
      reveal={(it) => (pic(it) ? ["here-word", `word-${it.target}`] : ["here-it-is", `letter-${it.target}`])}
      explainWrong={(it, tapped) => {
        const w = LETTER_BY_ID[tapped];
        if (!pic(it)) return ["this-is", `letter-${tapped}`];
        const g = w.wordF ? "f" : "m";
        return ["almost", `word-${tapped}`, `${w.final ? "ends" : "starts"}-with-${g}`, `letter-${tapped}`];
      }}
      onSolved={(it) => (pic(it) ? [`word-${it.target}`] : [`letter-${it.target}`])}
      onAnswer={(it, result, misses) => {
        if (it.kind === "find") actions.recordLetter(child.id, it.target, result, misses);
      }}
      onDone={onDone}
    />
  );
}
