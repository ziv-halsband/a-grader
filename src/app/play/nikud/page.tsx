"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { WorldShell } from "@/components/WorldShell";
import { heroForStation } from "@/content/buddies";
import { NIKUD_WORLDS } from "@/content/nikud";
import { rewardFor } from "@/content/rewards";
import { WORLDS } from "@/content/worlds";
import { boingSound } from "@/lib/audio";
import { openAll, topicsDone } from "@/lib/progress";
import { useRequiredChild } from "@/lib/useChild";
import { Glyph } from "@/components/nikud/Glyph";

/**
 * The nikud station opened up: every vowel world as a big island card in teaching order, each in its own color,
 * with its stations' stickers (collected ones in color) and the hero it brings. A 👆 points at the next world.
 */
export default function NikudMapPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const world = WORLDS[child.worldId];
  const done = topicsDone(child);
  const cards = NIKUD_WORLDS.map((w, i) => {
    const prev = NIKUD_WORLDS[i - 1];
    const open = i === 0 || done[prev.id] || openAll(child);
    const last = w.stations[w.stations.length - 1];
    const hero = heroForStation(`${w.id}/${last.id}`);
    const got = w.stations.filter((s) => child.done.includes(`${w.id}/${s.id}`)).length;
    return { w, open, hero, got, finished: done[w.id] };
  });
  const next = cards.find((c) => c.open && !c.finished)?.w.id;

  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה הגדולה" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold drop-shadow-sm">עוֹלַם הַנִּקּוּד</h1>
      <div className="mt-4">
        <Guide compact once lines={["nikud-map"]} />
      </div>
      <ol className="mx-auto mt-6 grid w-full max-w-2xl grid-cols-2 gap-4 px-4 pb-28">
        {cards.map(({ w, open, hero, got, finished }, i) => {
          const body = (
            <>
              <span className="absolute -top-3 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white text-lg font-extrabold shadow" aria-hidden>
                {i + 1}
              </span>
              {hero && (
                <span className="absolute -top-4 -left-3 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white/90 text-4xl shadow" aria-hidden>
                  <span className={finished ? "" : "brightness-0 opacity-40"}>{hero.emoji}</span>
                </span>
              )}
              <span
                className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white pb-3 text-7xl font-extrabold shadow-inner"
                style={{ "--accent": w.color } as CSSProperties}
              >
                <Glyph s={{ base: "בּ", mark: w.marks[0].id }} />
              </span>
              <span className="nikud text-center text-2xl font-extrabold leading-tight text-white drop-shadow">{w.title}</span>
              <span className="flex gap-1 rounded-full bg-white/80 px-2 py-0.5 text-2xl" aria-label={`${got} מתוך ${w.stations.length}`}>
                {w.stations.map((s) => {
                  const have = child.done.includes(`${w.id}/${s.id}`);
                  return (
                    <span key={s.id} className={have ? "" : "opacity-30 grayscale"}>
                      {rewardFor(world, `${w.id}/${s.id}`)?.sticker ?? "⭐"}
                    </span>
                  );
                })}
              </span>
              {!open && <span className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-white/50 text-5xl">🔒</span>}
              {w.id === next && <PointHand className="-bottom-5 -left-3" />}
            </>
          );
          const cls = `btn-3d anim-rise relative flex flex-col items-center gap-2 rounded-[2rem] border-4 border-white px-3 pb-4 pt-5 ${
            w.id === next ? "anim-glow" : ""
          }`;
          const style = {
            background: `linear-gradient(160deg, ${w.color}, ${w.color}cc 55%, ${w.tint})`,
            animationDelay: `${i * 70}ms`,
          };
          return (
            <li key={w.id}>
              {open ? (
                <Link href={`/play/nikud/${w.id}`} onPointerDown={() => boingSound()} className={cls} style={style} data-nikud-world={w.id}>
                  {body}
                </Link>
              ) : (
                <div className={cls} style={style} aria-label={`${w.title} (עוד סגור)`}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </WorldShell>
  );
}
