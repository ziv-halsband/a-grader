"use client";

import Link from "next/link";
import { useState } from "react";
import { KAMATZ, READ_WORDS, SYLLABLES } from "@/content/kamatz";
import { LETTERS, LETTER_BY_ID, LETTER_STATIONS } from "@/content/letters";
import { NameRecorder } from "@/components/NameRecorder";
import { WORLDS } from "@/content/worlds";
import { daysThisWeek, masteryMissing, successDays, successKinds } from "@/lib/mastery";
import { actions, itemMastery, letterMastery, useAppState, type Child, type LetterStat, type Mastery } from "@/lib/store";

/** Parents' area: behind a gate a 5-year-old can't pass (the number is written in words). */
export default function ParentsPage() {
  const [open, setOpen] = useState(false);
  return open ? <Dashboard /> : <Gate onPass={() => setOpen(true)} />;
}

function Gate({ onPass }: { onPass: () => void }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim() === "17") onPass();
          else setErr(true);
        }}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg"
      >
        <h1 className="text-2xl font-extrabold">🔒 אזור הורים</h1>
        <label className="flex flex-col gap-2">
          <span>כדי להיכנס, הקלידו את המספר <b>שבע עשרה</b> בספרות:</span>
          <input
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setErr(false);
            }}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-xl outline-none focus:border-indigo-500"
          />
        </label>
        {err && <p className="text-sm text-red-600">זה לא המספר. נסו שוב.</p>}
        <button className="rounded-xl bg-indigo-600 py-3 text-lg font-bold text-white">כניסה</button>
        <Link href="/" className="text-center text-sm underline opacity-70">
          חזרה למשחק
        </Link>
      </form>
    </div>
  );
}

const MASTERY: Record<Mastery, { label: string; cls: string; dot: string; means: string }> = {
  new: {
    label: "עוד לא תרגלנו",
    cls: "bg-slate-100 text-slate-400",
    dot: "bg-slate-300",
    means: "עוד לא נפגשנו עם האות הזאת במשחק.",
  },
  practicing: {
    label: "בתרגול",
    cls: "bg-amber-100 text-amber-800 ring-2 ring-amber-300",
    dot: "bg-amber-400",
    means: "כבר נפגשנו, אבל עוד לא זוהתה לבד בשני ימים שונים ובשני סוגי שאלות.",
  },
  knows: {
    label: "מזהה לבד",
    cls: "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400",
    dot: "bg-emerald-500",
    means: "זוהתה נכון בניסיון הראשון בשני ימים שונים ובשני סוגי שאלות לפחות.",
  },
};

/** Question kinds, in words a parent understands. */
const KIND_NAMES: Record<string, string> = {
  find: "איפה האות",
  starts: "מה מתחיל באות",
  hear: "שמיעה",
  "first-letter": "באיזו אות מתחילה התמונה",
  write: "כתיבה",
};

/** The tooltip on a letter: the numbers behind the color, and what is still missing. */
function letterDetails(s: LetterStat | undefined, label: string): string {
  if (!s) return label;
  const days = successDays(s).length;
  const kinds = successKinds(s).map((k) => KIND_NAMES[k] ?? k);
  const miss = masteryMissing(s);
  const missing = [miss.days && "עוד יום אחד", miss.kinds && "עוד סוג שאלה"].filter(Boolean).join(" ו");
  return [
    `${label}.`,
    `ימים עם תשובה נכונה מהניסיון הראשון: ${days}.`,
    kinds.length ? `סוגי שאלות: ${kinds.join(", ")}.` : "",
    missing ? `חסר: ${missing}.` : "",
    `(ניסיון ראשון: ${s.firstTry} · עם עזרה: ${s.withHelp} · טעויות: ${s.misses})`,
  ]
    .filter(Boolean)
    .join(" ");
}

function Dashboard() {
  const state = useAppState();
  const [selected, setSelected] = useState<string | null>(null);
  if (!state) return null;
  const child = state.children.find((c) => c.id === (selected ?? state.activeChildId)) ?? state.children[0];

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-extrabold">אזור הורים</h1>
        <Link href="/" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">
          חזרה למשחק
        </Link>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        {!child ? (
          <p>
            עוד אין ילדים במשחק. <Link href="/" className="underline">להוספה</Link>
          </p>
        ) : (
          <>
            {state.children.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {state.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`rounded-full px-4 py-2 font-bold ${c.id === child.id ? "bg-indigo-600 text-white" : "bg-white"}`}
                  >
                    {c.nickname}
                  </button>
                ))}
              </div>
            )}
            <Summary child={child} />
            <LetterGrid child={child} />
            <KamatzGrid child={child} />
            <Settings key={child.id} child={child} />
          </>
        )}
        <section className="rounded-2xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
          <h2 className="mb-2 text-base font-bold text-slate-900">על המידע</h2>
          ההתקדמות נשמרת רק בדפדפן הזה. אין חשבון, אין מיקרופון ואין שליחת מידע לשום מקום. הקולות במשחק הם
          כרגע קול זמני ממוחשב לבדיקה בלבד, עד שיוקלט הקול של המורה.
          <div className="mt-2">
            <Link href="/print" className="ml-4 font-medium text-indigo-700 underline">
              🖨️ דפי כתיבה להדפסה
            </Link>
            <Link href="/studio" className="font-medium text-indigo-700 underline">
              לסטודיו של המורה: בדיקת תוכן וקול
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/** What we practiced and one suggestion, with what it is based on. No invented "reading level". */
function Summary({ child }: { child: Child }) {
  const stats = Object.entries(child.letters);
  const doneStations = LETTER_STATIONS.filter((s) => child.done.includes(`letters/${s.id}`));
  const needHelp = stats
    .filter(([, s]) => !s.lastFirstTry)
    .sort(([, a], [, b]) => b.withHelp + b.misses - (a.withHelp + a.misses))
    .slice(0, 3)
    .map(([id]) => LETTER_BY_ID[id]);
  const nextStation = LETTER_STATIONS.find((s) => !child.done.includes(`letters/${s.id}`));

  let suggestion: { text: string; why: string };
  if (!stats.length) {
    suggestion = { text: "להתחיל בתחנה הראשונה: א ב ג ד.", why: "עוד לא שיחקנו." };
  } else if (needHelp.length) {
    suggestion = {
      text: `לחזור על ${needHelp.map((l) => l.char).join(", ")}, אפשר גם בבית: לחפש את האות בספר או על קופסאות במטבח.`,
      why: "באותיות האלה הייתה צריכה עזרה (רמז או הדגמה) בפעם האחרונה.",
    };
  } else if (nextStation) {
    suggestion = { text: `להמשיך לתחנה הבאה: ${nextStation.title}.`, why: "בפעם האחרונה כל האותיות שתורגלו זוהו בניסיון הראשון." };
  } else {
    suggestion = { text: "סיימנו את עולם האותיות! העולם הבא ייפתח בקרוב.", why: "כל התחנות הושלמו." };
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">מה תרגלנו</p>
        <p className="mt-1 text-2xl font-extrabold">
          {doneStations.length} מתוך {LETTER_STATIONS.length} תחנות
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {child.lastPlayedAt ? `שיחקנו לאחרונה: ${new Date(child.lastPlayedAt).toLocaleDateString("he-IL")}` : "עוד לא שיחקנו"}
        </p>
        <WeekCount child={child} />
      </div>
      <div className="rounded-2xl bg-indigo-50 p-5 shadow-sm">
        <p className="text-sm text-indigo-700">הצעה לצעד הבא</p>
        <p className="mt-1 font-bold">{suggestion.text}</p>
        <p className="mt-2 text-xs text-indigo-700/80">על מה זה מבוסס: {suggestion.why}</p>
      </div>
    </section>
  );
}

/** Days played this week (no streak, nothing lost on a missed day). */
function WeekCount({ child }: { child: Child }) {
  const [now] = useState(() => Date.now());
  const days = daysThisWeek(child.playDays, now).length;
  if (!days) return null;
  return <p className="mt-1 text-sm text-slate-500">השבוע שיחקנו {days === 1 ? "יום אחד" : `${days} ימים`}</p>;
}

function LetterGrid({ child }: { child: Child }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">אותיות</h2>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.values(MASTERY).map((m) => (
            <span key={m.label} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded-full ${m.dot}`} /> {m.label}
            </span>
          ))}
        </div>
      </div>
      <ul className="mb-4 flex flex-col gap-1 text-sm text-slate-600">
        {(["knows", "practicing", "new"] as const).map((k) => (
          <li key={k} className="flex items-start gap-2">
            <span className={`mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full ${MASTERY[k].dot}`} />
            <span>
              <b>{MASTERY[k].label}:</b> {MASTERY[k].means}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
        {LETTERS.map((l) => {
          const s = child.letters[l.id];
          const level = letterMastery(s);
          const m = MASTERY[level];
          return (
            <div
              key={l.id}
              data-mastery={level}
              title={letterDetails(s, m.label)}
              className={`flex aspect-square items-center justify-center rounded-xl text-2xl font-extrabold ${m.cls}`}
            >
              {l.char}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        ״שני סוגי שאלות״: למשל ״איפה האות?״ וגם ״מה מתחיל באות?״. בגינה של הילד/ה כל אות היא צמח: זרע, נבט ופרח
        (באי: אגוז קוקוס, נבט ודקל). זה תרגול במשחק, לא אבחון. הכלל זמני עד שהמורה תגדיר מתי עוברים הלאה.
      </p>
    </section>
  );
}

function KamatzGrid({ child }: { child: Child }) {
  const cells = [
    ...SYLLABLES.map((x) => ({ key: `syl:${x.id}`, label: x.base + KAMATZ })),
    ...READ_WORDS.map((w) => ({ key: `read:${w.id}`, label: w.word })),
  ];
  if (!cells.some((c) => child.items?.[c.key])) return null;
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-bold">קמץ ופתח: צירופים ומילים</h2>
      <p className="mb-4 text-xs text-slate-500">צירוף = שמע צליל ובחר אותו. מילה = קרא לבד (בלי שמיעה) ובחר תמונה.</p>
      <div className="flex flex-wrap gap-2">
        {cells.map((c) => {
          const st = child.items?.[c.key];
          const m = MASTERY[itemMastery(st)];
          return (
            <div
              key={c.key}
              title={st ? `ניסיון ראשון: ${st.firstTry} · עם עזרה: ${st.withHelp} · טעויות: ${st.misses}` : m.label}
              className={`nikud flex h-14 min-w-14 items-center justify-center rounded-xl px-2 text-2xl font-extrabold ${m.cls}`}
            >
              {c.label}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Settings({ child }: { child: Child }) {
  const [nickname, setNickname] = useState(child.nickname);
  const [confirm, setConfirm] = useState<"reset" | "remove" | null>(null);
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">הגדרות של {child.nickname}</h2>
      <label className="flex items-center gap-3">
        <span className="w-24 text-sm">כינוי</span>
        <input
          value={nickname}
          maxLength={16}
          onChange={(e) => setNickname(e.target.value)}
          onBlur={() => nickname.trim() && actions.updateChild(child.id, { nickname: nickname.trim() })}
          className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2"
        />
      </label>
      <NameRecorder childId={child.id} nickname={child.nickname} />
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">פנייה</span>
        {(["m", "f"] as const).map((g) => (
          <button
            key={g}
            onClick={() => actions.updateChild(child.id, { gender: g })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${child.gender === g ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          >
            {g === "m" ? "בן (לחץ)" : "בת (לחצי)"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">עולם</span>
        {Object.values(WORLDS).map((w) => (
          <button
            key={w.id}
            onClick={() => actions.updateChild(child.id, { worldId: w.id })}
            className={`rounded-full px-4 py-2 text-sm font-bold ${child.worldId === w.id ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          >
            {w.stationIcons[0]} {w.name}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3">
        <span className="w-24 text-sm">כל העולמות</span>
        <input
          type="checkbox"
          checked={!!child.unlockAll}
          onChange={(e) => actions.updateChild(child.id, { unlockAll: e.target.checked })}
          className="h-5 w-5 accent-indigo-600"
        />
        <span className="text-sm text-slate-600">פתוחים מיד, בלי לסיים קודם את העולם הקודם (לילד/ה שכבר מכיר/ה אותיות)</span>
      </label>
      <div className="flex flex-wrap gap-3 border-t pt-4">
        {confirm ? (
          <>
            <span className="text-sm">{confirm === "reset" ? "לאפס את כל ההתקדמות והמדבקות?" : `למחוק את ${child.nickname} מהמכשיר?`}</span>
            <button
              onClick={() => {
                if (confirm === "reset") actions.resetProgress(child.id);
                else actions.removeChild(child.id);
                setConfirm(null);
              }}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              כן
            </button>
            <button onClick={() => setConfirm(null)} className="rounded-full bg-slate-100 px-4 py-2 text-sm">
              ביטול
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setConfirm("reset")} className="rounded-full bg-slate-100 px-4 py-2 text-sm">
              איפוס התקדמות
            </button>
            <button onClick={() => setConfirm("remove")} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-red-700">
              מחיקת הילד/ה מהמכשיר
            </button>
          </>
        )}
      </div>
    </section>
  );
}
