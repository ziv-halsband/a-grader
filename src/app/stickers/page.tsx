"use client";

import { WorldShell } from "@/components/WorldShell";
import { LETTER_STATIONS } from "@/content/letters";
import { WORLDS } from "@/content/worlds";
import { useRequiredChild } from "@/lib/useChild";

/** The sticker book: one slot per station; empty slots show what is still waiting. */
export default function StickersPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  const world = WORLDS[child.worldId];

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">הַמַּדְבֵּקוֹת שֶׁלִּי</h1>
      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-3 gap-4 px-6 pb-10">
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
              <span className={`text-6xl ${have ? "" : "opacity-20 grayscale"}`}>{world.stickers[i % world.stickers.length]}</span>
              <span className="mt-1 text-sm font-bold opacity-70">{s.title}</span>
            </div>
          );
        })}
      </div>
    </WorldShell>
  );
}
