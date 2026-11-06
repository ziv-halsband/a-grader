import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WriteSheet } from "@/components/worksheets/Sheets";
import { LETTERS, LETTER_BY_ID } from "@/content/letters";
import { PrintButton } from "./PrintButton";

export function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l.id }));
}

/** The old one-letter writing page (kept for links): the same ✍️ sheet as in /print. */
export default function PrintLetterPage({ params }: PageProps<"/print/[letter]">) {
  return (
    <Suspense fallback={null}>
      <Sheet params={params} />
    </Suspense>
  );
}

async function Sheet({ params }: { params: PageProps<"/print/[letter]">["params"] }) {
  const { letter } = await params;
  const l = LETTER_BY_ID[letter];
  if (!l) notFound();
  return (
    <div className="min-h-dvh bg-slate-100 print:bg-white">
      <div className="ws-noprint mx-auto flex max-w-[210mm] items-center justify-between gap-3 p-4 print:hidden">
        <Link href={`/print?src=letter:${l.id}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm">
          → לכל דפי העבודה
        </Link>
        <PrintButton />
      </div>
      <div className="ws-preview">
        <WriteSheet letterId={l.id} head={{}} />
      </div>
    </div>
  );
}
