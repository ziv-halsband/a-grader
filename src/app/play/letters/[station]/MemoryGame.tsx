"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { LETTER_BY_ID } from "@/content/letters";
import { line } from "@/content/voice";
import { WORLDS, type World } from "@/content/worlds";
import type { Gender } from "@/content/worlds";
import { rightSound, say, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { shuffle } from "@/lib/random";

type Card = { key: string; letterId: string; face: "letter" | "picture" };

/** Memory pairs: each letter with its picture. Flip two; a match stays open and says "ב, like בַּיִת". Not scored. */
export function MemoryGame({
  letterIds,
  gender,
  worldId,
  onDone,
}: {
  letterIds: string[];
  gender: Gender;
  worldId: World["id"];
  onDone: () => void;
}) {
  const [cards] = useState<Card[]>(() =>
    shuffle(
      shuffle(letterIds)
        .slice(0, 3)
        .flatMap((id) => [
          { key: `${id}-l`, letterId: id, face: "letter" as const },
          { key: `${id}-p`, letterId: id, face: "picture" as const },
        ]),
    ),
  );
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const pairs = cards.length / 2;
  const back = WORLDS[worldId].stationIcons[0];

  const flip = async (c: Card) => {
    if (busy.current || open.includes(c.key) || matched.includes(c.letterId)) return;
    const next = [...open, c.key];
    setOpen(next);
    if (next.length < 2) {
      if (c.face === "letter") say(`letter-${c.letterId}`);
      else say(`word-${c.letterId}`);
      return;
    }
    busy.current = true;
    const [a, b] = next.map((k) => cards.find((x) => x.key === k)!);
    if (a.letterId === b.letterId) {
      rightSound();
      cheer("happy");
      const m = [...matched, a.letterId];
      setMatched(m);
      setOpen([]);
      busy.current = false;
      await say(`letter-${a.letterId}`, "like", `word-${a.letterId}`);
      if (m.length === pairs && alive.current) {
        cheer("party");
        await say(line("champ", gender));
        if (alive.current) onDone();
      }
    } else {
      setTimeout(() => {
        if (!alive.current) return;
        wrongSound();
        setOpen([]);
        busy.current = false;
      }, 1000);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <Guide compact once lines={[line("memory-intro", gender)]} />
      <div className="mx-auto grid w-full max-w-md flex-1 grid-cols-3 place-content-center gap-3 px-4">
        {cards.map((c, i) => {
          const shown = open.includes(c.key) || matched.includes(c.letterId);
          const l = LETTER_BY_ID[c.letterId];
          return (
            <button
              key={c.key}
              onClick={() => flip(c)}
              aria-label={shown ? (c.face === "letter" ? l.name : l.word) : `קלף ${i + 1}`}
              className={`btn-3d anim-rise flex aspect-[3/4] items-center justify-center rounded-3xl text-6xl font-extrabold transition-all duration-300 sm:text-7xl ${
                shown ? "bg-white" : "bg-accent text-white"
              } ${matched.includes(c.letterId) ? "scale-95 ring-4 ring-green-400" : ""}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {shown ? (c.face === "letter" ? l.char : <span aria-hidden>{l.emoji}</span>) : <span className="text-4xl opacity-80">{back}</span>}
            </button>
          );
        })}
      </div>
      {matched.length === pairs && <Confetti count={40} />}
    </div>
  );
}
