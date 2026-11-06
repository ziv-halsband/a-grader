"use client";

import { useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { NIKUD_SYLLABLE_BY_ID, NIKUD_WORD_BY_ID, shownSyllable } from "@/content/nikud";
import { buildFindItems, buildStartsItems, buildReadItems } from "@/content/nikudGames";
import { line } from "@/content/voice";
import { actions, type Child } from "@/lib/store";
import { Glyph } from "./Glyph";

const sy = (id: string) => NIKUD_SYLLABLE_BY_ID[id];
const wordOf = (id: string) => NIKUD_WORD_BY_ID[sy(id).word];

/** 👂 "Where is בֵּ?": hear a syllable, tap it. Scored: this is the real check. Then the word that starts with it. */
export function FindGame({
  worldId,
  stationId,
  child,
  onDone,
}: {
  worldId: string;
  stationId: string;
  child: Child;
  onDone: () => void;
}) {
  const [items] = useState(() =>
    buildFindItems(worldId, stationId).map((it) => ({ ...it, prompt: ["where", sy(it.target).audio] })),
  );
  return (
    <div data-game="find" className="flex flex-1 flex-col">
      <ChoiceGame
        items={items}
        intro={["find-sound"]}
        gender={child.gender}
        renderOption={(id, it) => (
          <span data-syl={id} className={sy(id).pre ? "text-6xl sm:text-7xl" : ""}>
            <Glyph s={sy(id)} mark={it.marks[id]} className="pb-4" />
          </span>
        )}
        optionLabel={(id, it) => shownSyllable(sy(id), it.marks[id])}
        reveal={({ target: t }) => ["here-sound", sy(t).audio]}
        explainWrong={(_, tapped) => ["it-is", sy(tapped).audio]}
        onSolved={({ target: t }) => [sy(t).audio, "like", wordOf(t).audio]}
        onAnswer={({ target: t }, result, misses) => actions.recordItem(child.id, `syl:${t}`, result, misses)}
        onDone={onDone}
      />
    </div>
  );
}

/** 🖼️ "Which word starts like בֵּ?": the syllable is shown, the child taps the picture. Practice (not scored). */
export function StartsGame({
  worldId,
  stationId,
  child,
  onDone,
}: {
  worldId: string;
  stationId: string;
  child: Child;
  onDone: () => void;
}) {
  const [items] = useState(() =>
    buildStartsItems(worldId, stationId).map((it) => ({
      ...it,
      prompt: ["syl-starts-prompt", sy(it.target).audio],
      cue: (
        <span className="flex h-36 min-w-36 items-center justify-center rounded-[2rem] bg-white/90 px-4 pb-5 text-8xl font-extrabold shadow">
          <Glyph s={sy(it.target)} />
        </span>
      ),
    })),
  );
  return (
    <div data-game="starts" className="flex flex-1 flex-col">
      <ChoiceGame
        items={items}
        gender={child.gender}
        size="picture"
        renderOption={(id) => (
          <span data-syl={id} aria-hidden>
            {wordOf(id).emoji}
          </span>
        )}
        optionLabel={(id) => wordOf(id).word}
        reveal={({ target: t }) => ["here-word", wordOf(t).audio]}
        explainWrong={(_, tapped) => [
          "almost",
          wordOf(tapped).audio,
          wordOf(tapped).f ? "starts-like-f" : "starts-like-m",
          sy(tapped).audio,
        ]}
        onSolved={({ target: t }) => [wordOf(t).audio]}
        onAnswer={() => {}}
        onDone={onDone}
      />
    </div>
  );
}

/**
 * 🔍 Reading alone: the word is shown and NOT spoken. The child reads it and taps its picture.
 * The word is said only after the answer (or when the guide shows it).
 */
export function ReadGame({ wordIds, child, onDone }: { wordIds: string[]; child: Child; onDone: () => void }) {
  const w = (id: string) => NIKUD_WORD_BY_ID[id];
  const [items] = useState(() =>
    buildReadItems(wordIds).map((it) => ({
      ...it,
      prompt: ["read-prompt"],
      cue: (
        <span className="nikud rounded-[2rem] bg-white px-8 py-2 text-7xl font-extrabold shadow sm:text-8xl">
          {w(it.target).word}
        </span>
      ),
    })),
  );
  return (
    <div data-game="read" className="flex flex-1 flex-col">
      <ChoiceGame
        items={items}
        intro={[line("read-alone", child.gender)]}
        gender={child.gender}
        size="picture"
        renderOption={(id) => (
          <span data-word={id} aria-hidden>
            {w(id).emoji}
          </span>
        )}
        optionLabel={(id) => `תמונה ${wordIds.indexOf(id) + 1}`}
        reveal={({ target: t }) => ["it-says", w(t).audio]}
        explainWrong={(_, tapped) => ["almost", w(tapped).f ? "this-is" : "it-is", w(tapped).audio]}
        onSolved={({ target: t }) => [w(t).audio]}
        onAnswer={({ target: t }, result, misses) => actions.recordItem(child.id, `read:${t}`, result, misses)}
        onDone={onDone}
      />
    </div>
  );
}
