"use client";

// Read-along audio for the stories: one mp3 per page + each word's [start, end] (scripts/gen-story-audio.ts).
// 🔊 plays the page and reports which word is being said (karaoke); tapping a word plays only its slice.
// No audio yet (or the text changed since it was made)? Everything still works, just silently.

import timings from "@/content/story-audio.json";
import { claimAudio } from "./audio";

type Entry = { text: string; file: string; words: [number, number][] };
const ENTRIES = timings as unknown as Record<string, Entry>;

/** The page's audio, if it was made from exactly this text. */
export function pageAudio(key: string, text: string): Entry | null {
  const e = ENTRIES[key];
  return e && e.text === text ? e : null;
}

const url = (e: Entry) => `/audio/stories/${e.file}`;

/**
 * Plays from `from` to `to` (seconds; `to` undefined = to the end), calling `onTime` every frame.
 * Resolves true if it played to the end, false if something else took the speaker.
 */
function play(e: Entry, from: number, to: number | undefined, onTime?: (t: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const a = new Audio(url(e));
    let done = false;
    let raf = 0;
    const finish = (all: boolean) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      a.pause();
      resolve(all);
    };
    const mine = claimAudio(a, () => finish(false));
    const tick = () => {
      if (done) return;
      if (!mine()) return finish(false);
      onTime?.(a.currentTime);
      if (to !== undefined && a.currentTime >= to) return finish(true);
      raf = requestAnimationFrame(tick);
    };
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    const start = () => {
      try {
        if (from > 0) a.currentTime = from;
      } catch {
        // Not seekable yet: plays from the start, still fine.
      }
      a.play()
        .then(() => (raf = requestAnimationFrame(tick)))
        .catch(() => finish(false)); // autoplay blocked: the text is on screen
    };
    if (from > 0 && a.readyState < 1) a.addEventListener("loadedmetadata", start, { once: true });
    else start();
  });
}

/** 🔊 The whole page; `onWord(i)` as word i is said, then `onWord(null)`. */
export async function playPage(e: Entry, onWord: (i: number | null) => void): Promise<boolean> {
  let last = -2;
  const all = await play(e, 0, undefined, (t) => {
    // The word being said: from its start until the next word starts (pauses keep the word lit).
    let i = -1;
    e.words.forEach(([s], j) => {
      if (t >= s - 0.05) i = j;
    });
    if (i !== last) {
      last = i;
      onWord(i >= 0 ? i : null);
    }
  });
  onWord(null);
  return all;
}

/** A tapped word: just its slice of the page audio (a hair of padding so it isn't clipped). */
export function playWord(e: Entry, i: number): Promise<boolean> {
  const w = e.words[i];
  if (!w) return Promise.resolve(false);
  return play(e, Math.max(0, w[0] - 0.04), w[1] + 0.08);
}
