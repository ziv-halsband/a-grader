"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import manifest from "@/content/audio-manifest.json";
import { LETTERS } from "@/content/letters";
import { VOICE_LINES } from "@/content/voice";
import { say } from "@/lib/audio";

type Status = "placeholder" | "generated" | "approved";
const STATUS: Record<Status | "missing", { label: string; cls: string }> = {
  missing: { label: "אין קובץ", cls: "bg-red-100 text-red-800" },
  placeholder: { label: "קול זמני, לא לילדים", cls: "bg-slate-200 text-slate-700" },
  generated: { label: "קול AI, ממתין לאישור", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "אושר ✓", cls: "bg-emerald-100 text-emerald-800" },
};
const GROUPS: Record<string, string> = {
  guide: "משפטי המורה",
  letter: "שמות האותיות",
  word: "מילים לדוגמה",
  syllable: "צירופים",
  read: "מילים לקריאה",
  check: "לבדוק באוזן",
};

/**
 * Mom's studio (read-only for now): every line the children hear, with its audio status,
 * and the letters content waiting for her review. Approving will be done here once
 * mom's voice is generated (ElevenLabs) and saved (Supabase).
 */
type Entry = { status: Status; source?: string; heard?: string; check?: "match" | "differs" };
const m = manifest as Record<string, Entry>;

export default function StudioPage() {
  const [filter, setFilter] = useState<string>("all");
  const rows = useMemo(
    () =>
      VOICE_LINES.filter((l) =>
        filter === "all" ? true : filter === "check" ? m[l.id]?.check === "differs" : l.group === filter,
      ),
    [filter],
  );
  const counts = VOICE_LINES.reduce<Record<string, number>>((acc, l) => {
    const s = m[l.id]?.status ?? "missing";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-extrabold">🎙️ הסטודיו של המורה</h1>
        <Link href="/" className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium">
          למשחק
        </Link>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <section className="rounded-2xl bg-white p-5 leading-relaxed shadow-sm">
          <h2 className="mb-2 text-lg font-bold">איך זה עובד</h2>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            <li>כל מה שהילד שומע כתוב כאן, עם ניקוד מלא.</li>
            <li>מייצרים את הקול ב-ElevenLabs (כרגע קול כללי זמני, בהמשך הקול המשובט של המורה).</li>
            <li>
              &quot;אוזן אוטומטית&quot;: כל קובץ מתומלל בחזרה לטקסט. אם התמלול שונה מהכתוב, השורה מסומנת &quot;לבדוק באוזן&quot;.
              בצירופים ובשמות אותיות זה קורה הרבה גם כשהקול נכון, כי התמלול כותב אותם אחרת.
            </li>
            <li>המורה מקשיבה ומאשרת כל שורה. רק שורה מאושרת מגיעה לילדים.</li>
            <li>אם משנים טקסט, הקול שלו חוזר לבדיקה.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {Object.entries(counts).map(([s, n]) => (
              <span key={s} className={`rounded-full px-3 py-1 ${STATUS[s as Status].cls}`}>
                {STATUS[s as Status].label}: {n}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="ml-auto text-lg font-bold">שורות קול ({rows.length})</h2>
            {[["all", "הכול"], ...Object.entries(GROUPS)].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-full px-3 py-1 text-sm ${filter === id ? "bg-stone-900 text-white" : "bg-stone-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="divide-y">
            {rows.map((l) => {
              const st = STATUS[m[l.id]?.status ?? "missing"];
              return (
                <li key={l.id} className="flex items-center gap-3 py-2">
                  <button
                    onClick={() => say(l.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100"
                    aria-label="השמעה"
                  >
                    ▶️
                  </button>
                  <span className="flex flex-1 flex-col">
                    <span className="nikud text-lg">{l.text}</span>
                    {m[l.id]?.heard !== undefined && (
                      <span className={`text-xs ${m[l.id].check === "match" ? "text-emerald-700" : "text-orange-700"}`}>
                        {m[l.id].check === "match" ? "✓" : "⚠️"} התמלול שמע: {m[l.id].heard}
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                  <code className="hidden shrink-0 text-xs text-stone-400 sm:block" dir="ltr">
                    {l.id}
                  </code>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-bold">תוכן האותיות</h2>
          <p className="mb-4 text-sm text-stone-500">
            טיוטה לבדיקת המורה: סדר האותיות, השמות והמילים לדוגמה. הסדר כרגע לפי האלף-בית, עד שיגיע הסדר שלה.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LETTERS.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border p-3">
                <span className="text-4xl font-extrabold">{l.char}</span>
                <div className="nikud text-sm">
                  <div className="font-bold">{l.name}</div>
                  <div>
                    {l.emoji} {l.word}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
