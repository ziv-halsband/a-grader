// How to write each letter: its strokes, in order, as SVG paths in a 100×100 box
// (writing line from y=22 to y=80; final letters and ק go down to y=96).
// DRAFT: stroke order and direction follow common print-letter teaching (top to bottom, start at the top),
// but mom must check every letter. Her way of writing is the one children will learn.
//
// Path syntax used here: M x y · L x y · Q cx cy x y (nothing else).

export const STROKES: Record<string, string[]> = {
  alef: ["M 26 22 L 74 80", "M 74 22 L 74 42 Q 74 56 62 62", "M 44 44 Q 28 56 28 80"],
  bet: ["M 24 22 L 66 22 Q 76 22 76 32 L 76 76", "M 84 78 L 20 78"],
  gimel: ["M 46 22 L 56 22 Q 64 22 64 32 L 66 80", "M 64 56 L 42 80"],
  dalet: ["M 20 22 L 80 22", "M 68 22 L 68 80"],
  he: ["M 20 22 L 66 22 Q 76 22 76 32 L 76 80", "M 28 44 L 28 80"],
  vav: ["M 42 22 L 56 22 L 56 80"],
  zayin: ["M 34 22 L 68 22", "M 52 22 L 52 80"],
  het: ["M 24 22 L 66 22 Q 76 22 76 32 L 76 80", "M 26 22 L 26 80"],
  tet: ["M 28 22 L 28 68 Q 28 80 42 80 L 62 80 Q 76 80 76 66 L 76 36 Q 76 24 64 26 L 52 34"],
  yod: ["M 42 22 L 56 22 L 56 44"],
  kaf: ["M 24 22 L 64 22 Q 76 22 76 34 L 76 66 Q 76 78 64 78 L 24 78"],
  lamed: ["M 26 6 L 26 30 L 66 30 Q 74 30 74 40 L 74 50 Q 74 64 50 82"],
  mem: ["M 30 20 L 30 30 Q 28 60 22 80", "M 30 22 L 66 22 Q 76 22 76 32 L 76 78 L 48 78"],
  nun: ["M 44 22 L 56 22 L 56 78 L 28 78"],
  samekh: ["M 24 22 L 64 22 Q 78 22 78 36 L 78 64 Q 78 78 64 78 L 38 78 Q 24 78 24 64 L 24 22"],
  ayin: ["M 72 22 L 72 60 Q 70 80 28 80", "M 28 22 L 64 70"],
  pe: ["M 42 48 Q 28 48 28 36 Q 28 22 40 22 L 64 22 Q 76 22 76 34 L 76 66 Q 76 78 64 78 L 24 78"],
  tsadi: ["M 26 22 L 66 70 Q 70 78 60 78 L 24 78", "M 74 22 L 74 36 Q 74 48 52 50"],
  qof: ["M 22 22 L 66 22 Q 78 22 78 34 L 78 54", "M 28 40 L 28 96"],
  resh: ["M 22 22 L 66 22 Q 76 22 76 32 L 76 80"],
  shin: ["M 24 22 L 24 66 Q 24 78 36 78 L 64 78 Q 76 78 76 66 L 76 22", "M 48 22 L 54 70"],
  tav: ["M 22 22 L 68 22 Q 78 22 78 32 L 78 80", "M 34 22 L 34 74 Q 34 80 24 80"],
  "kaf-sofit": ["M 22 22 L 66 22 Q 76 22 76 32 L 76 96"],
  "mem-sofit": ["M 24 22 L 66 22 Q 76 22 76 32 L 76 78 L 24 78 L 24 22"],
  "nun-sofit": ["M 44 22 L 56 22 L 56 96"],
  "pe-sofit": ["M 42 48 Q 28 48 28 36 Q 28 22 40 22 L 64 22 Q 76 22 76 34 L 76 96"],
  "tsadi-sofit": ["M 74 22 L 74 96", "M 30 22 L 70 52"],
};

export type Pt = { x: number; y: number };

/** Turns a path into points about 1 unit apart, in drawing order. */
export function samplePath(d: string): Pt[] {
  const t = d.trim().split(/\s+/);
  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  const push = (p: Pt) => pts.push(p);
  for (let i = 0; i < t.length; ) {
    const cmd = t[i++];
    if (cmd === "M") {
      cur = { x: +t[i++], y: +t[i++] };
      push(cur);
    } else if (cmd === "L") {
      const to = { x: +t[i++], y: +t[i++] };
      const n = Math.max(1, Math.ceil(Math.hypot(to.x - cur.x, to.y - cur.y)));
      for (let k = 1; k <= n; k++) push({ x: cur.x + ((to.x - cur.x) * k) / n, y: cur.y + ((to.y - cur.y) * k) / n });
      cur = to;
    } else if (cmd === "Q") {
      const c = { x: +t[i++], y: +t[i++] };
      const to = { x: +t[i++], y: +t[i++] };
      const approx = Math.hypot(c.x - cur.x, c.y - cur.y) + Math.hypot(to.x - c.x, to.y - c.y);
      const n = Math.max(2, Math.ceil(approx));
      for (let k = 1; k <= n; k++) {
        const s = k / n;
        const a = (1 - s) * (1 - s);
        const b = 2 * (1 - s) * s;
        const e = s * s;
        push({ x: a * cur.x + b * c.x + e * to.x, y: a * cur.y + b * c.y + e * to.y });
      }
      cur = to;
    } else {
      throw new Error(`Unsupported path command "${cmd}" in "${d}"`);
    }
  }
  return pts;
}

export function strokesFor(letterId: string): Pt[][] {
  return (STROKES[letterId] ?? []).map(samplePath);
}

/** Polyline "x,y x,y …" for SVG. */
export function toPoints(pts: Pt[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}
