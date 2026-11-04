"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { line } from "@/content/voice";
import { boingSound } from "@/lib/audio";
import type { Child } from "@/lib/store";
import { BoxGame } from "./BoxGame";
import { BubblesGame } from "./BubblesGame";
import { MemoryGame } from "./MemoryGame";
import { ShowGame } from "./ShowGame";
import { WheelGame } from "./WheelGame";

const GAMES = [
  { id: "bubbles", icon: "🫧", label: "בּוּעוֹת", bg: "from-sky-100 to-white" },
  { id: "memory", icon: "🃏", label: "זִכָּרוֹן", bg: "from-rose-100 to-white" },
  { id: "show", icon: "📺", label: "שַׁעֲשׁוּעוֹן", bg: "from-violet-200 to-white" },
  { id: "wheel", icon: "🎡", label: "גַּלְגַּל הַמַּזָּל", bg: "from-amber-100 to-white" },
  { id: "boxes", icon: "🎁", label: "תֵּבוֹת הַפְתָּעָה", bg: "from-emerald-100 to-white" },
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
  if (game === "show") return <ShowGame key={round} stationId={stationId} child={child} onDone={back} />;
  if (game === "wheel") return <WheelGame key={round} stationId={stationId} child={child} onDone={back} />;
  if (game === "boxes") return <BoxGame key={round} stationId={stationId} child={child} onDone={back} />;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-4 pb-28">
      <Guide compact once lines={[line("pick-game", child.gender)]} />
      {/* 2 per row on a phone (the 5th centered), 3 + 2 on a wider screen. */}
      <div className="flex w-full max-w-2xl flex-wrap justify-center gap-4 px-4">
        {GAMES.map((g, i) => (
          <button
            key={g.id}
            onClick={() => {
              boingSound();
              setRound((r) => r + 1);
              setGame(g.id);
            }}
            className={`btn-3d anim-rise relative flex aspect-square w-[calc(50%-0.5rem)] max-w-44 flex-col items-center justify-center gap-1 bg-gradient-to-b sm:w-44 ${g.bg}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="anim-bob inline-block text-6xl sm:text-7xl" style={{ animationDelay: `${i * 400}ms` }}>
              {g.icon}
            </span>
            <span className="nikud px-1 text-center text-xl font-extrabold sm:text-2xl">{g.label}</span>
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
