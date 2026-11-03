"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { WORLDS, defaultWorldFor, type Gender, type World } from "@/content/worlds";
import { actions } from "@/lib/store";
import { WorldShell } from "./WorldShell";

/** Done by the parent: a nickname (no full name, no birth date), how to address the child, and a world. */
export function Onboarding({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [worldId, setWorldId] = useState<World["id"] | null>(null);

  const finish = () => {
    if (!gender || !worldId || !nickname.trim()) return;
    actions.addChild({ nickname: nickname.trim(), gender, worldId });
    router.push("/play");
  };

  return (
    <WorldShell worldId={worldId ?? undefined}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-6 py-10">
        <Steps step={step} />

        {step === 0 && (
          <section className="anim-rise flex flex-col gap-5 rounded-3xl bg-white/90 p-6 shadow-lg">
            <p className="text-sm font-bold uppercase tracking-wide text-accent">להורים</p>
            <h1 className="text-3xl font-extrabold">ברוכים הבאים למסע הקריאה</h1>
            <p className="text-lg leading-relaxed">
              מסע הרפתקה שבו הילד או הילדה לומדים לקרוא עם המורה, תחנה אחר תחנה, לקראת כיתה א׳. ההגדרה לוקחת דקה.
            </p>
            <label className="flex flex-col gap-2">
              <span className="font-bold">איך נקרא לילד/ה במשחק?</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={16}
                placeholder="כינוי או שם פרטי"
                className="rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-xl outline-none focus:border-accent"
              />
              <span className="text-sm opacity-60">אין צורך בשם מלא או בתאריך לידה. הכול נשמר רק במכשיר הזה.</span>
            </label>
            <div className="flex gap-3">
              <button
                disabled={!nickname.trim()}
                onClick={() => setStep(1)}
                className="btn-3d flex-1 bg-accent px-6 py-4 text-xl font-bold text-white disabled:opacity-40"
              >
                המשך
              </button>
              {onCancel && (
                <button onClick={onCancel} className="btn-3d bg-white px-5 py-4 text-lg">
                  ביטול
                </button>
              )}
            </div>
          </section>
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
            <div className="grid grid-cols-2 gap-4">
              {Object.values(WORLDS).map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWorldId(w.id)}
                  style={{ ...(w.theme as CSSProperties), background: "linear-gradient(180deg,var(--sky),var(--ground))" }}
                  className={`btn-3d flex flex-col items-center gap-2 p-4 ${worldId === w.id ? "ring-4 ring-[var(--accent)]" : "opacity-80"}`}
                >
                  <span className="text-5xl">{w.stationIcons.slice(0, 3).join("")}</span>
                  <span className="nikud text-xl font-extrabold text-[var(--ink)]">{w.name}</span>
                  <span className="nikud text-xs text-[var(--ink)] opacity-80">{w.tagline}</span>
                </button>
              ))}
            </div>
            <button
              onClick={finish}
              className="btn-3d bg-accent px-6 py-4 text-2xl font-extrabold text-white"
            >
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

function Steps({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-3 rounded-full transition-all ${i === step ? "w-10 bg-accent" : "w-3 bg-white/80"}`} />
      ))}
    </div>
  );
}
