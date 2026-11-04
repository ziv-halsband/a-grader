"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BuddyAvatar } from "@/components/BuddyAvatar";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { ACCESSORY_BY_ID, type Hero } from "@/content/buddies";
import { rewardFor } from "@/content/rewards";
import { line } from "@/content/voice";
import { WORLDS } from "@/content/worlds";
import { sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions, type Child } from "@/lib/store";

/**
 * End of a station. The first time: a chest (island) / an egg (garden) to tap open, out fly the sticker
 * and a gift for the buddy; on a milestone station a new hero then joins. Replays: the sticker this station
 * gave (already collected ✓) and the buddy dancing, then the choices. Stopping is always fine.
 */
export function StationDone({
  child,
  stationKey,
  items,
  mapHref,
  onReplay,
  next,
}: {
  child: Child;
  stationKey: string;
  /** What we practiced in this station (letters, syllables…). */
  items: { id: string; label: string }[];
  mapHref: string;
  onReplay: () => void;
  next: ReactNode;
}) {
  // Read once, before completing, so a replay doesn't pretend to give a new sticker.
  const [isNew] = useState(() => !child.done.includes(stationKey));
  const [stage, setStage] = useState<"closed" | "opening" | "open">(isNew ? "closed" : "open");
  const [heroArrives, setHeroArrives] = useState(false);
  const world = WORLDS[child.worldId];
  const g = child.gender;
  // This station's own pair (content/rewards.ts): the same sticker + gift the map and my room show.
  const reward = rewardFor(world, stationKey);
  const sticker = reward?.sticker ?? "⭐";
  const gift = reward?.gift ?? "star";
  const hero = reward?.hero;

  useEffect(() => {
    if (!isNew) cheer("party");
  }, [isNew]);

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    sparkleSound();
    setTimeout(() => {
      actions.completeStation(child.id, stationKey, sticker, gift);
      setStage("open");
      cheer("party");
      if (hero) setTimeout(() => setHeroArrives(true), 1800);
    }, 900);
  };

  if (stage !== "open") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6">
        <Guide compact lines={["chest-what"]} />
        <button
          onClick={open}
          aria-label={world.surprise.label}
          className={`relative flex h-56 w-56 items-center justify-center text-[10rem] leading-none drop-shadow-xl ${
            stage === "opening" ? "anim-chest" : "anim-bob"
          }`}
        >
          {world.surprise.closed}
          {stage === "closed" && <PointHand className="-bottom-2 -left-2" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-6">
      {isNew && <Confetti count={60} />}
      <Guide
        compact
        lines={isNew ? [line("station-done", g), "buddy-gift"] : [line("station-done", g)]}
      />

      {isNew ? (
        <div className="flex items-end gap-6">
          <div className="anim-fly flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[6rem] shadow-2xl">
            {sticker}
          </div>
          <div
            className="anim-fly flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white/80 text-6xl shadow-xl"
            style={{ animationDelay: "250ms" }}
            aria-label="מתנה לחבר"
          >
            {ACCESSORY_BY_ID[gift].emoji}
          </div>
        </div>
      ) : (
        // Replay: what this station gave, already in the collection, and the buddy dancing.
        <div className="flex items-end gap-6">
          <div className="anim-sticker relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[6rem] shadow-2xl">
            {sticker}
            <span
              className="absolute -top-1 -left-1 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-green-500 text-2xl font-extrabold text-white shadow"
              aria-label="כבר אספת"
            >
              ✓
            </span>
          </div>
          {child.buddy && (
            <span className="anim-dance-loop inline-block origin-bottom">
              <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={100} />
            </span>
          )}
          {hero && child.buddy !== hero.id && (
            <span className="anim-dance-loop inline-block origin-bottom" style={{ animationDelay: "300ms" }}>
              <BuddyAvatar buddy={hero.id} size={80} />
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3" aria-label="מה תרגלנו">
        {items.map((x) => (
          <span
            key={x.id}
            className="nikud flex h-16 min-w-16 items-center justify-center rounded-2xl bg-white px-2 text-4xl font-extrabold shadow"
          >
            {x.label}
          </span>
        ))}
      </div>

      <div className="mt-auto flex w-full max-w-md flex-col gap-3 pb-24">
        {next}
        <div className="flex gap-3">
          <button onClick={onReplay} className="btn-3d flex-1 bg-white px-5 py-4 text-xl font-bold">
            🔁 עוֹד פַּעַם
          </button>
          <Link href={mapHref} className="btn-3d flex-1 bg-white px-5 py-4 text-center text-xl font-bold">
            🗺️ לַמַּפָּה
          </Link>
        </div>
      </div>

      {heroArrives && hero && <HeroArrives child={child} hero={hero} onClose={() => setHeroArrives(false)} />}
    </div>
  );
}

/**
 * A milestone: a new hero joins. First a silhouette to tap (one more surprise), then the hero, colored,
 * with confetti. 🙌 takes the hero along as the buddy; 👍 keeps the current one (switch any time in my room).
 */
function HeroArrives({ child, hero, onClose }: { child: Child; hero: Hero; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const reveal = () => {
    if (shown) return;
    sparkleSound();
    setShown(true);
    cheer("party");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      {shown && <Confetti count={80} />}
      <div className="anim-rise flex w-full max-w-md flex-col items-center gap-5 rounded-[2.5rem] bg-[var(--card)] p-6 shadow-2xl">
        <Guide compact lines={shown ? ["new-hero"] : []} />
        <button
          onClick={reveal}
          aria-label={shown ? hero.name : "חבר חדש"}
          className={`relative flex h-52 w-52 items-center justify-center rounded-full border-8 border-white bg-white/70 shadow-xl ${
            shown ? "" : "anim-bob"
          }`}
        >
          <span
            key={shown ? "on" : "off"}
            className={`inline-block text-[8rem] leading-none ${shown ? "anim-sticker" : "brightness-0 opacity-40"}`}
          >
            {hero.emoji}
          </span>
          {!shown && <PointHand className="-bottom-2 -left-2" />}
        </button>
        {shown && <p className="nikud text-3xl font-extrabold">{hero.name}</p>}
        {shown && (
          <div className="anim-rise flex w-full gap-3">
            <button
              onClick={() => {
                actions.switchBuddy(child.id, hero.id);
                cheer("party");
                onClose();
              }}
              aria-label={`${hero.name} בא איתי`}
              className="btn-3d relative flex-1 bg-accent px-5 py-4 text-4xl text-white"
            >
              🙌 {hero.emoji}
              <PointHand className="-bottom-6 left-2" />
            </button>
            <button onClick={onClose} aria-label="סגור" className="btn-3d flex-1 bg-white px-5 py-4 text-4xl">
              👍
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
