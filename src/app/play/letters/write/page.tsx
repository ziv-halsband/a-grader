"use client";

import Link from "next/link";
import { Guide } from "@/components/Guide";
import { WorldShell } from "@/components/WorldShell";
import { LETTERS, LETTER_STATIONS } from "@/content/letters";
import { useRequiredChild } from "@/lib/useChild";

const PASTELS = ["#fde2e4", "#e2ecfd", "#fdf3c4", "#dcf5e3", "#efe3fd", "#ffe6cf"];

/**
 * My writing notebook: every letter the child has reached, to write again any time.
 * A letter written alone (no hint) gets a ✓. Letters of stations not reached yet stay closed.
 */
export default function WritingNotebookPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const firstOpen = LETTER_STATIONS.findIndex((s) => !child.done.includes(`letters/${s.id}`));
  const reached = new Set(
    child.unlockAll || firstOpen === -1
      ? LETTERS.map((l) => l.id)
      : LETTER_STATIONS.slice(0, firstOpen + 1).flatMap((s) => s.letterIds),
  );

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">✍️ הַמַּחְבֶּרֶת שֶׁלִּי</h1>
      <div className="mt-3">
        <Guide compact once lines={["notebook"]} />
      </div>
      <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-4 gap-3 px-4 pb-10 sm:grid-cols-6">
        {LETTERS.map((l, i) => {
          const open = reached.has(l.id);
          const st = child.items?.[`write:${l.id}`];
          const card = (
            <>
              <span className="text-5xl font-extrabold sm:text-6xl" style={{ color: open ? "var(--ink)" : undefined }}>
                {l.char}
              </span>
              <span className="text-2xl" aria-hidden>
                {open ? l.emoji : "🔒"}
              </span>
              {st?.firstTry ? (
                <span className="absolute -top-2 -left-2 rounded-full bg-green-500 px-1.5 text-sm text-white">✓</span>
              ) : null}
            </>
          );
          const cls = "btn-3d relative flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-3xl";
          return open ? (
            <Link
              key={l.id}
              href={`/play/letters/write/${l.id}`}
              className={`${cls} anim-rise`}
              style={{ background: PASTELS[i % PASTELS.length], animationDelay: `${i * 25}ms` }}
              aria-label={`לכתוב את האות ${l.name}`}
            >
              {card}
            </Link>
          ) : (
            <span key={l.id} className={`${cls} bg-white/40 text-slate-400`} aria-label={`האות ${l.name}: עוד סגורה`}>
              {card}
            </span>
          );
        })}
      </div>
    </WorldShell>
  );
}
