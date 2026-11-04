"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { TOPICS } from "@/content/curriculum";
import { WORLDS, defaultWorldFor, type Gender, type World } from "@/content/worlds";
import { actions } from "@/lib/store";
import { WorldShell } from "./WorldShell";

type Step = "welcome" | 0 | 1 | 2;

/**
 * First visit: a short welcome for the parent, then the setup done by the parent: a nickname (no full name,
 * no birth date), how to address the child, and a world. Adding another child skips the welcome.
 */
export function Onboarding({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(onCancel ? 0 : "welcome");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [worldId, setWorldId] = useState<World["id"] | null>(null);

  const finish = () => {
    if (!gender || !worldId || !nickname.trim()) return;
    actions.addChild({ nickname: nickname.trim(), gender, worldId });
    router.push("/play");
  };

  if (step === "welcome") return <Welcome onStart={() => setStep(0)} />;

  return (
    <WorldShell worldId={worldId ?? undefined}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-10">
        <Steps step={step} />

        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nickname.trim()) setStep(1);
            }}
            className="anim-rise flex flex-col gap-5 rounded-3xl bg-white/90 p-6 shadow-lg"
          >
            <h1 className="text-3xl font-extrabold">איך נקרא לילד או לילדה במשחק?</h1>
            <label className="flex flex-col gap-2">
              <span className="sr-only">כינוי</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={16}
                autoFocus
                enterKeyHint="next"
                placeholder="כינוי או שם פרטי"
                className="rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-2xl font-bold outline-none focus:border-accent"
              />
              <span className="text-sm opacity-70">אין צורך בשם מלא או בתאריך לידה. הכול נשמר רק במכשיר הזה.</span>
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!nickname.trim()}
                className="btn-3d flex-1 bg-accent px-6 py-4 text-xl font-bold text-white disabled:opacity-40"
              >
                המשך
              </button>
              {onCancel && (
                <button type="button" onClick={onCancel} className="btn-3d bg-white px-5 py-4 text-lg">
                  ביטול
                </button>
              )}
            </div>
            {!onCancel && (
              <button type="button" onClick={() => setStep("welcome")} className="self-start text-sm underline opacity-70">
                חזרה
              </button>
            )}
          </form>
        )}

        {step === 1 && (
          <section className="anim-rise flex flex-col gap-5 rounded-3xl bg-white/90 p-6 shadow-lg">
            <h2 className="text-2xl font-extrabold">איך המורה תפנה אל {nickname}?</h2>
            <p className="opacity-70">בעברית ההוראות שונות לבן ולבת, כמו ״לחץ״ או ״לחצי״.</p>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ["m", "בֵּן", "👦", "לְחַץ"],
                  ["f", "בַּת", "👧", "לַחֲצִי"],
                ] as const
              ).map(([g, label, icon, example]) => (
                <button
                  key={g}
                  onClick={() => {
                    setGender(g);
                    setWorldId(defaultWorldFor(g));
                    setStep(2);
                  }}
                  className={`btn-3d flex flex-col items-center gap-1 bg-white p-5 ${gender === g ? "ring-4 ring-accent" : ""}`}
                >
                  <span className="text-6xl">{icon}</span>
                  <span className="nikud text-2xl font-extrabold">{label}</span>
                  <span className="nikud text-sm opacity-60">״{example}״</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className="self-start text-sm underline opacity-70">
              חזרה
            </button>
          </section>
        )}

        {step === 2 && gender && (
          <section className="anim-rise flex flex-col gap-5 rounded-3xl bg-white/90 p-6 shadow-lg">
            <h2 className="text-2xl font-extrabold">באיזה עולם {nickname} {gender === "f" ? "תשחק" : "ישחק"}?</h2>
            <p className="opacity-70">אותו תוכן לימודי בשני העולמות, רק הסיפור והעיצוב שונים. אפשר להחליף בכל רגע באזור ההורים.</p>
            <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="עולם">
              {Object.values(WORLDS).map((w) => (
                <WorldCard key={w.id} world={w} selected={worldId === w.id} onPick={() => setWorldId(w.id)} />
              ))}
            </div>
            <button onClick={finish} className="btn-3d bg-accent px-6 py-4 text-2xl font-extrabold text-white">
              יוצאים לדרך! 🚀
            </button>
            <button onClick={() => setStep(1)} className="self-start text-sm underline opacity-70">
              חזרה
            </button>
          </section>
        )}
      </div>
    </WorldShell>
  );
}

/** A small window into the world: its real sky, ground, map path and stations. */
function WorldCard({ world, selected, onPick }: { world: World; selected: boolean; onPick: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      style={world.theme as CSSProperties}
      className={`btn-3d relative flex flex-col overflow-hidden bg-[var(--card)] text-[var(--ink)] transition-opacity ${
        selected ? "ring-4 ring-[var(--accent)]" : "opacity-75"
      }`}
    >
      <span
        aria-hidden
        className="relative block h-28 w-full"
        style={{ background: "linear-gradient(180deg, var(--sky) 0%, var(--sky-2) 58%, var(--ground) 58%, var(--ground) 100%)" }}
      >
        <svg viewBox="0 0 160 112" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <path
            d="M150 96 C 120 96, 112 66, 82 70 S 34 50, 14 30"
            fill="none"
            stroke="var(--path)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 9"
          />
        </svg>
        {[
          { x: 92, y: 84, icon: world.stationIcons[0] },
          { x: 51, y: 62, icon: world.stationIcons[1] },
          { x: 10, y: 28, icon: world.stationIcons[2] },
        ].map((s) => (
          <span
            key={s.icon}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {s.icon}
          </span>
        ))}
        <span className="absolute left-[42%] top-1 text-base opacity-80">{world.decor[3]}</span>
      </span>
      <span className="flex flex-col items-center gap-1 px-2 py-3">
        <span className="nikud text-lg font-extrabold sm:text-xl">{world.name}</span>
        <span className="nikud text-xs opacity-80">{world.tagline}</span>
      </span>
      {selected && (
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-extrabold text-white shadow"
        >
          ✓
        </span>
      )}
    </button>
  );
}

/** The road from letters to grade 1, drawn as a little adventure map. Stations come from the real curriculum. */
const ROAD = [
  { x: 278, y: 150, label: TOPICS[0].icon },
  { x: 214, y: 92, label: TOPICS[1].icon },
  { x: 140, y: 128, label: TOPICS[2].icon },
  { x: 98, y: 72, label: TOPICS[4].icon },
  { x: 38, y: 40, label: "🎒" },
];

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <WorldShell>
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-4 py-10 md:grid-cols-[1.05fr_1fr] md:gap-12 md:py-16">
        <div className="flex flex-col gap-5">
          <h1 className="nikud text-5xl font-extrabold leading-tight sm:text-6xl">מַסַּע הַקְּרִיאָה</h1>
          <p className="text-xl leading-relaxed sm:text-2xl">
            הילד או הילדה לומדים לקרוא עוד לפני כיתה&nbsp;א׳, צעד אחר צעד, עם מורה ותיקה לכיתה&nbsp;א׳.
          </p>

          <RoadMap className="md:hidden" />

          {/* On a phone the button comes right after the map, so it is on the first screen. */}
          <ul className="order-last mt-4 flex flex-col gap-3 text-lg md:order-none md:mt-0">
            <Point icon="🗺️" title="מפת הרפתקה">
              תחנה אחר תחנה, מהאותיות ועד סיפור ראשון.
            </Point>
            <Point icon="✏️" title="לומדים, כותבים ומשחקים">
              כל הוראה מוקראת בקול, אין צורך לדעת לקרוא.
            </Point>
            <Point icon="🛡️" title="בטוח">
              בלי פרסומות, והכול נשמר רק במכשיר הזה.
            </Point>
          </ul>

          <div className="flex flex-col gap-2 md:items-start">
            <button
              onClick={onStart}
              className="btn-3d anim-glow bg-accent px-10 py-5 text-2xl font-extrabold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
            >
              בואו נתחיל
            </button>
            <p className="text-center text-sm opacity-70 md:text-start">ההגדרה לוקחת דקה, ונעשית על ידי ההורה.</p>
          </div>
        </div>

        <RoadMap className="hidden md:block" />
      </div>
    </WorldShell>
  );
}

function Point({ icon, title, children }: { icon: string; title: string; children: string }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
        {icon}
      </span>
      <span className="leading-snug">
        <b className="block font-extrabold">{title}</b>
        <span className="opacity-80">{children}</span>
      </span>
    </li>
  );
}

function RoadMap({ className = "" }: { className?: string }) {
  const d = ROAD.map((p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const prev = ROAD[i - 1];
    const mx = (prev.x + p.x) / 2;
    return `C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
  }).join(" ");
  return (
    <div
      aria-hidden
      className={`relative aspect-[320/190] w-full rounded-[2rem] border-4 border-white/80 shadow-lg ${className}`}
      style={{ background: "linear-gradient(180deg, var(--sky-2) 0%, var(--card) 55%, var(--ground) 100%)" }}
    >
      <svg viewBox="0 0 320 190" className="absolute inset-0 h-full w-full">
        <path d={d} fill="none" stroke="var(--path)" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 14" />
      </svg>
      {ROAD.map((p, i) => {
        const last = i === ROAD.length - 1;
        return (
          <span
            key={i}
            className={`anim-sticker absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-extrabold shadow-[0_4px_0_rgb(0_0_0/0.15)] ${
              last ? "h-16 w-16 bg-[var(--accent)] text-3xl" : "nikud h-12 w-12 bg-white text-xl text-[var(--accent-2)]"
            }`}
            style={{ left: `${(p.x / 320) * 100}%`, top: `${(p.y / 190) * 100}%`, animationDelay: `${200 + i * 160}ms` }}
          >
            {p.label}
          </span>
        );
      })}
      <span
        className="nikud absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-2.5 text-sm font-bold sm:text-base"
        style={{ left: `${(ROAD[ROAD.length - 1].x / 320) * 100}%`, top: `calc(${(ROAD[ROAD.length - 1].y / 190) * 100}% + 2.4rem)` }}
      >
        כִּתָּה א׳
      </span>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-3 rounded-full transition-all ${i === step ? "w-10 bg-accent" : "w-3 bg-white/80"}`} />
      ))}
    </div>
  );
}
