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

// Sound effects, synthesized (no files): they carry the feedback so the voice can say less.
// Soft on purpose: no harsh "wrong" buzzer.

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, dur: number, opts: { type?: OscillatorType; to?: number; gain?: number } = {}) {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + start;
    o.type = opts.type ?? "sine";
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    // No Web Audio: silence is fine.
  }
}

/** Bubble pop / a stroke finished. */
export function popSound() {
  tone(900, 0, 0.14, { to: 200, gain: 0.25 });
}

/** A right answer: two bright notes going up. */
export function rightSound() {
  tone(660, 0, 0.12, { type: "triangle" });
  tone(990, 0.09, 0.22, { type: "triangle" });
}

/** A wrong tap: one low, soft "boop". */
export function wrongSound() {
  tone(220, 0, 0.18, { to: 160, gain: 0.15 });
}

/** A reward: a little sparkle arpeggio. */
export function sparkleSound() {
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.25, { type: "triangle", gain: 0.12 }));
}

/** A tap on something alive (letter, buddy). */
export function boingSound() {
  tone(300, 0, 0.18, { to: 600, type: "sine", gain: 0.15 });
}
