/** A pointing hand that shows a 5-year-old what to tap (instead of explaining in words). Parent must be `relative`. */
export function PointHand({ className = "-bottom-6 -left-4" }: { className?: string }) {
  return (
    <span aria-hidden className={`anim-point pointer-events-none absolute z-20 text-5xl drop-shadow-md ${className}`}>
      👆
    </span>
  );
}
