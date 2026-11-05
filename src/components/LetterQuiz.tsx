"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import type { QuizItem } from "@/content/games";
import { LETTER_BY_ID, type Letter } from "@/content/letters";
import { boingSound, say } from "@/lib/audio";
import { actions, type Child } from "@/lib/store";

/**
 * 👂 The "by ear" question's cue: the picture of the word the guide said, with an ear to hear it again.
 * Without the picture (the harder variant) it is a big ear; the picture pops in once the question is solved.
 */
function HearCue({ letter, hidden }: { letter: Letter; hidden: boolean }) {
  const [taps, setTaps] = useState(0);
  return (
    <button
      onClick={() => {
        boingSound();
        setTaps((t) => t + 1);
        say(`word-${letter.id}`);
      }}
      aria-label={hidden ? "לשמוע שוב" : `${letter.word}, לשמוע שוב`}
      className={`btn-3d relative flex h-32 w-32 items-center justify-center rounded-[2rem] sm:h-36 sm:w-36 ${
        hidden ? "anim-glow bg-gradient-to-b from-white to-indigo-100" : "bg-white/90"
      }`}
    >
      <span key={`${taps}-${hidden}`} className={`inline-block ${taps ? "anim-wiggle" : hidden ? "" : "anim-sticker"} ${hidden ? "text-7xl" : "text-8xl"}`} aria-hidden>
        {hidden ? "👂" : letter.emoji}
      </span>
      {!hidden && (
        <span className="absolute -bottom-2 -left-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent-2 text-2xl shadow" aria-hidden>
          👂
        </span>
      )}
    </button>
  );
}

/** A quiz question ready for ChoiceGame: the prompt to say, the card size, and the letter shown above pictures. */
export function toChoiceItem(it: QuizItem) {
  const l = LETTER_BY_ID[it.target];
  if (it.kind === "find") return { ...it, prompt: ["find-prompt", `letter-${it.target}`], size: "big" as const };
  // By ear: the word, then "which is the first letter?" ("the last letter?" for a final letter).
  if (it.kind === "hear")
    return {
      ...it,
      prompt: [`word-${it.target}`, l.final ? "box-which-end" : "box-which"],
      unseen: [`word-${it.target}`],
      size: "big" as const,
      cue: (solved: boolean) => <HearCue letter={l} hidden={!!it.noPicture && !solved} />,
    };
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
    // By ear: name → word ("בֵּית כְּמוֹ בַּיִת"), so the child hears the letter's name inside the word.
    onSolved: (it: QuizItem) =>
      pic(it) ? [`word-${it.target}`] : it.kind === "hear" ? [`letter-${it.target}`, "like", `word-${it.target}`] : [`letter-${it.target}`],
    // Every kind is scored with its kind: real mastery needs first-try answers in 2 kinds, on 2 days.
    onAnswer: (it: QuizItem, result: "firstTry" | "withHelp", misses: number) =>
      actions.recordLetter(child.id, it.target, result, misses, it.kind ?? "find"),
  };
}

/**
 * A letters quiz (station quiz, surprise round), mixing three kinds of questions:
 *  🎯 "where is ב?" (letter by its name)
 *  🖼️ "what starts with ב?" (letter → the sound at the start of a word)
 *  👂 "בַּיִת: which letter?" (the sound at the start of a word → the letter)
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
