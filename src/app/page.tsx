"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { BUDDY_BY_ID } from "@/content/buddies";
import { WORLDS } from "@/content/worlds";
import { actions, useAppState, type Child } from "@/lib/store";
import { BuddyAvatar } from "@/components/BuddyAvatar";
import { Onboarding } from "@/components/Onboarding";
import { WorldShell } from "@/components/WorldShell";

export default function Home() {
  const state = useAppState();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  if (!state) return <WorldShell>{null}</WorldShell>;

  if (!state.children.length || adding) {
    return <Onboarding onCancel={state.children.length ? () => setAdding(false) : undefined} />;
  }

  const active = state.children.find((c) => c.id === state.activeChildId);

  return (
    <WorldShell worldId={active?.worldId}>
      {/* Small and tucked in the corner: for grown-ups, not a big target for a 5-year-old. */}
      <Link
        href="/parents"
        className="absolute left-3 top-3 z-20 rounded-full bg-white/55 px-3 py-1.5 text-sm font-medium opacity-80 backdrop-blur-sm hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
      >
        🔒 הורים
      </Link>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 px-4 pb-12 pt-16">
        <h1 className="nikud text-center text-5xl font-extrabold drop-shadow-[0_2px_0_rgb(255_255_255/0.7)] sm:text-6xl">
          מִי מְשַׂחֵק?
        </h1>

        <div
          className={`grid w-full gap-4 sm:gap-6 ${
            state.children.length >= 3 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:max-w-xl"
          }`}
        >
          {state.children.map((c, i) => (
            <ProfileCard
              key={c.id}
              child={c}
              index={i}
              onPick={() => {
                actions.setActive(c.id);
                router.push("/play");
              }}
            />
          ))}
          <button
            onClick={() => setAdding(true)}
            aria-label="הוספת ילד או ילדה"
            className="btn-3d anim-rise flex min-h-56 flex-col items-center justify-center gap-3 border-4 border-dashed border-white/90 bg-white/30 p-4 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{ animationDelay: `${state.children.length * 80}ms` }}
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-5xl font-extrabold text-accent shadow-inner">
              +
            </span>
            <span className="nikud text-lg font-bold">עוֹד יֶלֶד אוֹ יַלְדָּה</span>
          </button>
        </div>
      </div>
    </WorldShell>
  );
}

/** One child's door into the game: their buddy in their world's colors, their name, what they collected. */
function ProfileCard({ child, index, onPick }: { child: Child; index: number; onPick: () => void }) {
  const world = WORLDS[child.worldId];
  const recent = child.stickers.slice(-3);
  const more = child.stickers.length - recent.length;
  return (
    <button
      onClick={onPick}
      aria-label={`${child.nickname}: ${child.done.length} תחנות, ${child.stickers.length} מדבקות`}
      style={{ ...(world.theme as CSSProperties), animationDelay: `${index * 80}ms` }}
      className="btn-3d anim-rise flex min-h-56 flex-col overflow-hidden bg-[var(--card)] text-[var(--ink)] ring-4 ring-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    >
      <span
        className="relative flex h-32 w-full items-end justify-center pb-2 sm:h-36"
        style={{ background: "linear-gradient(180deg, var(--sky) 0%, var(--sky-2) 62%, var(--ground) 62%, var(--ground) 100%)" }}
      >
        <span aria-hidden className="absolute right-2 top-1.5 text-xl opacity-80">
          {world.decor[0]}
        </span>
        <span aria-hidden className="absolute left-2 top-5 text-lg opacity-70">
          {world.decor[3]}
        </span>
        {child.buddy && BUDDY_BY_ID[child.buddy] ? (
          <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={84} />
        ) : (
          <span className="text-7xl leading-none">{world.stationIcons[0]}</span>
        )}
      </span>
      <span className="flex w-full flex-1 flex-col items-center justify-center gap-1 px-3 py-3">
        <span className="w-full truncate text-center text-2xl font-extrabold sm:text-3xl">{child.nickname}</span>
        <span aria-hidden className="flex h-8 items-center gap-1 rounded-full bg-white/80 px-3 text-lg">
          {recent.length ? (
            <>
              {recent.map((s, i) => (
                <span key={i}>{s}</span>
              ))}
              {more > 0 && <span dir="ltr" className="text-sm font-bold">+{more}</span>}
            </>
          ) : (
            <span>🌱</span>
          )}
        </span>
      </span>
    </button>
  );
}
