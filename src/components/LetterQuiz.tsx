"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import type { QuizItem } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { actions, type Child } from "@/lib/store";

/** A quiz question ready for ChoiceGame: the prompt to say, the card size, and the letter shown above pictures. */
export function toChoiceItem(it: QuizItem) {
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
}

/**
 * Everything ChoiceGame needs to run letter questions (shared by the quiz, the quiz show and the wheel):
 * how options look, what the guide says on a wrong tap ("כִּמְעַט! קוֹף מַתְחִיל בָּאוֹת קוֹף"), and scoring
 * (every answer is scored with its question kind; see lib/mastery.ts).
 */
export function letterQuizProps(child: Child) {
  const pic = (it: QuizItem) => it.kind === "starts";
  return {
    gender: child.gender,
    renderOption: (id: string, it: QuizItem) =>
      pic(it) ? <span aria-hidden>{LETTER_BY_ID[id].emoji}</span> : LETTER_BY_ID[id].char,
    optionLabel: (id: string, it: QuizItem) => (pic(it) ? LETTER_BY_ID[id].word : `האות ${LETTER_BY_ID[id].name}`),
    reveal: (it: QuizItem) => (pic(it) ? ["here-word", `word-${it.target}`] : ["here-it-is", `letter-${it.target}`]),
    explainWrong: (it: QuizItem, tapped: string) => {
      const w = LETTER_BY_ID[tapped];
      if (!pic(it)) return ["this-is", `letter-${tapped}`];
      const g = w.wordF ? "f" : "m";
      return ["almost", `word-${tapped}`, `${w.final ? "ends" : "starts"}-with-${g}`, `letter-${tapped}`];
    },
    onSolved: (it: QuizItem) => (pic(it) ? [`word-${it.target}`] : [`letter-${it.target}`]),
    // Every kind is scored with its kind: real mastery needs first-try answers in 2 kinds, on 2 days.
    onAnswer: (it: QuizItem, result: "firstTry" | "withHelp", misses: number) =>
      actions.recordLetter(child.id, it.target, result, misses, it.kind ?? "find"),
  };
}

/**
 * A letters quiz (station quiz, surprise round), mixing two kinds of questions:
 *  🎯 "where is ב?" (letter by its name)
 *  🖼️ "what starts with ב?" (letter → the sound at the start of a word)
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
  const [items] = useState(() => build().map(toChoiceItem));
  return <ChoiceGame items={items} intro={intro} {...letterQuizProps(child)} onDone={onDone} />;
}
