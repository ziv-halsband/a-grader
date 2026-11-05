import { smoothPath } from "@/content/writing";
import type { NameSignature as Signature } from "@/lib/store";

/** Space between letters, between words and around the name (in the letters' 100-unit writing box). */
const GAP = 18;
const WORD_GAP = 40;
const PAD = 14;

/**
 * ✍️ The child's name in their own strokes, right to left like Hebrew, each stroke in the crayon it was
 * written with. `animate` writes it again stroke by stroke (the celebration). Scales to its container.
 */
export function NameSignature({
  signature,
  animate = false,
  lines = false,
  className = "",
}: {
  signature: Pick<Signature, "name" | "letters">;
  animate?: boolean;
  /** Notebook lines behind the name. */
  lines?: boolean;
  className?: string;
}) {
  const words = signature.name.split(" ").map((w) => [...w].length);
  const count = words.reduce((a, b) => a + b, 0);
  const letters = signature.letters.slice(0, count).map((l) => l.filter((s) => s.pts.length));

  // Each letter as wide as the child wrote it, packed right to left like handwriting (a narrow י takes little room).
  const spans = letters.map((l) => {
    const xs = l.flatMap((s) => s.pts.map((p) => p.x));
    return xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : { min: 40, max: 60 };
  });
  /** Where each letter's right edge sits, measured leftward from the name's right edge. */
  const offsets: number[] = [];
  let pen = 0;
  let k = 0;
  words.forEach((n, w) => {
    if (w > 0) pen += WORD_GAP - GAP;
    for (let i = 0; i < n && k < spans.length; i++, k++) {
      offsets.push(pen);
      pen += spans[k].max - spans[k].min + GAP;
    }
  });
  const width = Math.max(1, pen - GAP) + PAD * 2;

  /** Running stroke number at the start of each letter (for the stroke-by-stroke animation). */
  const firstStroke = letters.map((_, i) => letters.slice(0, i).reduce((a, l) => a + l.length, 0));
  return (
    <svg viewBox={`0 6 ${width} 94`} className={className} role="img" aria-label={`השם ${signature.name} בכתב היד שלי`}>
      {lines && (
        <>
          <line x1="4" x2={width - 4} y1="22" y2="22" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="4" x2={width - 4} y1="80" y2="80" stroke="#cbd5e1" strokeWidth="1" />
        </>
      )}
      {letters.map((strokes, i) => (
        <g key={i} transform={`translate(${width - PAD - offsets[i] - spans[i].max} 0)`}>
          {strokes.map((s, j) => (
            <path
              key={j}
              d={smoothPath(s.pts)}
              pathLength={animate ? 1 : undefined}
              fill="none"
              stroke={s.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animate ? "anim-ink" : undefined}
              style={animate ? { animationDelay: `${300 + (firstStroke[i] + j) * 380}ms` } : undefined}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
