"use client";

/** Previous / dots / next for "learn" screens. The last step shows a big button to the games. */
export function LearnNav({
  i,
  count,
  onPrev,
  onNext,
  onDone,
  doneLabel = "לַמִּשְׂחָק! 🎯",
}: {
  i: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
  onDone: () => void;
  doneLabel?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-6 pb-4">
      <button onClick={onPrev} disabled={i === 0} aria-label="הקודם" className="btn-3d h-16 w-16 bg-white text-3xl disabled:invisible">
        →
      </button>
      <div className="flex gap-2" aria-hidden>
        {Array.from({ length: count }, (_, j) => (
          <span key={j} className={`h-3 rounded-full transition-all ${j === i ? "w-8 bg-accent" : "w-3 bg-white"}`} />
        ))}
      </div>
      {i === count - 1 ? (
        <button onClick={onDone} className="btn-3d bg-accent px-6 py-4 text-2xl font-extrabold text-white">
          {doneLabel}
        </button>
      ) : (
        <button onClick={onNext} aria-label="הבא" className="btn-3d h-16 w-16 bg-accent text-3xl text-white">
          ←
        </button>
      )}
    </div>
  );
}
