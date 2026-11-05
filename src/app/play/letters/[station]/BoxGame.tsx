"use client";

import { useEffect, useRef, useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { buildBoxItems } from "@/content/games";
import { LETTER_BY_ID } from "@/content/letters";
import { line } from "@/content/voice";
import { boingSound, say, sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions, type Child } from "@/lib/store";

const BOX_COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#3b82f6", "#14b8a6", "#eab308"];

/**
 * 🎁 Open a box: numbered surprise boxes. A tapped box shakes and opens on a picture; the guide says the word
 * and asks which letter it starts with (ends with, for final letters), 3 big letters to choose from.
 * The reverse of "what starts with ב?": sound → letter. An opened box stays open with a ⭐. Scored as its own
 * question kind ("first-letter"), so it counts toward real mastery.
 */
export function BoxGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [boxes] = useState(() => buildBoxItems(stationId));
  const [opened, setOpened] = useState<string[]>([]);
  const [opening, setOpening] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const open = (key: string) => {
    if (opening || opened.includes(key)) return;
    boingSound();
    setOpening(key);
    setTimeout(() => {
      if (!alive.current) return;
      sparkleSound();
      setOpening(null);
      setCurrent(key);
    }, 950);
  };

  const solved = async () => {
    const next = [...opened, current!];
    setOpened(next);
    setCurrent(null);
    if (next.length < boxes.length) return;
    cheer("party");
    await say(line("champ", child.gender));
    await new Promise((r) => setTimeout(r, 1500));
    if (alive.current) onDone();
  };

  const box = boxes.find((b) => b.key === current);
  if (box) {
    const l = LETTER_BY_ID[box.target];
    const item = {
      ...box,
      prompt: [`word-${box.target}`, l.final ? "box-which-end" : "box-which"],
      // By ear: the written word would give the letter away.
      unseen: [`word-${box.target}`],
      cue: (
        <span className="anim-fly relative flex h-32 w-32 items-center justify-center rounded-[2rem] border-8 border-yellow-300 bg-white text-8xl shadow-xl sm:h-40 sm:w-40 sm:text-9xl">
          <span aria-hidden>{l.emoji}</span>
          <span className="absolute -top-5 -right-3 rotate-12 text-4xl" aria-hidden>
            🎁
          </span>
        </span>
      ),
    };
    return (
      <ChoiceGame
        key={box.key}
        items={[item]}
        progress={false}
        gender={child.gender}
        renderOption={(id) => LETTER_BY_ID[id].char}
        optionLabel={(id) => `האות ${LETTER_BY_ID[id].name}`}
        reveal={(it) => ["here-it-is", `letter-${it.target}`]}
        explainWrong={(_, tapped) => ["this-is", `letter-${tapped}`]}
        onSolved={(it) => [`letter-${it.target}`, "like", `word-${it.target}`]}
        onAnswer={(it, result, misses) => actions.recordLetter(child.id, it.target, result, misses, "first-letter")}
        onDone={solved}
      />
    );
  }

  const done = opened.length === boxes.length;
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <Guide compact once lines={["box-intro"]} />
      <div className="mx-auto grid w-full max-w-md flex-1 grid-cols-3 place-content-center gap-4 px-4">
        {boxes.map((b, i) => {
          const isOpen = opened.includes(b.key);
          const l = LETTER_BY_ID[b.target];
          return (
            <button
              key={b.key}
              onClick={() => open(b.key)}
              disabled={isOpen}
              aria-label={isOpen ? `${l.word}, ${l.name}` : `תיבה ${i + 1}`}
              className={`btn-3d anim-rise relative flex aspect-square flex-col items-center justify-center ${
                isOpen ? "bg-yellow-50 ring-4 ring-yellow-300" : "text-white"
              }`}
              style={{
                animationDelay: `${i * 70}ms`,
                background: isOpen ? undefined : `linear-gradient(160deg, ${BOX_COLORS[i % BOX_COLORS.length]}, color-mix(in srgb, ${BOX_COLORS[i % BOX_COLORS.length]} 70%, black))`,
              }}
            >
              {isOpen ? (
                <>
                  <span className="text-5xl sm:text-6xl" aria-hidden>
                    {l.emoji}
                  </span>
                  <span className="text-3xl font-extrabold text-accent-2">{l.char}</span>
                  <span className="anim-sticker absolute -top-3 -left-3 text-3xl" aria-hidden>
                    ⭐
                  </span>
                </>
              ) : (
                <>
                  <span className={`inline-block text-6xl sm:text-7xl ${opening === b.key ? "anim-chest" : ""}`} aria-hidden>
                    🎁
                  </span>
                  <span className="absolute top-1.5 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-extrabold text-[var(--ink)] shadow">
                    {i + 1}
                  </span>
                  {opened.length === 0 && i === 0 && !opening && <PointHand className="-bottom-5 -left-3" />}
                </>
              )}
            </button>
          );
        })}
      </div>
      {done && <Confetti count={50} />}
    </div>
  );
}
