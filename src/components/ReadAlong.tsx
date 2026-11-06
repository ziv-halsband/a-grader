"use client";

// Read-along for the stories and the library books: words as buttons, 🔊 reads, words light up as they're said.
// Each text (a line, a speech bubble, a question) is a "segment" with an audio key.
//   - A segment with a recording (content/story-audio.json, scripts/gen-story-audio.ts): its mp3 and word timings.
//   - Without one (ElevenLabs credits ran out): the device's Hebrew voice (lib/audio speakText). Words light up
//     on the browser's word-boundary events when it sends them; otherwise the whole segment lights up.
// The child reads first: nothing plays by itself (except a recorded question).

import { useEffect, useRef, useState } from "react";
import { popSound, speakText } from "@/lib/audio";
import { pageAudio, playPage, playWord } from "@/lib/storyAudio";
import { PointHand } from "./PointHand";

export type Segment = { key: string; text: string };
/** Which word is lit: one word of a segment, or the whole segment ("all", when the voice gives no word events). */
export type Lit = { seg: number; word: number | "all" } | null;

/** The words of a text as shown (punctuation stays on its word). */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Where each word starts in the text (to map a boundary's charIndex to a word). */
function wordStarts(text: string): number[] {
  const starts: number[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) starts.push(m.index);
  return starts;
}

function wordAt(starts: number[], charIndex: number): number {
  let i = 0;
  starts.forEach((s, j) => {
    if (charIndex >= s) i = j;
  });
  return i;
}

/** A word to say alone: without its punctuation ("בַּגַּן." → "בַּגַּן"). */
const bare = (w: string) => w.replace(/[!?.,:;…"'״()\-–]/g, "");

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useReadAlong(segments: Segment[]) {
  const [lit, setLit] = useState<Lit>(null);
  const [talking, setTalking] = useState(false);
  const run = useRef(0);

  /** One segment, start to end. Resolves false if something cut it off. */
  const readSegment = async (i: number): Promise<boolean> => {
    const s = segments[i];
    const audio = pageAudio(s.key, s.text);
    if (audio) return playPage(audio, (w) => setLit(w === null ? null : { seg: i, word: w }));
    const starts = wordStarts(s.text);
    setLit({ seg: i, word: "all" });
    return speakText(s.text, (c) => setLit({ seg: i, word: wordAt(starts, c) }));
  };

  /** 🔊 Every segment in order, each word lighting up as it's said. */
  const readAll = async (from = 0, to = segments.length) => {
    const me = ++run.current;
    setTalking(true);
    for (let i = from; i < to; i++) {
      const ok = await readSegment(i);
      if (!ok || me !== run.current) break;
      if (i < to - 1) await wait(220);
    }
    if (me === run.current) {
      setLit(null);
      setTalking(false);
    }
  };

  /** A tapped word: just that word (its slice of the recording, or the device voice). */
  const tapWord = (seg: number, i: number) => {
    run.current++;
    setTalking(false);
    setLit({ seg, word: i });
    const s = segments[seg];
    const audio = pageAudio(s.key, s.text);
    const said = audio ? playWord(audio, i) : speakText(bare(splitWords(s.text)[i] ?? ""));
    said.then((ok) => {
      if (!ok && !audio) popSound(); // no voice at all on this device: at least a sound
      setLit((l) => (l?.seg === seg && l.word === i ? null : l));
    });
  };

  useEffect(
    () => () => {
      run.current++;
    },
    [],
  );

  return { lit, talking, readAll, tapWord };
}

/** One segment's words as buttons. Tap → that word; the lit word (or the whole line) glows. */
export function Words({
  text,
  seg,
  lit,
  onTap,
  hand = false,
  className = "",
}: {
  text: string;
  seg: number;
  lit: Lit;
  onTap: (seg: number, i: number) => void;
  /** 👆 on the first word (the very first page of the very first book). */
  hand?: boolean;
  className?: string;
}) {
  const words = splitWords(text);
  const [bounce, setBounce] = useState<{ i: number; n: number } | null>(null);
  const all = lit?.seg === seg && lit.word === "all";
  return (
    <span className={`flex flex-wrap justify-center gap-x-3 gap-y-0 ${className}`} data-seg={seg}>
      {words.map((w, i) => (
        <button
          key={`${i}-${bounce?.i === i ? bounce.n : 0}`}
          onClick={() => {
            setBounce((b) => ({ i, n: (b?.n ?? 0) + 1 }));
            onTap(seg, i);
          }}
          data-word={i}
          data-lit={(lit?.seg === seg && (lit.word === i || all)) || undefined}
          className={`story-word relative rounded-2xl px-1.5 ${bounce?.i === i ? "anim-word" : ""}`}
        >
          {w}
          {hand && i === 0 && <PointHand className="-bottom-10 left-1/2" />}
        </button>
      ))}
    </span>
  );
}

/** 🔊 Read it to me. */
export function ListenButton({ talking, onClick, hand = false }: { talking: boolean; onClick: () => void; hand?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="להקשיב"
      className={`btn-3d relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-3xl ${talking ? "anim-talk" : ""}`}
    >
      🔊{hand && <PointHand className="-bottom-8 -left-2" />}
    </button>
  );
}
