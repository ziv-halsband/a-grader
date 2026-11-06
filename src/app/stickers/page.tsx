"use client";

import Link from "next/link";
import { useState } from "react";
import { BuddyAvatar } from "@/components/BuddyAvatar";
import { NameSignature } from "@/components/NameSignature";
import { canWriteName, nameText } from "@/content/myName";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { WorldShell } from "@/components/WorldShell";
import { line } from "@/content/voice";
import { ACCESSORIES, ACCESSORY_BY_ID, BUDDY_BY_ID, HEROES, ownedBuddies } from "@/content/buddies";
import { ownedGifts, rewardPath, type StationReward } from "@/content/rewards";
import { WORLDS } from "@/content/worlds";
import { boingSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";

const SECTIONS: { id: StationReward["section"]; title: string }[] = [
  { id: "letters", title: "עוֹלַם הָאוֹתִיּוֹת" },
  { id: "kamatz-patach", title: "עוֹלַם הַקָּמָץ וְהַפַּתָּח" },
];

/**
 * My room. On top: the buddy, dressed with the gifts the child owns (tap to put on / take off; one per spot),
 * and the friends (the first pick + heroes; tap to take one along). Below: the collection path, one card per
 * station in map order with exactly what that station gives (sticker + gift, and a hero on milestones):
 * collected ✓ in full color, or faded with 🔒 until the station is finished.
 */
export default function MyRoomPage() {
  const child = useRequiredChild();
  const [wiggle, setWiggle] = useState(0);
  if (!child) return <WorldShell>{null}</WorldShell>;
  const world = WORLDS[child.worldId];
  const gifts = ownedGifts(world, child);
  const wardrobe = ACCESSORIES.filter((a) => gifts.includes(a.id));
  const wearing = child.wearing ?? [];
  const path = rewardPath(world);
  const owned = ownedBuddies(child);

  const toggle = (id: string) => {
    const a = ACCESSORY_BY_ID[id];
    const on = wearing.includes(id);
    const next = on ? wearing.filter((x) => x !== id) : [...wearing.filter((x) => ACCESSORY_BY_ID[x]?.spot !== a.spot), id];
    actions.updateChild(child.id, { wearing: next });
    boingSound();
    cheer("giggle");
    setWiggle((w) => w + 1);
  };

  const pick = (id: string) => {
    if (id !== child.buddy) actions.switchBuddy(child.id, id);
    boingSound();
    cheer("party");
    setWiggle((w) => w + 1);
  };

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה" }}>
      <h1 className="nikud mt-3 text-center text-4xl font-extrabold drop-shadow-[0_2px_0_rgb(255_255_255/0.8)]">הַחֶדֶר שֶׁלִּי</h1>
      <div className="mt-3">
        <Guide compact once lines={[wardrobe.length ? line("room-dress", child.gender) : "room-empty"]} />
      </div>

      {child.buddy && (
        <section className="mx-auto mt-4 flex w-full max-w-md flex-col items-center gap-3 px-6">
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] shadow-xl">
            <span key={wiggle} className={wiggle ? "anim-wiggle inline-block" : "anim-bob inline-block"}>
              <BuddyAvatar buddy={child.buddy} wearing={wearing} size={112} />
            </span>
          </div>

          {/* ✍️ The name on the door: in the child's own hand once written, else an invitation to write it. */}
          {child.nameSignature ? (
            <div className="-mt-6 flex h-16 items-center rounded-2xl border-4 border-white bg-amber-50 px-4 shadow-lg">
              <NameSignature signature={child.nameSignature} className="h-12 w-auto max-w-[16rem]" />
            </div>
          ) : canWriteName(child.nickname) ? (
            <Link
              href="/play/letters/write/name"
              aria-label="לכתוב את השם שלי"
              className="btn-3d -mt-6 flex h-14 items-center gap-2 border-2 border-dashed border-white bg-white/60 px-4 text-xl font-extrabold"
            >
              <span aria-hidden>✍️</span>
              <span className="text-slate-400">{nameText(child.nickname)}</span>
            </Link>
          ) : null}

          <h2 className="nikud mt-2 text-xl font-extrabold">👕 לְהַלְבִּישׁ אֶת {BUDDY_BY_ID[child.buddy]?.name}</h2>
          <div className="flex flex-wrap justify-center gap-3" aria-label="ארון הבגדים">
            {wardrobe.map((a) => {
              const on = wearing.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  aria-pressed={on}
                  className={`btn-3d flex h-20 w-20 items-center justify-center border-4 text-5xl ${
                    on ? "border-white bg-accent" : "border-white bg-[var(--card)]"
                  }`}
                >
                  {a.emoji}
                </button>
              );
            })}
            {/* Nothing to wear yet: the closed surprise is a door to the stations, where the gifts are. */}
            {wardrobe.length === 0 && (
              <Link
                href="/play/letters"
                aria-label="לתחנות, שם מחכות המתנות"
                className="btn-3d relative flex h-20 w-20 items-center justify-center border-4 border-dashed border-white bg-white/50 text-5xl"
              >
                <span aria-hidden className="anim-bob inline-block">{world.surprise.closed}</span>
                <PointHand className="-bottom-6 -left-5" />
              </Link>
            )}
          </div>

          <h2 className="nikud mt-3 text-xl font-extrabold">🦸 הַחֲבֵרִים שֶׁלִּי</h2>
          <div className="flex flex-wrap justify-center gap-3" aria-label="החברים שלי">
            {owned.map((id) => {
              const active = child.buddy === id;
              return (
                <button
                  key={id}
                  onClick={() => pick(id)}
                  aria-pressed={active}
                  aria-label={BUDDY_BY_ID[id]?.name}
                  className={`btn-3d flex h-20 w-20 items-center justify-center border-4 text-5xl ${
                    active ? "border-white bg-accent" : "border-white bg-[var(--card)]"
                  }`}
                >
                  {BUDDY_BY_ID[id]?.emoji}
                </button>
              );
            })}
            {HEROES.filter((h) => !owned.includes(h.id)).map((h) => (
              <div
                key={h.id}
                aria-label="חבר שעוד מחכה"
                className="relative flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-dashed border-white/80 bg-white/30 text-5xl"
              >
                <span className="brightness-0 opacity-25">{h.emoji}</span>
                <span className="nikud absolute -bottom-2 -left-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-1 text-base font-extrabold shadow">
                  {h.hint}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-8 w-full max-w-md px-4 pb-28">
        <h2 className="nikud text-center text-2xl font-extrabold">🗺️ הָאוֹסֶף שֶׁלִּי</h2>
        <p className="mx-auto mt-1 max-w-xs text-center text-sm opacity-70">
          כל תחנה במפה נותנת מדבקה ומתנה לחבר. ✓ נאסף · 🔒 מחכה בתחנה
        </p>

        {SECTIONS.map((sec) => (
          <div key={sec.id} className="mt-5">
            <h3 className="nikud mb-2 text-lg font-extrabold opacity-80">{sec.title}</h3>
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {path
                .filter((r) => r.section === sec.id)
                .map((r, i) => (
                  <RewardCard key={r.key} reward={r} have={child.done.includes(r.key)} index={i} />
                ))}
            </ol>
          </div>
        ))}
      </section>
    </WorldShell>
  );
}

/** One station on the collection path: its name, and the sticker + gift (+ hero) it gives. */
function RewardCard({ reward: r, have, index }: { reward: StationReward; have: boolean; index: number }) {
  return (
    <li
      className={`relative flex flex-col items-center gap-1 rounded-3xl border-4 px-2 pb-2 pt-3 ${
        have ? "anim-sticker border-white bg-[var(--card)] shadow-lg" : "border-dashed border-white/80 bg-white/30"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span
        className={`absolute -top-3 -left-2 flex h-8 w-8 items-center justify-center rounded-full text-base font-extrabold shadow ${
          have ? "bg-green-500 text-white" : "bg-white"
        }`}
        aria-label={have ? "נאסף" : "עוד לא"}
      >
        {have ? "✓" : "🔒"}
      </span>
      <span className="nikud text-center text-lg font-extrabold leading-tight [word-spacing:0.4em]">
        {r.title}
      </span>
      <span className={`flex items-center gap-1 ${have ? "" : "opacity-30 grayscale"}`}>
        <span className="text-4xl">{r.sticker}</span>
        <span className="text-xl font-bold opacity-50">+</span>
        <span className="text-3xl">{ACCESSORY_BY_ID[r.gift]?.emoji}</span>
      </span>
      {r.hero && (
        <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 text-2xl">
          <span className={have ? "" : "brightness-0 opacity-40"}>{r.hero.emoji}</span>
        </span>
      )}
    </li>
  );
}
