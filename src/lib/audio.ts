"use client";

// Plays guide lines one after another (e.g. "אֵיפֹה הָאוֹת" + "מֵם").
// A new call stops whatever is playing, so fast taps never mix sounds from two questions.

import manifest from "@/content/audio-manifest.json";

let current: HTMLAudioElement | null = null;
let finishCurrent: (() => void) | null = null;
let token = 0;

export function stopAudio() {
  token++;
  current?.pause();
  current = null;
  finishCurrent?.();
  finishCurrent = null;
}

const files = manifest as Record<string, { file?: string }>;

export function hasAudio(id: string) {
  return id in files;
}

export function audioUrl(id: string) {
  return `/audio/${files[id]?.file ?? `${id}.m4a`}`;
}

/** Resolves when the whole sequence finished or was interrupted by another call. */
export async function say(...ids: string[]): Promise<void> {
  stopAudio();
  const mine = token;
  for (const id of ids) {
    if (mine !== token) return;
    if (!hasAudio(id)) continue;
    await new Promise<void>((resolve) => {
      const a = new Audio(audioUrl(id));
      current = a;
      finishCurrent = resolve;
      a.onended = a.onerror = () => resolve();
      a.play().catch(() => resolve()); // autoplay blocked: the caption is still on screen
    });
  }
}

let ctx: AudioContext | null = null;

/** A tiny synthesized "pop" for bubbles: no file needed. */
export function popSound() {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.16);
  } catch {
    // No Web Audio: silent pop is fine.
  }
}
