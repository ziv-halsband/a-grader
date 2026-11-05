"use client";

// What makes two lookalike letters different, measured on the real font (nothing hand-placed): both letters are
// drawn on a hidden canvas exactly as the screen draws them, lined up, and every bit of ink that belongs to only
// one of them is that letter's "telling part" (ב's foot, ד's corner, ה's gap, ז's hat…). The detective paints
// those parts orange and holds the glass over the biggest one.

/** How the detective draws a letter: in a 100×100 box, centered, on this baseline. */
export const GLYPH = { size: 120, weight: 700, x: 50, baseline: 74 } as const;

/** Canvas pixels per box unit (sharp enough for a 240px card on a retina iPad). */
const S = 4;
const N = 100 * S;

type Spot = { x: number; y: number };
/** For one letter: where to hold the glass, and an image of its own telling parts (orange, transparent elsewhere). */
export type LetterDiff = { spot: Spot; overlay: string };

function mask(ctx: CanvasRenderingContext2D, char: string): Uint8Array {
  ctx.clearRect(0, 0, N, N);
  ctx.fillText(char, GLYPH.x * S, GLYPH.baseline * S);
  const { data } = ctx.getImageData(0, 0, N, N);
  const out = new Uint8Array(N * N);
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  return out;
}

/** Moves a mask `dx` pixels to the right (what falls off is gone). */
function shifted(m: Uint8Array, dx: number): Uint8Array {
  const out = new Uint8Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = Math.max(0, dx); x < Math.min(N, N + dx); x++) out[y * N + x] = m[y * N + x - dx];
  return out;
}

/** Min (erode) or max (dilate) over a (2r+1)² square: a row pass, then a column pass. */
function morph(m: Uint8Array, r: number, erode: boolean): Uint8Array {
  const pass = (src: Uint8Array, rows: boolean) => {
    const out = new Uint8Array(N * N);
    for (let a = 0; a < N; a++)
      for (let b = 0; b < N; b++) {
        let v = erode ? 1 : 0;
        for (let k = Math.max(0, b - r); k <= Math.min(N - 1, b + r); k++) {
          const s = rows ? src[a * N + k] : src[k * N + a];
          if (erode ? !s : s) {
            v = erode ? 0 : 1;
            break;
          }
        }
        out[rows ? a * N + b : b * N + a] = v;
      }
    return out;
  };
  return pass(pass(m, true), false);
}

/** Removes thin slivers along the edges (anti-aliasing, tiny width differences): only real shapes stay. */
const opened = (m: Uint8Array, r: number) => morph(morph(m, r, true), r, false);

function overlayImage(m: Uint8Array): string {
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < m.length; i++)
    if (m[i]) img.data.set([249, 115, 22, 255], i * 4);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** The center (box units) of the square with half-side r holding the most set pixels. */
function busiest(m: Uint8Array, r: number): Spot {
  const W = N + 1;
  const sum = new Uint32Array(W * W);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) sum[(y + 1) * W + x + 1] = m[y * N + x] + sum[y * W + x + 1] + sum[(y + 1) * W + x] - sum[y * W + x];
  const R = r * S;
  let best = { x: 50, y: 50, n: -1 };
  for (let y = R; y <= N - R; y += S)
    for (let x = R; x <= N - R; x += S) {
      const n = sum[(y + R) * W + x + R] - sum[(y - R) * W + x + R] - sum[(y + R) * W + x - R] + sum[(y - R) * W + x - R];
      if (n > best.n) best = { x: x / S, y: y / S, n };
    }
  return { x: best.x, y: best.y };
}

/** Each letter's telling parts and where to hold the glass on it, or null without a canvas. */
export async function letterDiff(a: string, b: string, r: number): Promise<{ a: LetterDiff; b: LetterDiff } | null> {
  const family = getComputedStyle(document.body).fontFamily;
  const font = `${GLYPH.weight} ${GLYPH.size * S}px ${family}`;
  try {
    await document.fonts.load(font, a + b);
  } catch {
    // Font loading unsupported: measure with whatever is drawn.
  }
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.canvas.width = N;
  ctx.canvas.height = N;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const ma = mask(ctx, a);
  const mb = mask(ctx, b);
  // Line b up with a (ד and ר have different widths: centered, they'd differ all along the stem).
  let shift = 0;
  let least = Infinity;
  for (let dx = -20 * S; dx <= 20 * S; dx += S) {
    let n = 0;
    for (let y = 0; y < N; y += 2)
      for (let x = 0; x < N; x += 2) n += ma[y * N + x] ^ (x - dx >= 0 && x - dx < N ? mb[y * N + x - dx] : 0);
    if (n < least || (n === least && Math.abs(dx) < Math.abs(shift))) [least, shift] = [n, dx];
  }
  const mbAt = shifted(mb, shift);
  const onlyA = new Uint8Array(N * N);
  const onlyB = new Uint8Array(N * N);
  for (let i = 0; i < onlyA.length; i++) {
    onlyA[i] = ma[i] & (mbAt[i] ^ 1);
    onlyB[i] = mbAt[i] & (ma[i] ^ 1);
  }
  const partsA = opened(onlyA, 2 * S);
  const partsB = opened(onlyB, 2 * S);
  // One glass position for the pair (in a's place; b's is the same spot moved back), so the child compares like with like.
  const union = new Uint8Array(N * N);
  for (let i = 0; i < union.length; i++) union[i] = partsA[i] | partsB[i];
  const spot = busiest(union, r);
  return {
    a: { spot, overlay: overlayImage(partsA) },
    b: { spot: { x: spot.x - shift / S, y: spot.y }, overlay: overlayImage(shifted(partsB, -shift)) },
  };
}
