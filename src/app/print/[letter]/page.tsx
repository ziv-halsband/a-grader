import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LetterGlyph } from "@/components/LetterGlyph";
import { LETTERS, LETTER_BY_ID } from "@/content/letters";
import { PrintButton } from "./PrintButton";

export function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l.id }));
}

export default function PrintLetterPage({ params }: PageProps<"/print/[letter]">) {
  return (
    <Suspense fallback={null}>
      <Sheet params={params} />
    </Suspense>
  );
}

/** One A4 page: header, the model with stroke order, 2 rows to trace, 1 row to write alone. */
async function Sheet({ params }: { params: PageProps<"/print/[letter]">["params"] }) {
  const { letter } = await params;
  const l = LETTER_BY_ID[letter];
  if (!l) notFound();
  return (
    <div className="min-h-dvh bg-slate-100 print:bg-white">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 p-4 print:hidden">
        <Link href="/print" className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm">
          → כל האותיות
        </Link>
        <PrintButton />
      </div>
      <article className="mx-auto flex aspect-[210/297] max-w-[210mm] flex-col gap-[3%] bg-white p-[6%] text-slate-900 shadow print:shadow-none">
        <header className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
          <span className="text-lg">שֵׁם: ____________</span>
          <span className="nikud flex items-center gap-3 text-3xl font-extrabold">
            הָאוֹת {l.name} <span className="text-4xl">{l.emoji}</span>
            <span className="text-2xl font-bold text-slate-500">{l.word}</span>
          </span>
        </header>

        <section className="flex items-center gap-6">
          <LetterGlyph letterId={l.id} mode="model" className="w-[34%] rounded-2xl border-2 border-slate-200" />
          <ol className="nikud flex flex-col gap-2 text-xl">
            <li>1. מַתְחִילִים בַּנְּקֻדָּה הַיְּרֻקָּה.</li>
            <li>2. הוֹלְכִים עִם הַחֵץ.</li>
            <li>3. קַו אַחֲרֵי קַו, לְפִי הַמִּסְפָּרִים.</li>
          </ol>
        </section>

        {(["trace", "trace", "dots"] as const).map((mode, r) => (
          <section key={r} className="flex flex-col gap-1">
            <span className="text-sm text-slate-500">{mode === "trace" ? "✏️ עוֹבְרִים עַל הַנְּקֻדּוֹת" : "✍️ כּוֹתְבִים לְבַד"}</span>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <LetterGlyph key={i} letterId={l.id} mode={mode} className="w-full rounded-xl border border-slate-200" />
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-auto text-center text-xs text-slate-400">מַסַּע הַקְּרִיאָה · דַּף כְּתִיבָה</footer>
      </article>
    </div>
  );
}
