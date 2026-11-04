"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { LearnNav } from "@/components/LearnNav";
import { KAMATZ, SYLLABLE_BY_ID } from "@/content/kamatz";
import { line, startsWordId } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { say } from "@/lib/audio";
import { Syllable } from "./Syllable";

/**
 * The syllable builder: the letter alone (its name) → tap the kamatz, it lands under the letter → the sound.
 * A switch shows the same sound with a patach. Then a picture word that starts with this sound.
 * In the first station, an intro slide shows the two marks.
 */
export function SyllableLearn({
  syllableIds,
  withMarksIntro,
  gender,
  onDone,
}: {
  syllableIds: string[];
  withMarksIntro: boolean;
  gender: Gender;
  onDone: () => void;
}) {
  const slides = withMarksIntro ? ["marks", ...syllableIds] : syllableIds;
  const [i, setI] = useState(0);
  const slide = slides[i];
  const nav = (
    <LearnNav i={i} count={slides.length} onPrev={() => setI(i - 1)} onNext={() => setI(i + 1)} onDone={onDone} />
  );

  if (slide === "marks") {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4">
        <Guide compact lines={["kamatz-is", "patach-is", "both-say-a"]} />
        <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 items-center justify-center gap-6 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
          {(
            [
              ["kamatz", "קָמָץ", "kamatz-is"],
              ["patach", "פַּתָּח", "patach-is"],
            ] as const
          ).map(([id, name, lineId]) => (
            <button
              key={id}
              onClick={() => say(lineId, "both-say-a")}
              className="btn-3d flex flex-1 flex-col items-center gap-2 bg-white p-4"
              aria-label={name}
            >
              <Syllable base="א" mark={id} className="pb-6 text-[8rem] font-extrabold" />
              <span className="nikud text-3xl font-extrabold">{name}</span>
            </button>
          ))}
        </div>
        <p className="nikud text-center text-2xl font-extrabold">
          שְׁנֵיהֶם אוֹמְרִים: <span className="text-accent">אָ</span>
        </p>
        {nav}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <BuildSlide key={slide} id={slide} first={i === (withMarksIntro ? 1 : 0)} gender={gender} />
      {nav}
    </div>
  );
}

function BuildSlide({ id, first, gender }: { id: string; first: boolean; gender: Gender }) {
  const s = SYLLABLE_BY_ID[id];
  const [built, setBuilt] = useState(false);
  const [mark, setMark] = useState<"kamatz" | "patach">("kamatz");
  const sylLine = `syl-${id}`;
  const wordLine = startsWordId(id);

  const build = () => {
    setBuilt(true);
    say(sylLine);
  };

  return (
    <>
      <Guide compact lines={first ? [line("builder-intro", gender), `letter-${s.letterId}`] : [`letter-${s.letterId}`]} />
      <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-5 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
        <button
          onClick={() => (built ? say(sylLine) : say(`letter-${s.letterId}`))}
          aria-label={built ? "לשמוע את הצליל" : "לשמוע את שם האות"}
          className="btn-3d flex h-52 w-48 items-center justify-center rounded-[2rem] bg-white pb-6 text-[9rem] font-extrabold text-[var(--ink)] sm:h-60 sm:w-56 sm:text-[11rem]"
        >
          <Syllable base={s.base} mark={mark} showMark={built} />
        </button>

        {!built ? (
          <button
            onClick={build}
            className="btn-3d anim-bob flex items-center gap-3 bg-accent px-6 py-3 text-2xl font-extrabold text-white"
          >
            <span className="nikud text-5xl leading-none">{"◌" + KAMATZ}</span>
            הוֹסִיפוּ קָמָץ
          </button>
        ) : (
          <>
            <div className="flex gap-2" role="group" aria-label="קמץ או פתח">
              {(["kamatz", "patach"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMark(m);
                    say(sylLine);
                  }}
                  className={`nikud rounded-full px-4 py-2 text-lg font-bold ${mark === m ? "bg-accent text-white" : "bg-white"}`}
                >
                  {m === "kamatz" ? "קָמָץ" : "פַּתָּח"}
                </button>
              ))}
            </div>
            {s.starts && (
              <button
                onClick={() => say(sylLine, "like", wordLine)}
                className="btn-3d anim-rise flex items-center gap-4 bg-white px-6 py-3"
                aria-label={`כמו ${s.starts.word}`}
              >
                <span className="text-6xl">{s.starts.emoji}</span>
                <span className="nikud text-4xl font-bold">{s.starts.word}</span>
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
