"use client";

import Link from "next/link";
import { useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { LetterWriter } from "@/components/LetterWriter";
import { NameSignature } from "@/components/NameSignature";
import { PointHand } from "@/components/PointHand";
import { WorldShell } from "@/components/WorldShell";
import { canWriteName, nameText, nameWords } from "@/content/myName";
import { nameLineId } from "@/content/names";
import { line } from "@/content/voice";
import { smoothPath, softenInk, strokesFor } from "@/content/writing";
import { audioUrl, registerLine, sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { readNameRecording } from "@/lib/nameRecording";
import { actions, type Child, type InkStroke } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";

/**
 * ✍️ Write my name: the child's nickname, letter by letter, with the same writer as the letters
 * (👀 watch → ✏️ trace → 🖍️ write freely; a letter written before starts straight at 🖍️). The name sits on top:
 * letters already written show the child's own ink, the current one is lit up. At the end the whole name
 * writes itself again in the child's strokes (their "signature"), kept for the home card and "my room".
 */
export default function WriteMyNamePage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  return (
    <WorldShell child={child} back={{ href: "/play/letters/write", label: "למחברת" }}>
      {canWriteName(child.nickname) ? (
        <NameWriter child={child} />
      ) : (
        <p className="nikud mt-10 text-center text-2xl font-bold">
          <Link href="/play/letters/write" className="btn-3d bg-white px-6 py-3">
            ✍️ ←
          </Link>
        </p>
      )}
    </WorldShell>
  );
}

function NameWriter({ child }: { child: Child }) {
  const words = nameWords(child.nickname);
  const flat = words.flat();
  const name = nameText(child.nickname);
  const g = child.gender;
  const [inks, setInks] = useState<InkStroke[][]>([]);
  const [take, setTake] = useState(0);
  const i = inks.length;
  const finished = i >= flat.length;

  // The child's name in the guide's voice at the end: a parent's recording, else a ready-made name, else caption only.
  const recorded = readNameRecording(child.id);
  const ready = nameLineId(child.nickname);
  registerLine("child-name", `${child.nickname}!`, recorded ?? (ready ? audioUrl(ready) : undefined));

  const letterDone = (ink: InkStroke[]) => {
    const { letterId } = flat[i];
    // Moved on without free ink (e.g. "onward" after going back to tracing): the letter's own shape stands in.
    const own = ink.filter((s) => s.pts.length);
    const kept = own.length ? own : strokesFor(letterId).map((pts) => ({ color: "#0ea5e9", pts }));
    const next = [...inks, kept];
    setInks(next);
    if (next.length === flat.length) {
      actions.saveNameSignature(child.id, name, next);
      sparkleSound();
      cheer("party");
      // The buddy keeps dancing a little longer: this is a big one.
      setTimeout(() => cheer("party"), 2900);
    }
  };

  /** Where each word starts in the flat list of letters. */
  const starts = words.map((_, wi) => words.slice(0, wi).reduce((a, w) => a + w.length, 0));
  const strip = (
    <div className="mt-3 flex flex-wrap items-end justify-center gap-x-5 gap-y-2 px-4" aria-label={`השם שלי: ${name}`}>
      {words.map((w, wi) => (
        <div key={wi} className="flex gap-1.5">
          {w.map((l, li) => {
            const k = starts[wi] + li;
            const ink = inks[k];
            const now = k === i && !finished;
            return (
              <span
                key={k}
                aria-current={now ? "true" : undefined}
                className={`relative flex h-16 w-14 items-center justify-center rounded-2xl text-4xl font-extrabold transition ${
                  ink ? "bg-white shadow" : now ? "-translate-y-1 bg-white text-[var(--ink)] shadow-lg ring-4 ring-[var(--accent)]" : "bg-white/45 text-slate-400"
                }`}
              >
                {ink ? (
                  <svg viewBox="12 10 76 90" className="h-full w-full p-1" aria-label={l.char}>
                    {ink.map((s, j) => (
                      <path
                        key={j}
                        d={smoothPath(softenInk(s.pts))}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </svg>
                ) : (
                  l.char
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );

  if (finished) {
    return (
      <div className="flex flex-1 flex-col items-center gap-5 px-4 py-4">
        <Guide compact lines={[line("name-done", g), "child-name"]} cue={take} />
        <div className="paper-board anim-rise relative w-full max-w-3xl rounded-[2.5rem] px-4 py-6 shadow-xl sm:px-8">
          <NameSignature signature={{ name, letters: inks }} animate lines className="mx-auto h-auto max-h-[45dvh] w-full" />
          <span className="anim-sticker absolute -top-5 -left-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[var(--card)] text-5xl shadow-lg">
            ✍️
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setInks([]);
              setTake((t) => t + 1);
            }}
            className="btn-3d bg-white px-5 py-3 text-xl font-bold"
          >
            🔁 עוֹד פַּעַם
          </button>
          <Link
            href="/play/letters/write"
            className="btn-3d relative bg-accent px-6 py-3 text-xl font-extrabold text-white"
          >
            הָלְאָה ←
            <PointHand />
          </Link>
        </div>
        <Confetti count={70} />
      </div>
    );
  }

  const cur = flat[i];
  const known = !!(child.items?.[`write:${cur.letterId}`] || child.items?.[`write-free:${cur.letterId}`]);
  return (
    <div className="flex flex-1 flex-col">
      {strip}
      <LetterWriter
        key={`${take}-${i}`}
        letterId={cur.letterId}
        gender={g}
        // A letter written before: straight to writing it freely (👀 and ✏️ are still a tap away).
        rounds={known ? ["watch", "free"] : ["watch", "trace", "free"]}
        skipWatch={known}
        intro={[line("name-intro", g)]}
        reserve={4}
        onDone={(_helped, free, ink) => {
          if (free) actions.recordItem(child.id, `write-free:${cur.letterId}`, free.result, free.misses);
          letterDone(ink);
        }}
      />
    </div>
  );
}
