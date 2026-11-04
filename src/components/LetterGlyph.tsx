import { strokesFor, toPoints, type Pt } from "@/content/writing";

/**
 * A letter drawn from its writing strokes, for paper:
 *  model = solid letter with numbered start dots and direction arrows
 *  trace = light dashed letter to go over with a pencil
 *  dots  = only the start dot of the first stroke (write alone)
 */
export function LetterGlyph({ letterId, mode, className = "" }: { letterId: string; mode: "model" | "trace" | "dots"; className?: string }) {
  const strokes = strokesFor(letterId);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <line x1="2" x2="98" y1="22" y2="22" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="2 2" />
      <line x1="2" x2="98" y1="80" y2="80" stroke="#94a3b8" strokeWidth="0.8" />
      {mode !== "dots" &&
        strokes.map((pts, i) => (
          <polyline
            key={i}
            points={toPoints(pts)}
            fill="none"
            stroke={mode === "model" ? "#1e293b" : "#64748b"}
            strokeWidth={mode === "model" ? 7 : 3.8}
            strokeDasharray={mode === "trace" ? "0.1 4.6" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      {mode === "model" &&
        strokes.map((pts, i) => (
          <g key={`m${i}`}>
            {arrowAt(pts) && (
              <path
                d="M -3 -2.6 L 3 0 L -3 2.6 Z"
                fill="#f97316"
                transform={`translate(${arrowAt(pts)!.x} ${arrowAt(pts)!.y}) rotate(${arrowAt(pts)!.deg})`}
              />
            )}
            <circle cx={pts[0].x} cy={pts[0].y} r="5" fill="#22c55e" />
            <text x={pts[0].x} y={pts[0].y} textAnchor="middle" dominantBaseline="central" fontSize="6.5" fontWeight="800" fill="white">
              {i + 1}
            </text>
          </g>
        ))}
      {mode !== "model" && strokes[0] && <circle cx={strokes[0][0].x} cy={strokes[0][0].y} r="2.6" fill="#22c55e" />}
    </svg>
  );
}

function arrowAt(pts: Pt[]) {
  if (pts.length < 8) return null;
  const i = Math.floor(pts.length * 0.55);
  const a = pts[i];
  const b = pts[Math.min(pts.length - 1, i + 2)];
  return { x: a.x, y: a.y, deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
}
