"use client";

import { useEffect, useRef, useState } from "react";
import { ChoiceGame } from "@/components/ChoiceGame";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { letterQuizProps, toChoiceItem } from "@/components/LetterQuiz";
import { buildShowItems } from "@/content/games";
import { line } from "@/content/voice";
import { applauseSound, drumrollSound, say, sparkleSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import type { Child, Result } from "@/lib/store";

/** A row of marquee bulbs; neighbours blink in turns. */
function Bulbs({ n, vertical = false, className = "" }: { n: number; vertical?: boolean; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none flex justify-between ${vertical ? "flex-col" : ""} ${className}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="anim-bulb block h-2.5 w-2.5 rounded-full" style={{ animationDelay: `${(i % 2) * 450}ms` }} />
      ))}
    </div>
  );
}

/** The score: one big light per question. A first-try answer lights it gold; an answer after help, soft orange. */
function ScoreLights({ lights, total, big = false }: { lights: Result[]; total: number; big?: boolean }) {
  return (
    <div className={`flex justify-center ${big ? "gap-3" : "gap-1.5 sm:gap-2"}`} aria-label={`${lights.length} מתוך ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const l = lights[i];
        return (
          <span
            key={i}
            className={`block rounded-full border-2 transition-all duration-500 ${big ? "h-10 w-10 sm:h-12 sm:w-12" : "h-4 w-4 sm:h-6 sm:w-6"} ${
              l === "firstTry"
                ? "anim-sticker border-yellow-200 bg-yellow-300 shadow-[0_0_16px_4px_rgb(253_224_71_/_0.8)]"
                : l === "withHelp"
                  ? "anim-sticker border-orange-200 bg-orange-300 shadow-[0_0_10px_2px_rgb(253_186_116_/_0.7)]"
                  : "border-white/30 bg-white/10"
            }`}
            style={big && l ? { animationDelay: `${i * 180}ms` } : undefined}
          />
        );
      })}
    </div>
  );
}

/**
 * 📺 The quiz show (like the TV-quiz template kids love): a stage with blinking marquee lights,
 * "question 3 of 6", a drumroll and "get ready!" before each question, a light for each answer, applause at the end.
 * No countdown, ever: the questions are the station's quiz questions with the same hint ladder.
 */
export function ShowGame({ stationId, child, onDone }: { stationId: string; child: Child; onDone: () => void }) {
  const [items] = useState(() => buildShowItems(stationId).map(toChoiceItem));
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<"ready" | "ask" | "end">("ready");
  const [lights, setLights] = useState<Result[]>([]);
  const quiz = letterQuizProps(child);
  const alive = useRef(true);
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // "Get ready!": a drumroll, then the question.
  useEffect(() => {
    if (stage !== "ready") return;
    drumrollSound();
    const t = setTimeout(() => setStage("ask"), idx === 0 ? 2200 : 1500);
    return () => clearTimeout(t);
  }, [stage, idx]);

  // The finale: applause, the lights, then back to the menu.
  useEffect(() => {
    if (stage !== "end") return;
    applauseSound();
    sparkleSound();
    cheer("party");
    const started = Date.now();
    let t: ReturnType<typeof setTimeout>;
    say("show-end", line("champ", child.gender)).then(() => {
      if (!alive.current) return;
      t = setTimeout(() => alive.current && finish.current(), Math.max(800, 4000 - (Date.now() - started)));
    });
    return () => clearTimeout(t);
  }, [stage, child.gender]);

  const item = items[idx];
  return (
    <div className="flex flex-1 flex-col px-1 py-3 sm:px-4">
      <div
        className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-[2rem] border-4 border-yellow-400 shadow-2xl max-sm:[&_.btn-3d.aspect-square]:w-24 max-sm:[&_.btn-3d.aspect-square]:text-7xl"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #7c3aed 0%, #3b0764 55%, #1e1b4b 100%)" }}
      >
        {/* Marquee lights around the frame. */}
        <Bulbs n={14} className="absolute inset-x-3 top-1.5" />
        <Bulbs n={14} className="absolute inset-x-3 bottom-1.5" />
        <Bulbs n={10} vertical className="absolute inset-y-6 left-1.5 hidden sm:flex" />
        <Bulbs n={10} vertical className="absolute inset-y-6 right-1.5 hidden sm:flex" />

        <div className="flex items-center justify-between gap-2 px-4 pt-6 sm:px-8">
          <span className="nikud rounded-full bg-yellow-400 px-3 py-0.5 text-sm whitespace-nowrap font-extrabold text-purple-950 shadow sm:text-lg">
            📺 {stage === "end" ? "סוֹף הַתָּכְנִית!" : `שְׁאֵלָה ${idx + 1} מִתּוֹךְ ${items.length}`}
          </span>
          {stage !== "end" && <ScoreLights lights={lights} total={items.length} />}
        </div>

        {stage === "ready" && (
          <div key={`ready-${idx}`} className="flex flex-1 flex-col items-center justify-center gap-4 pb-10">
            {idx === 0 && <Guide compact once lines={["show-intro"]} />}
            <span className="anim-bob inline-block text-7xl" aria-hidden>
              🥁
            </span>
            <span className="anim-sticker nikud text-5xl font-extrabold text-yellow-300 drop-shadow-[0_3px_0_rgb(0_0_0_/_0.4)] sm:text-6xl">
              הִתְכּוֹנְנוּ!
            </span>
            <span className="anim-rise nikud rounded-2xl bg-white/15 px-5 py-1 text-3xl font-extrabold text-white">
              שְׁאֵלָה {idx + 1}
            </span>
          </div>
        )}

        {stage === "ask" && (
          <div className="flex flex-1 flex-col pb-6">
            <ChoiceGame
              key={idx}
              items={[item]}
              progress={false}
              {...quiz}
              onAnswer={(it, result, misses) => {
                quiz.onAnswer(it, result, misses);
                setLights((l) => [...l, result]);
              }}
              onDone={() => {
                if (idx + 1 >= items.length) return setStage("end");
                setIdx(idx + 1);
                setStage("ready");
              }}
            />
          </div>
        )}

        {stage === "end" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-10">
            <span className="anim-dance inline-block text-8xl" aria-hidden>
              🏆
            </span>
            <ScoreLights big lights={lights} total={items.length} />
            <span className="anim-rise nikud text-4xl font-extrabold text-yellow-300">👏 👏 👏</span>
          </div>
        )}
      </div>
      {stage === "end" && <Confetti count={60} />}
    </div>
  );
}
