"use client";

export type Step = { id: string; icon: string; label: string };

/**
 * The station's steps as real buttons: "learn" is always open (so the child can go back to the letters
 * in the middle of a game), games open once reached, and everything is open on a replayed station.
 */
export function StationSteps({
  steps,
  current,
  reached,
  completed = reached,
  finished,
  locked = [],
  onLocked,
  onPick,
}: {
  steps: Step[];
  current: string;
  /** Index of the furthest step open (all steps up to it can be picked). */
  reached: number;
  /** Steps before this index get a ✓ (defaults to `reached`; differs in practice mode, where all are open). */
  completed?: number;
  /** Step ids actually finished in this visit; when given, only these get a ✓. */
  finished?: string[];
  /** Steps that stay closed even in practice mode (the prize, until every other step is finished). */
  locked?: string[];
  /** Tapped a locked step. */
  onLocked?: () => void;
  onPick: (id: string) => void;
}) {
  const at = steps.findIndex((s) => s.id === current);
  return (
    <nav aria-label="שלבי התחנה" className="mx-auto mt-3 flex w-full max-w-xl justify-center gap-1 px-4 sm:gap-3">
      {steps.map((s, i) => {
        const isLocked = locked.includes(s.id);
        const open = !isLocked && (i === 0 || i <= reached);
        const isNow = i === at;
        return (
          <button
            key={s.id}
            onClick={() => (isLocked ? onLocked?.() : open && !isNow && onPick(s.id))}
            disabled={!open && !isLocked}
            aria-current={isNow ? "step" : undefined}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition ${
              isNow ? "bg-white shadow-md" : open ? "bg-white/50 hover:bg-white/80" : "opacity-40 grayscale"
            }`}
          >
            <span className={`relative text-2xl transition ${isNow ? "scale-125" : ""}`} aria-hidden>
              {s.icon}
              {isLocked && <span className="absolute -top-1 -left-2 text-sm">🔒</span>}
              {(finished ? finished.includes(s.id) : i < completed) && !isNow && (
                <span className="absolute -top-1 -left-2 rounded-full bg-green-500 px-1 text-[10px] text-white">✓</span>
              )}
            </span>
            <span className="nikud text-xs font-bold leading-tight">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
