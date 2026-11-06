"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SheetView } from "@/components/worksheets/Sheets";
import { BUDDY_BY_ID } from "@/content/buddies";
import { LETTER_STATIONS, LETTERS } from "@/content/letters";
import { NIKUD_WORLD_BY_ID, NIKUD_WORLDS, shownSyllable, NIKUD_SYLLABLE_BY_ID } from "@/content/nikud";
import {
  buildBundle,
  buildSheets,
  currentSource,
  parseSource,
  sourceKey,
  sourceTitle,
  typesFor,
  WS_TYPES,
  type WsSource,
  type WsType,
} from "@/content/worksheets";
import { useAppState } from "@/lib/store";

type Pick = WsType | "all";

/**
 * 📄 Worksheets for parents: pick what to practice (letters / a nikud world) → pick a sheet → preview → print or
 * save as PDF (the browser's print dialog). State lives in the URL (?src=letters:s1&type=find), so the map tiles
 * and the parents' area can link straight to a ready bundle.
 */
export function WorksheetBuilder() {
  const params = useSearchParams();
  const state = useAppState();
  const child = state ? (state.children.find((c) => c.id === state.activeChildId) ?? state.children[0]) : undefined;

  const [chosen, setChosen] = useState<WsSource | null>(() => parseSource(params.get("src")));
  const [type, setType] = useState<Pick>(() => {
    const t = params.get("type");
    return t === "all" || WS_TYPES.some((x) => x.id === t) ? (t as Pick) : "all";
  });
  const [seed, setSeed] = useState(0);
  const [withName, setWithName] = useState(false);

  const current = child ? currentSource(child.done) : null;
  const source: WsSource = chosen ?? current ?? { kind: "letters", stationId: "s1", letterIds: LETTER_STATIONS[0].letterIds };
  const types = typesFor(source);
  const effType: Pick = type === "all" || types.includes(type) ? type : "all";
  const sheets = effType === "all" ? buildBundle(source, seed) : buildSheets(source, effType, seed);
  const mascot = child?.buddy ? BUDDY_BY_ID[child.buddy]?.emoji : undefined;
  const head = { name: withName ? child?.nickname : undefined, mascot };

  const update = (src: WsSource, t: Pick) => {
    setChosen(src);
    setType(t);
    setSeed(0);
    window.history.replaceState(null, "", `?src=${encodeURIComponent(sourceKey(src))}&type=${t}`);
  };

  const print = () => {
    const before = document.title;
    document.title = `דפי עבודה - ${sourceTitle(source)}`; // the saved PDF's file name
    window.print();
    document.title = before;
  };

  const customLetters = source.kind === "letters" && !source.stationId ? source.letterIds : [];
  const toggleLetter = (id: string) => {
    const next = customLetters.includes(id) ? customLetters.filter((x) => x !== id) : [...customLetters, id];
    update(next.length ? { kind: "letters", letterIds: next } : { kind: "letters", stationId: "s1", letterIds: LETTER_STATIONS[0].letterIds }, effType);
  };

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 print:bg-white">
      <div className="ws-noprint print:hidden">
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <h1 className="text-xl font-extrabold">📄 דפי עבודה להדפסה</h1>
          <Link href="/parents" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">
            לאזור ההורים
          </Link>
        </header>

        <main className="mx-auto flex max-w-4xl flex-col gap-5 p-5">
          {child && current && (
            <button
              onClick={() => update(current, "all")}
              className="flex items-center gap-4 rounded-2xl bg-indigo-600 px-5 py-4 text-start text-white shadow-sm hover:bg-indigo-700"
            >
              <span className="text-4xl" aria-hidden>
                📦
              </span>
              <span>
                <span className="block text-lg font-extrabold">כל הדפים לתחנה של {child.nickname}</span>
                <span className="nikud block text-sm opacity-90">{sourceTitle(current)} · כתיבה, חיפוש, צביעה, גזירה ועוד</span>
              </span>
            </button>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">1. על מה מתרגלים?</h2>
            <div className="mb-4 inline-flex rounded-full bg-slate-100 p-1" role="tablist">
              {(["letters", "nikud"] as const).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={source.kind === k}
                  onClick={() =>
                    source.kind !== k &&
                    update(
                      k === "letters"
                        ? { kind: "letters", stationId: "s1", letterIds: LETTER_STATIONS[0].letterIds }
                        : { kind: "nikud", worldId: NIKUD_WORLDS[0].id },
                      effType,
                    )
                  }
                  className={`rounded-full px-5 py-2 font-bold ${source.kind === k ? "bg-white shadow-sm" : "text-slate-500"}`}
                >
                  {k === "letters" ? "אותיות" : "ניקוד"}
                </button>
              ))}
            </div>

            {source.kind === "letters" ? (
              <>
                <p className="mb-2 text-sm text-slate-500">תחנה:</p>
                <div className="flex flex-wrap gap-2">
                  {LETTER_STATIONS.map((s) => (
                    <Chip
                      key={s.id}
                      on={source.stationId === s.id}
                      onClick={() => update({ kind: "letters", stationId: s.id, letterIds: s.letterIds }, effType)}
                    >
                      {s.title}
                    </Chip>
                  ))}
                </div>
                <p className="mt-4 mb-2 text-sm text-slate-500">או לבחור אותיות (אפשר כמה):</p>
                <div className="grid grid-cols-9 gap-1.5 sm:grid-cols-14">
                  {LETTERS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => toggleLetter(l.id)}
                      aria-pressed={customLetters.includes(l.id)}
                      aria-label={`אות ${l.name}`}
                      className={`aspect-square rounded-xl text-2xl font-extrabold ${
                        customLetters.includes(l.id) ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-indigo-50"
                      }`}
                    >
                      {l.char}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-sm text-slate-500">עולם:</p>
                <div className="flex flex-wrap gap-2">
                  {NIKUD_WORLDS.map((w) => (
                    <Chip key={w.id} on={source.worldId === w.id} onClick={() => update({ kind: "nikud", worldId: w.id }, effType)}>
                      <span className="nikud">{w.title}</span>
                    </Chip>
                  ))}
                </div>
                <p className="mt-4 mb-2 text-sm text-slate-500">תחנה:</p>
                <div className="flex flex-wrap gap-2">
                  <Chip on={!source.stationId} onClick={() => update({ kind: "nikud", worldId: source.worldId }, effType)}>
                    כל העולם
                  </Chip>
                  {NIKUD_WORLD_BY_ID[source.worldId].stations
                    .filter((s) => s.kind === "syllables")
                    .map((s) => (
                      <Chip
                        key={s.id}
                        on={source.stationId === s.id}
                        onClick={() => update({ kind: "nikud", worldId: source.worldId, stationId: s.id }, effType)}
                      >
                        <span className="nikud">{s.itemIds.map((id) => shownSyllable(NIKUD_SYLLABLE_BY_ID[id])).join(" ")}</span>
                      </Chip>
                    ))}
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">2. איזה דף?</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <TypeCard on={effType === "all"} onClick={() => update(source, "all")} emoji="📦" title="כל הדפים (חבילה)" about="כל סוגי הדפים לבחירה הזאת, אחד אחרי השני" />
              {WS_TYPES.filter((t) => types.includes(t.id)).map((t) => (
                <TypeCard key={t.id} on={effType === t.id} onClick={() => update(source, t.id)} emoji={t.emoji} title={t.title} about={t.about} />
              ))}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
            <button onClick={print} className="rounded-full bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700">
              🖨️ הדפסה
            </button>
            <button onClick={print} className="rounded-full bg-slate-800 px-6 py-3 font-bold text-white hover:bg-slate-900">
              ⬇ שמירה כ-PDF
            </button>
            <button onClick={() => setSeed((s) => s + 1)} className="rounded-full bg-slate-100 px-5 py-3 font-medium hover:bg-slate-200">
              🔄 גרסה אחרת
            </button>
            {child && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} className="size-4" />
                לכתוב את השם {child.nickname} על הדף
              </label>
            )}
            <p className="w-full text-sm leading-relaxed text-slate-500">
              <b data-count>{sheets.length} דפים</b> · A4 · לשמירה כ-PDF: בחלון ההדפסה בוחרים ״שמירה כ-PDF״ (Save as PDF), שוליים: ללא.
              מומלץ לעבוד יחד עם הילד/ה, דף אחד בכל פעם, אחרי שהנושא נלמד במשחק. כל התוכן טיוטה לבדיקת המורה.
            </p>
          </section>
          <h2 className="nikud text-center text-lg font-bold text-slate-600">תצוגה מקדימה: {sourceTitle(source)}</h2>
        </main>
      </div>

      <div className="ws-preview pb-10 print:p-0" data-preview>
        {sheets.map((s) => (
          <SheetView key={s.key} sheet={s} head={head} />
        ))}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-4 py-2 text-lg font-bold ${on ? "bg-indigo-600 text-white" : "bg-slate-100 hover:bg-indigo-50"}`}
    >
      {children}
    </button>
  );
}

function TypeCard({ on, onClick, emoji, title, about }: { on: boolean; onClick: () => void; emoji: string; title: string; about: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-start ${on ? "border-indigo-600 bg-indigo-50" : "border-transparent bg-slate-50 hover:bg-indigo-50"}`}
    >
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-slate-500">{about}</span>
      </span>
    </button>
  );
}
