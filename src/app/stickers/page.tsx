"use client";

import { useState } from "react";
import { BuddyAvatar } from "@/components/BuddyAvatar";
import { WorldShell } from "@/components/WorldShell";
import { ACCESSORIES, ACCESSORY_BY_ID } from "@/content/buddies";
import { LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { boingSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";

/**
 * My room: the buddy (big), its wardrobe (tap to put on / take off; one item per spot), and the sticker book.
 * Empty slots show what is still waiting, so there is always something to look forward to.
 */
export default function MyRoomPage() {
  const child = useRequiredChild();
  const [wiggle, setWiggle] = useState(0);
  if (!child) return <WorldShell>{null}</WorldShell>;
  const world = WORLDS[child.worldId];
  const wardrobe = child.wardrobe ?? [];
  const wearing = child.wearing ?? [];

  const toggle = (id: string) => {
    const a = ACCESSORY_BY_ID[id];
    const on = wearing.includes(id);
    const next = on ? wearing.filter((x) => x !== id) : [...wearing.filter((x) => ACCESSORY_BY_ID[x]?.spot !== a.spot), id];
    actions.updateChild(child.id, { wearing: next });
    boingSound();
    cheer("giggle");
    setWiggle((w) => w + 1);
  };

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">הַחֶדֶר שֶׁלִּי</h1>

      {child.buddy && (
        <section className="mx-auto mt-4 flex w-full max-w-md flex-col items-center gap-4 px-6">
          <div className="flex h-48 w-48 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] shadow-xl">
            <span key={wiggle} className={wiggle ? "anim-wiggle inline-block" : "anim-bob inline-block"}>
              <BuddyAvatar buddy={child.buddy} wearing={wearing} size={110} />
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3" aria-label="ארון הבגדים">
            {ACCESSORIES.map((a) => {
              const have = wardrobe.includes(a.id);
              const on = wearing.includes(a.id);
              return (
                <button
                  key={a.id}
                  disabled={!have}
                  onClick={() => toggle(a.id)}
                  aria-pressed={on}
                  className={`btn-3d flex h-16 w-16 items-center justify-center text-4xl ${
                    on ? "bg-accent ring-4 ring-white" : have ? "bg-white" : "border-2 border-dashed border-white/80 bg-white/30"
                  }`}
                >
                  <span className={have ? "" : "opacity-20 grayscale"}>{a.emoji}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-4 gap-3 px-6 pb-28">
        {LETTER_STATIONS.map((s, i) => {
          const have = child.done.includes(`letters/${s.id}`);
          return (
            <div
              key={s.id}
              className={`flex aspect-square flex-col items-center justify-center rounded-3xl border-4 ${
                have ? "anim-sticker border-white bg-[var(--card)] shadow-lg" : "border-dashed border-white/80 bg-white/30"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`text-4xl ${have ? "" : "opacity-20 grayscale"}`}>{world.stickers[i % world.stickers.length]}</span>
              <span className="mt-1 text-xs font-bold opacity-70">{s.title}</span>
            </div>
          );
        })}
      </div>
    </WorldShell>
  );
}
