"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { line } from "@/content/voice";
import { boingSound } from "@/lib/audio";
import type { Child } from "@/lib/store";
import { BubblesGame } from "./BubblesGame";
import { MemoryGame } from "./MemoryGame";

const GAMES = [
  { id: "bubbles", icon: "🫧", label: "בּוּעוֹת" },
  { id: "memory", icon: "🃏", label: "זִכָּרוֹן" },
] as const;
type GameId = (typeof GAMES)[number]["id"];

/**
 * The child picks the game (choice = ownership). After a game: back to the menu with a ✓,
 * play another, or go on to the surprise.
 */
export function GamePicker({
  stationId,
  letterIds,
  child,
  onFinish,
}: {
  stationId: string;
  letterIds: string[];
  child: Child;
  onFinish: () => void;
}) {
  const [game, setGame] = useState<GameId | null>(null);
  const [played, setPlayed] = useState<GameId[]>([]);
  const [round, setRound] = useState(0);
  const back = () => {
    setPlayed((p) => (game && !p.includes(game) ? [...p, game] : p));
    setGame(null);
  };

  if (game === "bubbles") return <BubblesGame key={round} stationId={stationId} gender={child.gender} onDone={back} />;
  if (game === "memory")
    return <MemoryGame key={round} letterIds={letterIds} gender={child.gender} worldId={child.worldId} onDone={back} />;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-4 pb-28">
      <Guide compact once lines={[line("pick-game", child.gender)]} />
      <div className="grid w-full max-w-md grid-cols-2 gap-4 px-6">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            onClick={() => {
              boingSound();
              setRound((r) => r + 1);
              setGame(g.id);
            }}
            className="btn-3d anim-rise relative flex aspect-square flex-col items-center justify-center gap-2 bg-white"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="anim-bob inline-block text-7xl" style={{ animationDelay: `${i * 400}ms` }}>
              {g.icon}
            </span>
            <span className="nikud text-2xl font-extrabold">{g.label}</span>
            {played.includes(g.id) && (
              <span className="absolute -top-2 -left-2 rounded-full bg-green-500 px-2 text-lg text-white">✓</span>
            )}
          </button>
        ))}
      </div>
      {played.length > 0 && (
        <button onClick={onFinish} className="btn-3d anim-rise nikud bg-accent px-8 py-4 text-2xl font-extrabold text-white">
          🎁 לַהַפְתָּעָה ←
        </button>
      )}
    </div>
  );
}
