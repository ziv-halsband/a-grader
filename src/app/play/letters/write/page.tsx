"use client";

import Link from "next/link";
import { Guide } from "@/components/Guide";
import { NameSignature } from "@/components/NameSignature";
import { PointHand } from "@/components/PointHand";
import { WorldShell } from "@/components/WorldShell";
import { LETTER_BY_ID, LETTER_STATIONS, type Letter } from "@/content/letters";
import { canWriteName, nameText } from "@/content/myName";
import type { Child } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";
import { openAll } from "@/lib/progress";

const PASTELS = ["#fde2e4", "#e2ecfd", "#fdf3c4", "#dcf5e3", "#efe3fd", "#ffe6cf"];

/** Every letter once, in the order the stations teach them (mix stations only repeat letters). */
const STATION_ORDER: Letter[] = [...new Set(LETTER_STATIONS.flatMap((s) => s.letterIds))].map((id) => LETTER_BY_ID[id]);
const REGULAR = STATION_ORDER.filter((l) => !l.final);
const FINALS = STATION_ORDER.filter((l) => l.final);

/**
 * My writing notebook. On top, ✍️ my name (the child's own signature once written). Then every letter in
 * station order, the final letters grouped at the end. A letter written (any round) gets a ✓; written freely
 * (🖍️ round, passed the check) it gets a ⭐. Letters of stations not reached yet stay closed.
 */
export default function WritingNotebookPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;

  const firstOpen = LETTER_STATIONS.findIndex((s) => !child.done.includes(`letters/${s.id}`));
  const reached = new Set(
    openAll(child) || firstOpen === -1
      ? STATION_ORDER.map((l) => l.id)
      : LETTER_STATIONS.slice(0, firstOpen + 1).flatMap((s) => s.letterIds),
  );
  const written = STATION_ORDER.filter((l) => child.items?.[`write:${l.id}`] || child.items?.[`write-free:${l.id}`]).length;

  const tile = (l: Letter, i: number) => {
    const open = reached.has(l.id);
    const st = child.items?.[`write:${l.id}`];
    const freeSt = child.items?.[`write-free:${l.id}`];
    const card = (
      <>
        <span className="text-5xl font-extrabold sm:text-6xl" style={{ color: open ? "var(--ink)" : undefined }}>
          {l.char}
        </span>
        <span className="text-2xl" aria-hidden>
          {open ? l.emoji : "🔒"}
        </span>
        {freeSt ? (
          <span
            className="absolute -top-2 -left-2 rounded-full bg-amber-400 px-1 text-sm shadow"
            aria-label="נכתבה בכתיבה חופשית"
          >
            ⭐
          </span>
        ) : st ? (
          <span className="absolute -top-2 -left-2 rounded-full bg-green-500 px-1.5 text-sm text-white shadow" aria-label="נכתבה">
            ✓
          </span>
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
  };

  return (
    <WorldShell child={child} back={{ href: "/play/letters", label: "לעולם האותיות" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">✍️ הַמַּחְבֶּרֶת שֶׁלִּי</h1>
      <div className="mt-3">
        <Guide compact once lines={["notebook"]} />
      </div>
      <div className="mx-auto mt-6 w-full max-w-3xl px-4 pb-10">
        {canWriteName(child.nickname) && <MyNameTile child={child} />}

        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">{REGULAR.map(tile)}</div>

        {/* Final letters: the end-of-word forms, together. */}
        <h2 className="nikud mt-7 mb-3 flex items-center gap-2 text-xl font-extrabold">
          <span aria-hidden>🌙</span> אוֹתִיּוֹת סוֹפִיּוֹת
        </h2>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">{FINALS.map((l, i) => tile(l, REGULAR.length + i))}</div>

        <p className="mt-6 text-center text-sm font-medium opacity-70" aria-label={`נכתבו ${written} מתוך ${STATION_ORDER.length} אותיות`}>
          ✓ {written}/{STATION_ORDER.length}
        </p>
      </div>
    </WorldShell>
  );
}

/** The big first tile: the child's name, to write letter by letter (or their own signature, once written). */
function MyNameTile({ child }: { child: Child }) {
  const name = nameText(child.nickname);
  const sig = child.nameSignature?.name === name ? child.nameSignature : undefined;
  return (
    <Link
      href="/play/letters/write/name"
      aria-label={`לכתוב את השם שלי: ${name}`}
      className="btn-3d anim-rise relative flex min-h-36 w-full flex-col items-center justify-center gap-1 bg-white px-4 py-4 ring-4 ring-[var(--accent)]/40"
    >
      <span className="nikud flex items-center gap-2 text-lg font-extrabold text-[var(--ink)] opacity-80">
        <span aria-hidden>✍️</span> הַשֵּׁם שֶׁלִּי
      </span>
      {sig ? (
        <NameSignature signature={sig} className="h-24 w-auto max-w-full" />
      ) : (
        <span className="text-6xl font-extrabold tracking-wide text-[var(--ink)] sm:text-7xl">{name}</span>
      )}
      {sig ? (
        <span className="absolute -top-3 -left-3 rounded-full bg-amber-400 px-1.5 text-xl shadow" aria-label="השם נכתב">
          ⭐
        </span>
      ) : (
        <PointHand className="-bottom-4 left-6" />
      )}
    </Link>
  );
}
