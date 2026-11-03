"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { WORLDS } from "@/content/worlds";
import { actions, useAppState } from "@/lib/store";
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

  return (
    <WorldShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
        <h1 className="text-4xl font-extrabold">מִי מְשַׂחֵק?</h1>
        <div className="flex flex-wrap justify-center gap-5">
          {state.children.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                actions.setActive(c.id);
                router.push("/play");
              }}
              className="btn-3d anim-rise flex w-40 flex-col items-center gap-2 bg-white p-5"
              style={WORLDS[c.worldId].theme as CSSProperties}
            >
              <span className="text-6xl">{WORLDS[c.worldId].stationIcons[0]}</span>
              <span className="text-2xl font-extrabold">{c.nickname}</span>
              <span className="text-sm opacity-70">{WORLDS[c.worldId].name}</span>
            </button>
          ))}
          <button
            onClick={() => setAdding(true)}
            className="btn-3d flex w-40 flex-col items-center justify-center gap-2 border-4 border-dashed border-white bg-white/40 p-5"
          >
            <span className="text-5xl">➕</span>
            <span className="text-lg font-bold">יֶלֶד אוֹ יַלְדָּה</span>
          </button>
        </div>
        <Link href="/parents" className="mt-6 rounded-full bg-white/70 px-5 py-2 text-base font-medium">
          🔒 אזור הורים
        </Link>
      </div>
    </WorldShell>
  );
}
