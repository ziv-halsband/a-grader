"use client";

// Plays guide lines one after another (e.g. "אֵיפֹה הָאוֹת" + "מֵם").
// A new call stops whatever is playing, so fast taps never mix sounds from two questions.

import manifest from "@/content/audio-manifest.json";
import { VOICE_BY_ID } from "@/content/voice";

let current: HTMLAudioElement | null = null;
let finishCurrent: (() => void) | null = null;
let token = 0;

export function stopAudio() {
  token++;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  current?.pause();
  current = null;
  finishCurrent?.();
  finishCurrent = null;
}

/**
 * Another player (the story reader) takes the speaker: whatever was playing stops, and the next `say` stops it.
 * Returns a check: is it still ours?
 */
export function claimAudio(a: HTMLAudioElement, finish: () => void): () => boolean {
  stopAudio();
  const mine = token;
  current = a;
  finishCurrent = finish;
  return () => mine === token;
}

const files = manifest as Record<string, { file?: string }>;

/**
 * Lines made on the device at runtime (e.g. the child's name, recorded by a parent): id → caption + audio URL.
 * They play like any other line; they never leave the device.
 */
const dynamic = new Map<string, { text: string; url?: string }>();

export function registerLine(id: string, text: string, url?: string) {
  dynamic.set(id, { text, url });
}

export function dynamicText(id: string): string | undefined {
  return dynamic.get(id)?.text;
}

export function hasAudio(id: string) {
  return id in files || !!dynamic.get(id)?.url;
}

export function audioUrl(id: string) {
  return dynamic.get(id)?.url ?? `/audio/${files[id]?.file ?? `${id}.m4a`}`;
}

/** Resolves when the whole sequence finished or was interrupted by another call. */
export async function say(...ids: string[]): Promise<void> {
  await sayStepped(ids);
}

/**
 * Like `say`, and calls `onStep(i)` as line i starts (e.g. to light up the letter while its name is said).
 * Resolves true if every line played to the end, false if another call cut it off. A line without audio is skipped.
 */
export async function sayStepped(ids: string[], onStep?: (i: number) => void, rate = 1): Promise<boolean> {
  stopAudio();
  const mine = token;
  for (const [i, id] of ids.entries()) {
    if (mine !== token) return false;
    if (!hasAudio(id)) {
      // No recording yet (ElevenLabs credits ran out): the device's own Hebrew voice says it instead.
      const line = VOICE_BY_ID[id];
      if (!line || !canSpeak()) continue;
      onStep?.(i);
      await utter(line.spoken ?? line.text, 0.85 * rate);
      continue;
    }
    onStep?.(i);
    await new Promise<void>((resolve) => {
      const a = new Audio(audioUrl(id));
      if (rate !== 1) {
        a.playbackRate = rate;
        a.preservesPitch = true; // slower, not deeper: "לְאַט…"
      }
      current = a;
      finishCurrent = resolve;
      a.onended = a.onerror = () => resolve();
      a.play().catch(() => resolve()); // autoplay blocked: the caption is still on screen
    });
  }
  return mine === token;
}

// ── The device's own Hebrew voice (speechSynthesis): for lines and story pages without a recording yet ──

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** A Hebrew voice if the device has one (iPad: "Carmit"); otherwise lang alone picks one. */
function hebrewVoice(): SpeechSynthesisVoice | undefined {
  try {
    return speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("he"));
  } catch {
    return undefined;
  }
}

/**
 * Speaks one text and resolves when it's done or cut off (stopAudio). `onBoundary(charIndex)` fires on each word
 * when the browser reports word boundaries (Safari does; some Chrome voices don't). A safety timer resolves it
 * if the device never says "done" (no voice installed, a headless browser).
 */
function utter(text: string, rate: number, onBoundary?: (charIndex: number) => void): Promise<void> {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      resolve();
    };
    const safety = setTimeout(finish, 2500 + text.length * 160);
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "he-IL";
      const v = hebrewVoice();
      if (v) u.voice = v;
      u.rate = rate;
      if (onBoundary) u.onboundary = (e) => e.name === "word" && onBoundary(e.charIndex);
      u.onend = u.onerror = finish;
      finishCurrent = finish;
      speechSynthesis.speak(u);
    } catch {
      finish();
    }
  });
}

/**
 * Says any text with the device's Hebrew voice (rate ~0.85: children read along), stopping whatever was playing.
 * Resolves true if it was said to the end, false if cut off or there is no voice at all.
 */
export async function speakText(text: string, onBoundary?: (charIndex: number) => void, rate = 0.85): Promise<boolean> {
  stopAudio();
  if (!canSpeak()) return false;
  const mine = token;
  await utter(text, rate, onBoundary);
  return mine === token;
}

/** Says lines at another speed (0.6 = slowly, to stretch a syllable or a word while blending). */
export async function sayAt(rate: number, ...ids: string[]): Promise<boolean> {
  return sayStepped(ids, undefined, rate);
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

/** A short burst of filtered noise (a clap, a snare hit). */
function noise(start: number, dur: number, gain: number, freq = 1800) {
  try {
    ctx ??= new AudioContext();
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    const g = ctx.createGain();
    const t = ctx.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  } catch {
    // No Web Audio: silence is fine.
  }
}

/** The quiz show, before each question: a soft snare roll that grows, then a "ta-da" (~1.4s). */
export function drumrollSound() {
  for (let i = 0; i < 22; i++) noise(i * 0.05, 0.06, 0.05 + i * 0.008, 1200);
  tone(523, 1.15, 0.2, { type: "triangle", gain: 0.15 });
  tone(784, 1.25, 0.35, { type: "triangle", gain: 0.15 });
}

/** The end of the show: a small crowd clapping for ~2 seconds. */
export function applauseSound() {
  for (let i = 0; i < 80; i++) {
    const at = Math.random() * 2;
    noise(at, 0.03 + Math.random() * 0.03, 0.14 * (1 - at / 2.4), 1400 + Math.random() * 1600);
  }
}

/** A peg of the wheel passing the pointer. */
export function tickSound() {
  tone(1500, 0, 0.03, { type: "square", gain: 0.05 });
}

/** A ⭐ lands in the prize (a step finished): a soft bright "ting". */
export function starSound() {
  tone(1319, 0, 0.18, { type: "triangle", gain: 0.12 });
  tone(1760, 0.08, 0.3, { type: "triangle", gain: 0.1 });
}

/** The prize is still locked: a soft wooden "knock-knock" (not a "wrong" sound). */
export function lockedSound() {
  tone(330, 0, 0.09, { type: "square", to: 260, gain: 0.05 });
  tone(330, 0.14, 0.09, { type: "square", to: 260, gain: 0.05 });
}

/** The lock pops off the prize: a little click, then notes going up. */
export function unlockSound() {
  tone(1800, 0, 0.04, { type: "square", gain: 0.05 });
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.08 + i * 0.06, 0.25, { type: "triangle", gain: 0.11 }));
}
