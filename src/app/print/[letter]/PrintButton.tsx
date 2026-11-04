"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-indigo-600 px-5 py-2 font-bold text-white">
      🖨️ הדפסה
    </button>
  );
}
