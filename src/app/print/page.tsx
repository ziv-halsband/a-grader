import Link from "next/link";
import { LETTERS } from "@/content/letters";

/** For parents: pick a letter to print a practice page (trace with a pencil, then write alone). */
export default function PrintIndexPage() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-extrabold">🖨️ דפי כתיבה להדפסה</h1>
        <Link href="/parents" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">
          לאזור ההורים
        </Link>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        <p className="mb-5 leading-relaxed text-slate-600">
          דף לכל אות: דוגמה עם סדר הקווים, שורות להעתקה בעיפרון על קו מנוקד, ושורה לכתיבה לבד. כדאי לכתוב יחד עם
          הילד/ה, אחרי שהאות נלמדה במשחק.
        </p>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-9">
          {LETTERS.map((l) => (
            <Link
              key={l.id}
              href={`/print/${l.id}`}
              className="flex aspect-square items-center justify-center rounded-2xl bg-white text-4xl font-extrabold shadow-sm hover:bg-indigo-50"
              aria-label={`דף להדפסה: ${l.name}`}
            >
              {l.char}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
