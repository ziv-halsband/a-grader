// Synthetic children's letters for testing the free-writing check (no browser needed).
// A seeded random generator, so every run draws the same letters.
import { STROKES, strokesFor, type Pt } from "../src/content/writing.ts";

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

export type Kid = {
  /** Whole-letter size (1 = the model's size). */
  scale?: number;
  /** Whole-letter shift in board units. */
  dx?: number;
  dy?: number;
  /** How messy: 0 = neat, 1 = a typical 5-year-old, 1.4 = a very wobbly one. */
  mess?: number;
};

/** A child's version of a letter: wobble, a tilt, strokes that don't quite meet, few finger events. */
export function kidLetter(letterId: string, seed: number, { scale = 1, dx = 0, dy = 0, mess = 1 }: Kid = {}): Pt[][] {
  const r = rng(seed);
  const u = (a: number) => (r() * 2 - 1) * a * mess;
  const model = strokesFor(letterId);
  const all = model.flat();
  const cx = all.reduce((a, p) => a + p.x, 0) / all.length;
  const cy = all.reduce((a, p) => a + p.y, 0) / all.length;
  const ax = 1 + u(0.12);
  const ay = 1 + u(0.12);
  const rot = (u(6) * Math.PI) / 180;
  const shear = u(0.08);
  return model.map((s) => {
    const ox = u(3);
    const oy = u(3);
    const ph = r() * 6;
    const amp = 1.8 * mess;
    const start = Math.floor(s.length * r() * 0.07 * mess);
    const end = s.length - Math.floor(s.length * r() * 0.09 * mess);
    const out: Pt[] = [];
    const step = 3 + Math.floor(r() * 4);
    for (let i = start; i < end; i += step) out.push(s[i]);
    out.push(s[end - 1]);
    return out.map((p, k) => {
      let x = (p.x - cx) * ax + shear * (p.y - cy);
      let y = (p.y - cy) * ay;
      [x, y] = [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)];
      const w = amp * Math.sin(k * 0.7 + ph);
      return {
        x: cx + dx + x * scale + ox + w + u(0.6),
        y: cy + dy + y * scale + oy + amp * Math.cos(k * 0.5 + ph) + u(0.6),
      };
    });
  });
}

/** A zigzag scribble filling the letter's area (what a child does to "finish quickly"). */
export function zigzag(letterId: string, seed: number, rows = 6): Pt[][] {
  const r = rng(seed);
  const all = strokesFor(letterId).flat();
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pts: Pt[] = [];
  for (let i = 0; i <= rows; i++) {
    pts.push({ x: i % 2 ? x0 + r() * 6 : x1 - r() * 6, y: y0 + ((y1 - y0) * i) / rows + r() * 4 });
  }
  return [pts];
}

/** A round scribble: loops around the middle of the board. */
export function loops(seed: number, n = 3): Pt[][] {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let t = 0; t < n * Math.PI * 2; t += 0.35) {
    pts.push({ x: 50 + Math.cos(t) * (18 + r() * 10) + t, y: 50 + Math.sin(t) * (20 + r() * 8) });
  }
  return [pts];
}

/** A random wander of short lines (a toddler's "drawing"). */
export function wander(seed: number): Pt[][] {
  const r = rng(seed);
  return Array.from({ length: 3 }, () => {
    let p = { x: 20 + r() * 60, y: 20 + r() * 60 };
    const s = [p];
    for (let k = 0; k < 8; k++) {
      p = { x: Math.min(95, Math.max(5, p.x + (r() * 2 - 1) * 22)), y: Math.min(95, Math.max(5, p.y + (r() * 2 - 1) * 22)) };
      s.push(p);
    }
    return s;
  });
}

export const LETTER_IDS = Object.keys(STROKES);
