import { useId } from "react";
import { smoothPath, softenInk } from "@/content/writing";
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
  const fid = `sig-crayon-${useId().replace(/:/g, "")}`;
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
      <defs>
        {/* The same crayon grain as the writing board. */}
        <filter id={fid} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.9 1.3" result="g" />
          <feComposite in="d" in2="g" operator="in" />
        </filter>
      </defs>
      {lines && (
        <>
          <rect x="0" y="22" width={width} height="58" fill="#e6f0fb" opacity="0.5" />
          <line x1="0" x2={width} y1="22" y2="22" stroke="#9cbde6" strokeWidth="0.6" />
          <line x1="0" x2={width} y1="80" y2="80" stroke="#5f8fd1" strokeWidth="1" />
        </>
      )}
      {letters.map((strokes, i) => (
        <g key={i} filter={`url(#${fid})`} transform={`translate(${width - PAD - offsets[i] - spans[i].max} 0)`}>
          {strokes.map((s, j) => (
            <path
              key={j}
              d={smoothPath(softenInk(s.pts))}
              pathLength={animate ? 1 : undefined}
              fill="none"
              stroke={s.color}
              strokeWidth="5.2"
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
