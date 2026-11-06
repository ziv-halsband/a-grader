"use client";

import { useState } from "react";
import { Guide } from "@/components/Guide";
import { LearnNav } from "@/components/LearnNav";
import { PointHand } from "@/components/PointHand";
import {
  decodable,
  NIKUD_SYLLABLE_BY_ID,
  NIKUD_WORD_BY_ID,
  shownSyllable,
  type NikudWorld,
} from "@/content/nikud";
import { line, VOICE_BY_ID } from "@/content/voice";
import type { Gender } from "@/content/worlds";
import { boingSound, say } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { Glyph, markAlone } from "./Glyph";

/**
 * 📖 Learn: in the world's first station, "meet the vowel" (its shape and its sound). Then the builder for each
 * syllable: the letter alone → tap the mark, it jumps under the letter → the syllable, then a word that starts with it.
 */
export function SyllableLearn({
  world,
  syllableIds,
  withMeet,
  gender,
  onDone,
}: {
  world: NikudWorld;
  syllableIds: string[];
  withMeet: boolean;
  gender: Gender;
  onDone: () => void;
}) {
  const slides = withMeet ? ["meet", ...syllableIds] : syllableIds;
  const [i, setI] = useState(0);
  const slide = slides[i];
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      {slide === "meet" ? (
        <MeetVowel world={world} />
      ) : (
        <BuildSlide key={slide} id={slide} world={world} first={i === (withMeet ? 1 : 0)} gender={gender} />
      )}
      <LearnNav i={i} count={slides.length} onPrev={() => setI(i - 1)} onNext={() => setI(i + 1)} onDone={onDone} />
    </div>
  );
}

/** The vowel's shape(s) under a letter, its name, and what it says. Tap a mark: it wiggles and is described. */
function MeetVowel({ world }: { world: NikudWorld }) {
  const [tapped, setTapped] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const lines = [...world.marks.map((m) => m.line), world.soundLine];
  return (
    <>
      <Guide compact lines={lines} />
      <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-5 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
        <div className="flex w-full justify-center gap-4">
          {world.marks.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                boingSound();
                cheer("giggle");
                setTapped(m.id);
                setN((x) => x + 1);
                say(m.line, world.soundLine);
              }}
              aria-label={m.name}
              className="btn-3d relative flex max-w-60 flex-1 flex-col items-center gap-1 bg-white px-4 pb-3 pt-2"
            >
              <span key={tapped === m.id ? n : 0} className={`inline-block ${tapped === m.id ? "anim-wiggle" : ""}`}>
                <Glyph s={{ base: "א", mark: m.id }} className="pb-6 text-[7rem] font-extrabold sm:text-[8.5rem]" />
              </span>
              <span className="nikud text-3xl font-extrabold">{m.name}</span>
              <span className="nikud absolute -top-3 -right-3 flex h-14 min-w-14 items-center justify-center rounded-full border-4 border-white bg-accent px-2 text-3xl font-extrabold text-white shadow">
                {markAlone(m.sign)}
              </span>
              {!tapped && m === world.marks[0] && <PointHand className="-bottom-6 -left-4" />}
            </button>
          ))}
        </div>
        <button
          onClick={() => say(world.soundLine)}
          className="btn-3d nikud flex items-center gap-3 bg-white px-6 py-3 text-3xl font-extrabold"
        >
          <span aria-hidden>🔊</span>
          {world.sound ? (
            <>
              אוֹמְרִים: <span className="text-5xl text-accent">{world.sound}</span>
            </>
          ) : (
            VOICE_BY_ID[world.soundLine]?.text
          )}
        </button>
      </div>
    </>
  );
}

function BuildSlide({ id, world, first, gender }: { id: string; world: NikudWorld; first: boolean; gender: Gender }) {
  const s = NIKUD_SYLLABLE_BY_ID[id];
  const word = NIKUD_WORD_BY_ID[s.word];
  const [built, setBuilt] = useState(false);
  const [mark, setMark] = useState(s.mark);
  const [taps, setTaps] = useState(0);
  const sign = world.marks.find((m) => m.id === s.mark)!.sign;
  const showWord = decodable(word.word, world.id);
  // The shva world builds on a syllable the child already reads ("מַ" + ז), so the letter's name isn't said.
  const intro = first ? [line("tap-mark", gender)] : [];
  const lines = s.pre ? intro : [...intro, `letter-${s.letterId}`];

  const build = () => {
    setBuilt(true);
    cheer("happy");
    say(s.audio, "like", word.audio);
  };

  return (
    <>
      <Guide compact lines={lines} />
      <div className="anim-rise mx-auto flex w-[calc(100%-2rem)] max-w-xl flex-1 flex-col items-center justify-center gap-5 rounded-[2.5rem] bg-[var(--card)]/90 p-6 shadow-xl">
        <button
          onClick={() => {
            setTaps((t) => t + 1);
            if (built) say(s.audio);
            else if (!s.pre) say(`letter-${s.letterId}`);
            else boingSound();
          }}
          aria-label={built ? `לשמוע: ${shownSyllable(s, mark)}` : "לשמוע את האות"}
          data-built={built || undefined}
          className={`btn-3d flex h-52 items-center justify-center rounded-[2rem] bg-white px-8 pb-6 font-extrabold text-[var(--ink)] sm:h-60 ${
            s.pre ? "min-w-64 text-[7rem] sm:text-[8.5rem]" : "w-48 text-[9rem] sm:w-56 sm:text-[11rem]"
          }`}
        >
          <span key={taps} className={`inline-block ${taps ? "anim-wiggle" : ""}`}>
            <Glyph s={s} mark={mark} showMark={built} pop={built} />
          </span>
        </button>

        {!built ? (
          <button
            onClick={build}
            aria-label={`להוסיף ${world.marks.find((m) => m.id === s.mark)!.name}`}
            className="btn-3d anim-bob relative flex items-center gap-3 bg-accent px-6 py-2 text-white"
          >
            <span className="nikud text-6xl font-extrabold leading-tight">{markAlone(sign)}</span>
            <span className="text-4xl" aria-hidden>
              ⬆️
            </span>
            <PointHand className="-bottom-7 -left-5" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {world.marks.length > 1 && (
              <div className="flex gap-2" role="group" aria-label="הסימן">
                {world.marks.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMark(m.id);
                      say(s.audio);
                    }}
                    aria-pressed={mark === m.id}
                    className={`nikud flex items-center gap-2 rounded-full px-4 py-1.5 text-lg font-bold shadow ${
                      mark === m.id ? "bg-accent text-white" : "bg-white"
                    }`}
                  >
                    <span className="text-2xl">{markAlone(m.sign)}</span>
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => say(s.audio, "like", word.audio)}
              className="btn-3d anim-sticker flex items-center gap-4 bg-white px-6 py-3"
              aria-label={`כמו ${word.word}`}
            >
              <span className="text-7xl">{word.emoji}</span>
              {showWord && <span className="nikud text-5xl font-bold">{word.word}</span>}
              <span className="text-2xl" aria-hidden>
                🔊
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
