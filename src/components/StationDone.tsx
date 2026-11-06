"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { BuddyAvatar } from "@/components/BuddyAvatar";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { ACCESSORY_BY_ID, type Hero } from "@/content/buddies";
import { rewardFor } from "@/content/rewards";
import { line } from "@/content/voice";
import { WORLDS } from "@/content/worlds";
import { sparkleSound, starSound } from "@/lib/audio";
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
  stars = 3,
}: {
  child: Child;
  stationKey: string;
  /** What we practiced in this station (letters, syllables…). */
  items: { id: string; label: string }[];
  mapHref: string;
  onReplay: () => void;
  next: ReactNode;
  /** How many ⭐ were collected on the way (one per step): they drop into the chest/egg before it opens. */
  stars?: number;
}) {
  // Read once, before completing, so a replay doesn't pretend to give a new sticker.
  const [isNew] = useState(() => !child.done.includes(stationKey));
  const [stage, setStage] = useState<"closed" | "opening" | "open">(isNew ? "closed" : "open");
  /** Stars already inside the chest (they drop in one by one, then the 👆 shows it can be opened). */
  const [inside, setInside] = useState(0);
  const filled = inside >= stars;
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

  // The collected stars drop in: one every ~0.4s, each with a "ting" and a bump of the chest.
  useEffect(() => {
    if (!isNew || stage !== "closed" || filled) return;
    const t = setTimeout(
      () => {
        starSound();
        setInside((n) => n + 1);
      },
      inside === 0 ? 700 : 420,
    );
    return () => clearTimeout(t);
  }, [isNew, stage, filled, inside]);

  const open = () => {
    if (stage !== "closed") return;
    setInside(stars);
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
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-6">
        <Guide compact lines={["chest-what"]} />
        {/* The stars collected on the way, waiting above the chest; each drops in. */}
        <div aria-hidden className="relative mt-4 h-16 w-full max-w-sm">
          {Array.from({ length: stars }, (_, k) => (
            <span
              key={k}
              className={`absolute top-0 left-1/2 -ml-7 inline-block w-14 text-center text-5xl ${k < inside ? "anim-star-in" : ""}`}
              style={{ "--x": `${(k - (stars - 1) / 2) * 64}px`, transform: `translateX(${(k - (stars - 1) / 2) * 64}px)` } as CSSProperties}
            >
              <span className={`inline-block ${k < inside ? "" : "anim-bob"}`} style={{ animationDelay: `${k * 300}ms` }}>
                ⭐
              </span>
            </span>
          ))}
        </div>
        <button
          key={stage === "closed" && !filled ? `bump-${inside}` : stage}
          onClick={open}
          aria-label={world.surprise.label}
          data-filled={filled ? "yes" : "no"}
          className={`relative flex h-56 w-56 items-center justify-center text-[10rem] leading-none drop-shadow-xl ${
            stage === "opening" ? "anim-chest" : filled ? "anim-prize-ready" : inside > 0 ? "anim-chest-bump" : ""
          }`}
        >
          {world.surprise.closed}
          {inside > 0 && (
            <span
              key={inside}
              aria-hidden
              className="anim-pop absolute -top-2 -right-2 flex items-center gap-1 rounded-full border-4 border-white bg-amber-400 px-3 py-1 text-2xl font-extrabold text-white shadow-lg"
            >
              ⭐{inside}
            </span>
          )}
          {stage === "closed" && filled && <PointHand className="-bottom-2 -left-2" />}
        </button>
      </div>
    );
  }

  const giftEmoji = ACCESSORY_BY_ID[gift]?.emoji ?? "⭐";
  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-6 py-6">
      {isNew && <Confetti count={60} />}
      <Guide
        compact
        lines={isNew ? [line("station-done", g), "buddy-gift"] : [line("station-done", g)]}
      />

      {isNew ? (
        // What was won, big and simple: a sticker for my room + a gift the buddy is already wearing.
        <div className="flex flex-wrap items-stretch justify-center gap-4" data-reveal="new">
          <div className="anim-fly flex w-44 flex-col items-center gap-2 rounded-[2rem] bg-white/85 p-4 shadow-xl">
            <span className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[5.5rem] shadow-lg">
              {sticker}
            </span>
            <span className="nikud text-xl font-extrabold">מַדְבֵּקָה חֲדָשָׁה</span>
          </div>
          <div
            className="anim-fly flex w-44 flex-col items-center gap-2 rounded-[2rem] bg-white/85 p-4 shadow-xl"
            style={{ animationDelay: "350ms" }}
            aria-label="מתנה לחבר"
          >
            <span className="flex h-32 items-end justify-center gap-1">
              <span className="anim-bob mb-6 inline-block text-5xl">{giftEmoji}</span>
              <span aria-hidden className="mb-10 text-2xl opacity-60">
                ←
              </span>
              {child.buddy && (
                <span className="anim-dance-loop inline-block origin-bottom">
                  <BuddyAvatar buddy={child.buddy} wearing={[gift]} size={84} />
                </span>
              )}
            </span>
            <span className="nikud text-xl font-extrabold">מַתָּנָה לֶחָבֵר</span>
          </div>
        </div>
      ) : (
        // Replay: what this station gave, already in the collection, and the buddy dancing.
        <div className="flex flex-col items-center gap-3" data-reveal="collected">
          <div className="flex items-end gap-6">
            <div className="anim-sticker relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[5.5rem] shadow-2xl">
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
          <span className="nikud rounded-full bg-green-500 px-5 py-1 text-xl font-extrabold text-white shadow">
            ✓ כְּבָר בָּאוֹסֶף
          </span>
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
