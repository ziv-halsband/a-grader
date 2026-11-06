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
  for (let i = 0; i < t.length;) {
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

/** A soft SVG path through a finger's points: straight to each midpoint, curving around the points between. */
export function smoothPath(pts: Pt[]): string {
  const f = (n: number) => n.toFixed(1);
  if (pts.length === 1) return `M ${f(pts[0].x)} ${f(pts[0].y)} l 0.01 0`; // a tap: a round dot
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    d += ` Q ${f(a.x)} ${f(a.y)} ${f((a.x + b.x) / 2)} ${f((a.y + b.y) / 2)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${f(last.x)} ${f(last.y)}`;
}


/**
 * Evens out a finger's tremble before drawing it: each point moves toward its neighbours (a small moving
 * average), the first and last points stay put. Only for drawing; the check uses the raw points.
 */
export function softenInk(pts: Pt[], passes = 2): Pt[] {
  let cur = pts;
  for (let k = 0; k < passes && cur.length > 2; k++) {
    cur = cur.map((p, i) =>
      i === 0 || i === cur.length - 1
        ? p
        : { x: (cur[i - 1].x + 2 * p.x + cur[i + 1].x) / 4, y: (cur[i - 1].y + 2 * p.y + cur[i + 1].y) / 4 },
    );
  }
  return cur;
}

// ── Free writing: the child's own ink (not snapped), checked against the letter. ──
// In plain words (so a parent or mom can follow it):
// 1. Ignore where and how big: the child's letter is moved and scaled onto the model letter (from about half to
//    twice the size; a little wider or taller is fine, FIT_ASPECT).
// 2. "Did you write all of it?" Each stroke of the model must be mostly covered by ink (COVER_R away at most).
// 3. "Did you write only the letter?" Most ink must sit on the model (INK_R), almost none far away (FAR_R), and
//    the ink may not cover much more paper than the letter does (a scribble; going over a line twice is fine).
// 4. Lookalikes: some letters must show their telling part, measured on the moved letter (TELLING):
//    ד's roof sticks out past its leg (ר's doesn't), ה's left leg leaves a gap under the roof (ח's touches it),
//    ז's leg hangs from the middle of its roof (ו's from the end), ב's base sticks out past its back (כ's
//    curves round). Final letters and ק must go below the bottom line; ו and ר must not hang far below it (ן, ך).
//    י is short and ו is long (between the lines). And if the ink fits another letter's shape clearly better
//    (LOOKS_LIKE), it's that letter (a נ when asked ג).
// 5. Stroke direction and order are NOT checked here: the trace rounds teach them; a 5-year-old who writes a
//    right-looking letter "backwards" still wrote the letter. (Mom decides.)
// 6. After two "not yet"s, rules 2–3 relax (EASIER); rule 4 stays.
// Tuned on synthetic children's letters (e2e/synthetic.ts, `node scripts/tune-writing.ts`, 6 Nov): a typical
// wobbly letter passes ~92% (very wobbly ~87%, half-size off-center ~85%); a wrong letter passes ~2%; scribbles ~4%.

/** How far ink may be from a model point and still cover it (after fitting, in the 100×100 box). */
export const COVER_R = 8;
/** An ink point this close to the model is "on the letter". */
export const INK_R = 9;
/** Ink this far from the model is "a big stray mark". */
export const FAR_R = 18;
export const COVER_PASS = 0.78;
/** Every stroke must be at least this covered (a missing stroke is a different letter: ה without its leg is ר). */
export const STROKE_PASS = 0.6;
export const PRECISION_PASS = 0.75;
/** Ink may cover at most this many times the paper the letter itself covers (more is a scribble). */
export const SPOTS_MAX = 1.5;
/** At most this share of the ink may be far away. */
export const FAR_PASS = 0.06;
/**
 * After two "not yet"s the wobble rules relax (a tired hand still wins); the lookalike rules stay, they are the
 * point of the check.
 */
export const EASIER = { cover: 0.7, stroke: 0.45, precision: 0.7, far: 0.1 };
/** Fitting: one side may stretch at most this many times more than the other… */
export const FIT_ASPECT = 1.35;
/** …and the whole letter may grow or shrink only this much (as drawn → as the model). */
export const FIT_MIN = 0.6;
export const FIT_MAX = 2.1;
/** The letter (its longer side) must be at least this big on the board: a dot or a tiny scrawl is not a letter. */
export const MIN_SIZE = 9;

/** Final letters and ק must reach at least this far down (the bottom line is at 80). */
export const BELOW_LINE = 83;
/** Letters whose final form only adds a long tail below the line (ו → ן, ר → ך). */
const SHORT_TAIL = ["vav", "resh"];
/** A י is short (it hangs from the top line), a ו is long (down to the bottom line); band height is 58. */
export const YOD_MAX = 42;
export const VAV_MIN = 34;
/** Fails when another letter fits this much better (its average distance × this is still smaller). */
export const LOOKS_LIKE = 0.8;
/** …then the model points farther than this from the ink light up. */
const LOOKS_LIKE_MARK = 4;

export type FreeMiss = "ok" | "empty" | "missing" | "stray" | "lookalike" | "below";

export type FreehandScore = {
  coverage: number;
  precision: number;
  /** The least-covered stroke's coverage. */
  minStroke: number;
  /** Share of ink far from the letter. */
  far: number;
  pass: boolean;
  /** Why not (for the hint and for tests). */
  miss: FreeMiss;
  /**
   * Per model stroke, per sample point: fine? false = missed, or the telling part of a lookalike, or the part
   * below the line (to light up in the hint).
   */
  covered: boolean[][];
  /** The first stroke that needs work (where the 👆 points). */
  hintStroke: number;
  /** How the ink was moved onto the model: model = ink × s + t. */
  fit: Fit;
  /** The letter it looks more like, when that's why it failed. */
  like: string | null;
};

export type Fit = { sx: number; sy: number; tx: number; ty: number };

type Bounds = { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number };
function bounds(pts: Pt[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

const lengthOf = (s: Pt[]) => s.reduce((a, p, i) => (i ? a + Math.hypot(p.x - s[i - 1].x, p.y - s[i - 1].y) : a), 0);

/** Points about 1 unit apart along each ink stroke (fast fingers leave big gaps between events). */
function densify(stroke: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < stroke.length; i++) {
    const b = stroke[i];
    if (i > 0) {
      const a = stroke[i - 1];
      const n = Math.floor(Math.hypot(b.x - a.x, b.y - a.y));
      for (let k = 1; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
    }
    out.push(b);
  }
  return out;
}

const near = (p: Pt, pts: Pt[], r: number) =>
  pts.some((q) => Math.abs(q.x - p.x) <= r && Math.hypot(q.x - p.x, q.y - p.y) <= r);

/** Moves and scales the ink's box onto the model's box (see rule 1). */
export function fitInk(model: Pt[], ink: Pt[], bounded = true): Fit {
  const L = bounds(model);
  const I = bounds(ink);
  // A thin letter (ו, a line) has almost no width: count it as at least a quarter of its height.
  const w = (b: Bounds) => Math.max(b.w, b.h / 4, 1);
  const h = (b: Bounds) => Math.max(b.h, b.w / 4, 1);
  const sx0 = w(L) / w(I);
  const sy0 = h(L) / h(I);
  // Overall size: from half the size to twice it (a י as big as the board is not a י).
  const s0 = Math.sqrt(sx0 * sy0);
  const s = bounded ? Math.min(FIT_MAX, Math.max(FIT_MIN, s0)) : s0;
  // Wider or taller than the model: only up to FIT_ASPECT.
  const a = Math.min(Math.sqrt(FIT_ASPECT), Math.max(1 / Math.sqrt(FIT_ASPECT), Math.sqrt(sx0 / sy0)));
  const sx = s * a;
  const sy = s / a;
  return {
    sx,
    sy,
    tx: (L.minX + L.maxX) / 2 - ((I.minX + I.maxX) / 2) * sx,
    ty: (L.minY + L.maxY) / 2 - ((I.minY + I.maxY) / 2) * sy,
  };
}

const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Below the bottom line: final letters and ק. */
const DESCENDS = (letterId: string) => strokesFor(letterId).some((s) => s.some((p) => p.y > 85));

/**
 * The lookalike rule for a letter (rule 4), on the fitted ink. `ok` = the telling part looks right;
 * `part` = which model points are the telling part (lit up in the hint).
 */
function tellingPart(
  letterId: string,
  pts: Pt[],
): { v: number; ok: boolean; part: (stroke: number, p: Pt) => boolean } | null {
  const xsIn = (y0: number, y1: number, f: (p: Pt) => boolean = () => true) =>
    pts.filter((p) => p.y >= y0 && p.y <= y1 && f(p)).map((p) => p.x);
  /** How far the roof sticks out to the right of the leg's top (ד ≈ 12, ר ≈ 0, ו ≈ 0, ז ≈ 16). */
  const overhang = () => Math.max(...xsIn(0, 34)) - median(xsIn(36, 56));
  /** The shorter of the roof's two sides around the leg (ז ≈ 16, ו ≈ 0). */
  const middle = () => {
    const leg = median(xsIn(36, 56));
    return Math.min(Math.max(...xsIn(0, 34)) - leg, leg - Math.min(...xsIn(0, 34)));
  };
  /** The empty space between the roof and the top of the left leg (ה ≈ 22, ח ≈ 0). */
  const gap = (left: number) => {
    const bins = new Array(20).fill(false);
    for (const p of pts) if (p.x < left && p.y >= 22 && p.y <= 82) bins[Math.min(19, Math.floor((p.y - 22) / 3))] = true;
    let i = bins.lastIndexOf(true);
    if (i < 0) return 60;
    // Walk up the leg; one empty bin is a wobble, two are a gap.
    while (i > 0 && (bins[i - 1] || (i > 1 && bins[i - 2]))) i -= bins[i - 1] ? 1 : 2;
    return i * 3;
  };
  /** How far the base sticks out to the right of the back (ב ≈ 8, כ ≈ 0). */
  const foot = () => Math.max(...xsIn(70, 100)) - median(xsIn(46, 66, (p) => p.x > 50));
  const rule = TELLING[letterId];
  if (!rule) return null;
  const v = { overhang, middle, gap: () => gap(rule.left ?? 0), foot }[rule.measure]();
  return { v, ok: !(v < rule.min || v > rule.max), part: rule.part };
}

/**
 * The lookalike rules (rule 4): what to measure on the fitted ink, the range that is right, and which model
 * points are the telling part. Ranges tuned with scripts/tune-writing.ts (a kid's letter vs. its lookalike).
 */
const TELLING: Record<
  string,
  { measure: "overhang" | "middle" | "gap" | "foot"; min: number; max: number; left?: number; part: (s: number, p: Pt) => boolean }
> = {
  dalet: { measure: "overhang", min: 4.5, max: Infinity, part: (s, p) => s === 0 && p.x > 64 },
  resh: { measure: "overhang", min: -Infinity, max: 4.5, part: (s, p) => s === 0 && p.x > 64 },
  he: { measure: "gap", left: 37, min: 10, max: Infinity, part: (s, p) => s === 1 && p.y < 54 },
  het: { measure: "gap", left: 41, min: -Infinity, max: 12, part: (s, p) => s === 1 && p.y < 44 },
  vav: { measure: "overhang", min: -Infinity, max: 5.8, part: (s, p) => s === 0 && p.y < 24 },
  zayin: { measure: "middle", min: 5, max: Infinity, part: (s) => s === 0 },
  bet: { measure: "foot", min: 1, max: Infinity, part: (s, p) => s === 1 && p.x > 70 },
  kaf: { measure: "foot", min: -Infinity, max: 2, part: (_s, p) => p.y > 64 && p.x > 60 },
};

/** For tuning: a letter's lookalike measure on some ink (NaN when the letter has no rule). */
export function tellingMeasure(letterId: string, ink: Pt[][]): number {
  const raw = ink.filter((s) => s.length > 1).flatMap(densify);
  const model = strokesFor(letterId).flat();
  if (!raw.length || !TELLING[letterId]) return NaN;
  return tellingPart(letterId, fitTo(model, raw).pts)?.v ?? NaN;
}

/** The ink moved onto a letter's model (rule 1), and how far apart they are on average (both ways). */
function fitTo(model: Pt[], raw: Pt[], bounded = true) {
  const fit = fitInk(model, raw, bounded);
  const pts = raw.map((p) => ({ x: p.x * fit.sx + fit.tx, y: p.y * fit.sy + fit.ty }));
  const nearest = (p: Pt, qs: Pt[]) => {
    let best = Infinity;
    for (const q of qs) best = Math.min(best, (q.x - p.x) ** 2 + (q.y - p.y) ** 2);
    return Math.sqrt(best);
  };
  const thin = (qs: Pt[]) => qs.filter((_, i) => i % 2 === 0);
  const a = thin(model);
  const b = thin(pts);
  // Measured at the child's own size (so a tiny model like י doesn't win by shrinking everything).
  const dist =
    (a.reduce((t, p) => t + nearest(p, b), 0) / a.length + b.reduce((t, p) => t + nearest(p, a), 0) / b.length) /
    2 /
    Math.sqrt(fit.sx * fit.sy);
  return { fit, pts, dist };
}

/**
 * Letters told apart by a rule of their own (rule 4) or by size and the lines (ו/י/ן, ר/ך), not by "which fits
 * better": their shapes are too close for that to be fair to a wobbly hand.
 */
const TOLD_APART = [
  ["dalet", "resh"],
  ["he", "het"],
  ["vav", "zayin"],
  ["bet", "kaf"],
  ["vav", "yod", "nun-sofit"],
  ["resh", "kaf-sofit"],
  ["dalet", "kaf-sofit"],
  ["yod", "dalet", "resh", "kaf-sofit"],
  ["nun", "nun-sofit"],
  ["zayin", "nun-sofit"],
];
const toldApart = (a: string, b: string) => TOLD_APART.some((g) => g.includes(a) && g.includes(b));

/**
 * Does the ink look clearly more like another letter (shape only: size and place don't count here)?
 * Returns that letter's id, or null.
 */
export function looksMoreLike(letterId: string, raw: Pt[]): string | null {
  const own = fitTo(strokesFor(letterId).flat(), raw, false).dist;
  let best: string | null = null;
  let bestD = own * LOOKS_LIKE;
  for (const [id, m] of models()) {
    if (id === letterId || toldApart(id, letterId)) continue;
    const d = fitTo(m, raw, false).dist;
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

/** Every letter's model points (for "does it look more like another letter?"). */
let MODELS: [string, Pt[]][] | null = null;
const models = () => (MODELS ??= Object.keys(STROKES).map((id) => [id, strokesFor(id).flat()]));

/** How close is the child's freehand ink (strokes of points in the 100×100 box) to the letter? */
export function scoreFreehand(letterId: string, ink: Pt[][], { easier = false } = {}): FreehandScore {
  const letter = strokesFor(letterId);
  const model = letter.flat();
  // A tap or a palm brushing the board is not part of the letter.
  const real = ink.filter((s) => s.length > 1 && lengthOf(s) >= 2.5);
  const raw = real.flatMap(densify);
  const none = (miss: FreeMiss): FreehandScore => ({
    coverage: 0,
    precision: 0,
    minStroke: 0,
    far: 1,
    pass: false,
    miss,
    covered: letter.map((s) => s.map(() => false)),
    hintStroke: 0,
    fit: { sx: 1, sy: 1, tx: 0, ty: 0 },
    like: null,
  });
  if (!raw.length) return none("empty");
  const rb = bounds(raw);
  if (Math.max(rb.w, rb.h) < MIN_SIZE) return none("missing");

  const { fit, pts } = fitTo(model, raw);
  const covered = letter.map((s) => s.map((p) => near(p, pts, COVER_R)));
  const perStroke = covered.map((s) => s.filter(Boolean).length / s.length);
  const coverage = covered.flat().filter(Boolean).length / model.length;
  const minStroke = Math.min(...perStroke);
  const precision = pts.filter((p) => near(p, model, INK_R)).length / pts.length;
  const far = pts.filter((p) => !near(p, model, FAR_R)).length / pts.length;
  // How much of the paper has ink, at the model's size: a scribble covers far more than the letter
  // (going over a line twice adds nothing, so a child who "fixes" a stroke isn't punished).
  const spots = (qs: Pt[]) => new Set(qs.map((p) => `${Math.floor(p.x / 3)},${Math.floor(p.y / 3)}`)).size;
  const inkSpots = spots(pts);
  const modelSpots = spots(model);

  let miss: FreeMiss = "ok";
  const k = easier ? EASIER : { cover: COVER_PASS, stroke: STROKE_PASS, precision: PRECISION_PASS, far: FAR_PASS };
  if (coverage < k.cover || minStroke < k.stroke) miss = "missing";
  else if (precision < k.precision || far > k.far || inkSpots > modelSpots * SPOTS_MAX) miss = "stray";

  // The telling part of a lookalike, and going below the line.
  let mark: ((s: number, p: Pt) => boolean) | null = null;
  let like: string | null = null;
  if (miss === "ok") {
    const t = tellingPart(letterId, pts);
    if (t && !t.ok) {
      miss = "lookalike";
      mark = t.part;
    } else if (DESCENDS(letterId) && rb.maxY < BELOW_LINE) {
      miss = "below";
      mark = (_s, p) => p.y > 78;
    } else if (SHORT_TAIL.includes(letterId) && rb.maxY > 86 && rb.maxY - 80 > rb.h * 0.12) {
      // ו and ר that hang far below the line are ן and ך.
      miss = "lookalike";
      mark = (_s, p) => p.y > 70;
    } else if ((letterId === "yod" && rb.h > YOD_MAX) || (letterId === "vav" && rb.h < VAV_MIN)) {
      // י and ו are the same shape: a י hangs from the top line, a ו reaches the bottom one.
      miss = "lookalike";
      mark = (_s, p) => p.y > 40;
    } else if ((like = looksMoreLike(letterId, raw))) {
      // It fits another letter clearly better (a נ when asked ג, a ס when asked ם): light up what's off.
      miss = "lookalike";
      mark = (_s, p) => !near(p, pts, LOOKS_LIKE_MARK);
    }
  }
  const shown = mark ? letter.map((s, i) => s.map((p, k) => covered[i][k] && !mark(i, p))) : covered;
  const firstBad = shown.findIndex((s, i) => s.some((c) => !c) && (mark || perStroke[i] < 0.95));
  return {
    coverage,
    precision,
    minStroke,
    far,
    pass: miss === "ok",
    miss,
    covered: shown,
    hintStroke: Math.max(0, firstBad),
    fit,
    like,
  };
}
